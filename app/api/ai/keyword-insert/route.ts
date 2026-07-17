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
      // union skills to not delete existing ones, respecting both flat string list and categorized object list
      resume.skills = unionSkills(resume.skills || [], generated.skills || []);
    }

    resume.updatedAt = new Date();
    await resume.save();

    return NextResponse.json({ success: true, data: resume });
  } catch (error: any) {
    console.error("AI Keyword Inserter error:", error);
    return NextResponse.json({ error: error.message || "Failed to insert keywords intelligently" }, { status: 500 });
  }
}

function unionSkills(existingSkills: any[], newSkills: string[]): any[] {
  if (!existingSkills || !Array.isArray(existingSkills)) {
    return newSkills;
  }

  // Check if existingSkills has categorized object format: [{ category: string, items: string[] }]
  const isCategorized = existingSkills.length > 0 && 
    typeof existingSkills[0] === "object" && 
    existingSkills[0] !== null && 
    "category" in existingSkills[0];

  if (isCategorized) {
    // Collect all existing items to check for duplicates (case-insensitive)
    const existingItemsLower = new Set<string>();
    existingSkills.forEach((cat: any) => {
      if (Array.isArray(cat.items)) {
        cat.items.forEach((item: any) => {
          if (typeof item === "string") {
            existingItemsLower.add(item.toLowerCase());
          }
        });
      }
    });

    // Determine which new skills are actually new
    const skillsToAdd = newSkills.filter(sk => typeof sk === "string" && !existingItemsLower.has(sk.toLowerCase()));

    if (skillsToAdd.length > 0) {
      // Add them to the first category
      const result = existingSkills.map((cat: any, idx: number) => {
        if (idx === 0) {
          return {
            ...cat,
            items: [...(cat.items || []), ...skillsToAdd]
          };
        }
        return cat;
      });
      return result;
    }
    return existingSkills;
  } else {
    // Flat array of strings
    const existingLower = new Set(existingSkills.map((s: any) => typeof s === "string" ? s.toLowerCase() : ""));
    const result = [...existingSkills];
    newSkills.forEach(sk => {
      if (typeof sk === "string" && !existingLower.has(sk.toLowerCase())) {
        result.push(sk);
      }
    });
    return result;
  }
}
