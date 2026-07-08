import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { ATSReport } from "@/models/ATSReport";

export async function POST(request: NextRequest) {
  try {
    const { headline, about, resumeId, atsReportId } = await request.json();
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resumeId parameter" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Check if report already has cached LinkedIn optimization
    let reportDoc = null;
    if (atsReportId) {
      reportDoc = await ATSReport.findById(atsReportId);
      if (reportDoc && reportDoc.linkedinOptimization && reportDoc.linkedinOptimization.score) {
        return NextResponse.json({ success: true, data: reportDoc.linkedinOptimization });
      }
    }

    // 2. Fetch Resume
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const systemInstruction = `
      You are an expert LinkedIn profile optimization coach. Given a candidate's resume and their current LinkedIn Headline and About summary, audit their profile.
      Provide:
      1. Score out of 100 representing profile completeness and keyword match.
      2. 2 high-impact optimized Headline suggestions.
      3. 2 compelling About summary rewrite options based on the resume credentials.
      Return the output as a valid JSON object matching this schema:
      {
        "score": 75,
        "critique": ["List of suggestions"],
        "headlineOptions": ["Option 1", "Option 2"],
        "aboutOptions": ["Option 1", "Option 2"]
      }
    `;

    const prompt = `
      Current LinkedIn Details:
      Headline: "${headline || "None provided"}"
      About summary: "${about || "None provided"}"

      Candidate Resume credentials:
      ${JSON.stringify({
        skills: resume.skills,
        experience: resume.experience,
        projects: resume.projects
      }, null, 2)}
    `;

    const response = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      jsonMode: true,
      systemInstruction
    });

    // 3. Cache inside reportDoc if available
    if (reportDoc) {
      reportDoc.linkedinOptimization = {
        score: response.score || 0,
        critique: response.critique || [],
        headlineOptions: response.headlineOptions || [],
        aboutOptions: response.aboutOptions || []
      };
      await reportDoc.save();
    }

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("LinkedIn Optimizer error:", error);
    return NextResponse.json({ error: error.message || "Failed to optimize LinkedIn profile" }, { status: 500 });
  }
}
