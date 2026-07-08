import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { ATSReport } from "@/models/ATSReport";

export async function POST(request: NextRequest) {
  try {
    const { resumeId, jobDescriptionText, atsReportId } = await request.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resumeId parameter" }, { status: 400 });
    }

    await connectToDatabase();
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    // 1. Check if report already has cached Interview Questions
    let reportDoc = null;
    if (atsReportId) {
      reportDoc = await ATSReport.findById(atsReportId);
      if (reportDoc && reportDoc.interviewQuestions && reportDoc.interviewQuestions.hr && reportDoc.interviewQuestions.hr.length > 0) {
        return NextResponse.json({ success: true, data: reportDoc.interviewQuestions });
      }
    }

    // 2. Fetch Resume
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const prompt = `
      You are an expert interviewer. Generate a structured list of interview questions based on the candidate's resume and job description (if provided).
      Generate:
      1. HR / Behavioral Questions
      2. Technical Questions
      3. Project-specific Questions

      For each question, provide a brief tip or hint on what the candidate should highlight in their answer.
      Return the output as a valid JSON object matching this schema:
      {
        "hr": [
          { "question": "Question text", "hint": "Answer guidance" }
        ],
        "technical": [
          { "question": "Question text", "hint": "Answer guidance" }
        ],
        "behavioral": [
          { "question": "Question text", "hint": "Answer guidance" }
        ]
      }

      Candidate Resume:
      ${JSON.stringify(resume.toObject(), null, 2)}

      Job Description:
      ${jobDescriptionText || "None provided"}
    `;

    const generated = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      jsonMode: true
    });

    // 3. Cache inside reportDoc if available
    if (reportDoc) {
      reportDoc.interviewQuestions = {
        hr: generated.hr || [],
        technical: generated.technical || [],
        behavioral: generated.behavioral || []
      };
      await reportDoc.save();
    }

    return NextResponse.json({ success: true, data: generated });
  } catch (error: any) {
    console.error("AI Interview Generator error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate interview questions" }, { status: 500 });
  }
}
