import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ResumeVersion } from "@/models/ResumeVersion";
import { generateWithGemini } from "@/lib/gemini";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, props: RouteContext) {
  try {
    const { id } = await props.params;
    const { versionA, versionB } = await request.json();

    if (!versionA || !versionB) {
      return NextResponse.json({ error: "Missing versionA or versionB parameter" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Load both version snapshots
    const snapA = await ResumeVersion.findOne({ resumeId: id, versionNumber: versionA });
    const snapB = await ResumeVersion.findOne({ resumeId: id, versionNumber: versionB });

    if (!snapA || !snapB) {
      return NextResponse.json({ error: "One or both version snapshots not found" }, { status: 404 });
    }

    const systemInstruction = `
      You are an expert resume version control editor. Given two resume draft snapshots (A and B), analyze the changes.
      Detail what was added, what was deleted, and formatting adjustments.
      Return the output as a valid JSON object matching this schema:
      {
        "scoreDelta": "+5 points",
        "additions": ["List of items added in B vs A"],
        "deletions": ["List of items deleted in B vs A"],
        "modifications": ["List of formatting or minor text adjustments"]
      }
    `;

    const prompt = `
      Compare Resume Snapshot Version A (older) and Version B (newer):

      Version A (V${versionA}):
      ${JSON.stringify({
        title: snapA.snapshot.title,
        personalInfo: snapA.snapshot.personalInfo,
        skills: snapA.snapshot.skills,
        experience: snapA.snapshot.experience,
        projects: snapA.snapshot.projects
      }, null, 2)}

      Version B (V${versionB}):
      ${JSON.stringify({
        title: snapB.snapshot.title,
        personalInfo: snapB.snapshot.personalInfo,
        skills: snapB.snapshot.skills,
        experience: snapB.snapshot.experience,
        projects: snapB.snapshot.projects
      }, null, 2)}
    `;

    const diffResult = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      jsonMode: true,
      systemInstruction
    });

    return NextResponse.json({ success: true, data: diffResult });
  } catch (error: any) {
    console.error("Resume version diff error:", error);
    return NextResponse.json({ error: error.message || "Failed to compare versions" }, { status: 500 });
  }
}
