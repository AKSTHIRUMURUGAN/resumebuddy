import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { ATSReport } from "@/models/ATSReport";
import { COVER_LETTER_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { resumeId, jobDescriptionText, atsReportId } = await request.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resumeId parameter" }, { status: 400 });
    }

    await connectToDatabase();
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    // 1. Check if report already has cached Cover Letter
    let reportDoc = null;
    if (atsReportId) {
      reportDoc = await ATSReport.findById(atsReportId);
      if (reportDoc && reportDoc.coverLetter && reportDoc.coverLetter.coverLetter) {
        return NextResponse.json({ success: true, data: reportDoc.coverLetter });
      }
    }

    // 2. Fetch Resume
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const prompt = `
      Candidate Resume details:
      ${JSON.stringify(resume.toObject(), null, 2)}
      
      Target Job Description:
      ${jobDescriptionText || "General industry standards for role: " + (resume.targetRole || "Software Developer")}
    `;

    const generated = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      jsonMode: true,
      systemInstruction: COVER_LETTER_PROMPT
    });

    // 3. Cache inside reportDoc if available
    if (reportDoc) {
      reportDoc.coverLetter = {
        coverLetter: generated.coverLetter || "",
        coldEmail: generated.coldEmail || "",
        linkedinMessage: generated.linkedinMessage || ""
      };
      await reportDoc.save();
    }

    return NextResponse.json({ success: true, data: generated });
  } catch (error: any) {
    console.error("Cover Letter Generator error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate cover letter details" }, { status: 500 });
  }
}
