import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { ATSReport } from "@/models/ATSReport";
import { JobDescription } from "@/models/JobDescription";
import { analyzeResumeWithRules } from "@/lib/ats-engine";
import { generateWithGemini } from "@/lib/gemini";
import { RECRUITER_SIMULATOR_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    const { resumeId, jobDescriptionText } = await request.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resumeId parameter" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch Resume
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    let jobKeywords: string[] = [];
    let savedJd = null;

    // 2. Extract JD Keywords using Gemini if text is supplied
    if (jobDescriptionText && jobDescriptionText.trim()) {
      const keywordPrompt = `
        Extract the top 10-15 technical skills, programming languages, databases, or cloud tools from the following job description.
        Return the result as a flat JSON string array only, like this: ["React", "Python", "Docker"]. Do not write markdown blocks.
        
        Job Description:
        ${jobDescriptionText}
      `;

      try {
        const extracted = await generateWithGemini({
          prompt: keywordPrompt,
          model: "gemini-2.5-flash",
          jsonMode: true
        });
        
        if (Array.isArray(extracted)) {
          jobKeywords = extracted;
        }

        // Save target Job Description to DB
        savedJd = new JobDescription({
          userId,
          rawText: jobDescriptionText,
          extractedKeywords: jobKeywords
        });
        await savedJd.save();
      } catch (err) {
        console.error("Failed to extract JD keywords:", err);
      }
    }

    // 3. Compute Rule-based scores
    const ruleReport = analyzeResumeWithRules(resume.toObject(), jobKeywords);

    // 4. Compute AI Recruiter Simulation scores using Gemini 2.5 Pro
    const simPrompt = `
      Evaluate this resume:
      ${JSON.stringify(resume.toObject())}

      Target Job Description (Keywords to match: ${jobKeywords.join(", ")}):
      ${jobDescriptionText || "None specified. Evaluate as general industry standard for: " + (resume.targetRole || "Software Developer")}
    `;

    let recruiterSimulation = {
      atsScanner: { score: 70, feedback: ["Baseline scan complete"], recommendation: "Maybe" },
      hrRecruiter: { score: 70, feedback: ["Review complete"], recommendation: "Maybe" },
      hiringManager: { score: 70, feedback: ["Technical verification complete"], recommendation: "Maybe" }
    };

    try {
      const simResult = await generateWithGemini({
        prompt: simPrompt,
        model: "gemini-2.5-pro",
        jsonMode: true,
        systemInstruction: RECRUITER_SIMULATOR_PROMPT
      });
      if (simResult && simResult.atsScanner) {
        recruiterSimulation = simResult;
      }
    } catch (err) {
      console.error("Failed to generate AI recruiter simulation:", err);
    }

    // 5. Build and Save ATSReport document
    const atsReport = new ATSReport({
      resumeId,
      jobDescriptionId: savedJd ? savedJd._id : null,
      jobDescriptionText: jobDescriptionText || "",
      overallScore: Math.round(
        (ruleReport.overallScore * 0.6) + 
        (((recruiterSimulation.atsScanner.score + recruiterSimulation.hrRecruiter.score + recruiterSimulation.hiringManager.score) / 3) * 0.4)
      ),
      breakdown: {
        ...ruleReport.breakdown,
        atsScore: Math.round((ruleReport.breakdown.atsScore * 0.6) + (recruiterSimulation.atsScanner.score * 0.4)),
        recruiterScore: Math.round((ruleReport.breakdown.recruiterScore * 0.6) + (recruiterSimulation.hrRecruiter.score * 0.4))
      },
      missingKeywords: ruleReport.missingKeywords,
      matchedKeywords: ruleReport.matchedKeywords,
      recruiterRedFlags: ruleReport.recruiterRedFlags,
      improvements: ruleReport.improvements,
      recruiterSimulation
    });

    await atsReport.save();

    return NextResponse.json({ success: true, data: atsReport });
  } catch (error: any) {
    console.error("ATS Audit error:", error);
    return NextResponse.json({ error: error.message || "Failed to audit resume" }, { status: 500 });
  }
}
