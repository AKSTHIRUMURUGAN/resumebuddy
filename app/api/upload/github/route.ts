import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { CareerVault } from "@/models/CareerVault";
import { Resume } from "@/models/Resume";
import { GITHUB_ANALYZE_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Missing GitHub username" }, { status: 400 });
    }

    // Fetch public repos from GitHub
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=8`, {
      headers: {
        "User-Agent": "Resume-Buddy-App"
      }
    });

    if (!reposRes.ok) {
      throw new Error(`GitHub user ${username} not found or rate limited.`);
    }

    const repos = await reposRes.json();
    const reposData = repos.map((r: any) => ({
      name: r.name,
      description: r.description || "No description provided",
      url: r.html_url,
      language: r.language || "TypeScript"
    }));

    // Call Gemini to synthesize projects highlights
    const projectSummaries = await generateWithGemini({
      prompt: `Repositories list data:\n\n${JSON.stringify(reposData, null, 2)}`,
      model: "gemini-2.5-flash",
      jsonMode: true,
      systemInstruction: GITHUB_ANALYZE_PROMPT
    });

    await connectToDatabase();
    
    // Save to CareerVault
    let vault = await CareerVault.findOne({ userId });
    if (!vault) {
      vault = new CareerVault({
        userId,
        projects: projectSummaries,
        skills: Array.from(new Set(reposData.map((r: any) => r.language).filter(Boolean)))
      });
    } else {
      vault.projects = [...(vault.projects || []), ...projectSummaries];
      const oldSkills = new Set((vault.skills || []).map((s: any) => s.name || s));
      reposData.forEach((r: any) => { if(r.language) oldSkills.add(r.language); });
      vault.skills = Array.from(oldSkills);
      vault.updatedAt = new Date();
    }
    await vault.save();

    // Create a base Tech resume
    const newResume = new Resume({
      userId,
      title: `${username} GitHub Tech Resume`,
      templateId: "tech",
      personalInfo: {
        fullName: username,
        github: `https://github.com/${username}`
      },
      skills: Array.from(new Set(reposData.map((r: any) => r.language).filter(Boolean))),
      projects: projectSummaries.map((p: any) => ({
        title: p.title,
        technologies: p.technologies || [],
        highlights: p.highlights || [],
        url: p.url || ""
      }))
    });
    await newResume.save();

    return NextResponse.json({ success: true, vault, resume: newResume });
  } catch (error: any) {
    console.error("GitHub import error:", error);
    return NextResponse.json({ error: error.message || "Failed to import GitHub data" }, { status: 500 });
  }
}
