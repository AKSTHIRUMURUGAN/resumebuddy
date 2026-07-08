import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { KEYWORD_INSERTER_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { resumeId, missingKeywords = [] } = await request.json();

    if (!resumeId || missingKeywords.length === 0) {
      return NextResponse.json({ error: "Missing resumeId or missingKeywords parameter" }, { status: 400 });
    }

    await connectToDatabase();
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    const resume = await Resume.findOne({ _id: resumeId, userId });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const prompt = `
      Current Resume:
      ${JSON.stringify({
        experience: resume.experience,
        projects: resume.projects,
        skills: resume.skills
      }, null, 2)}

      Missing Keywords to Insert:
      ${JSON.stringify(missingKeywords)}

      Please return the response as a valid JSON object matching the resume schema structure containing updated fields:
      {
        "experience": [
          { "company": "Company", "position": "Position", "duration": "Duration", "location": "Location", "highlights": ["Updated highlight 1", "Updated highlight 2"] }
        ],
        "projects": [
          { "title": "Title", "technologies": ["UpdatedTech1", "UpdatedTech2"], "highlights": ["Updated highlight 1"], "url": "URL" }
        ],
        "skills": ["UpdatedSkill1", "UpdatedSkill2"]
      }
    `;

    const generated = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      jsonMode: true,
      systemInstruction: KEYWORD_INSERTER_PROMPT
    });

    if (generated.experience) {
      resume.experience = generated.experience;
    }
    if (generated.projects) {
      resume.projects = generated.projects;
    }
    if (generated.skills) {
      // union skills to not delete existing ones
      const oldSkills = new Set(resume.skills || []);
      (generated.skills || []).forEach((sk: string) => oldSkills.add(sk));
      resume.skills = Array.from(oldSkills);
    }

    resume.updatedAt = new Date();
    await resume.save();

    return NextResponse.json({ success: true, data: resume });
  } catch (error: any) {
    console.error("AI Keyword Inserter error:", error);
    return NextResponse.json({ error: error.message || "Failed to insert keywords intelligently" }, { status: 500 });
  }
}
