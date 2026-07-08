import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { CareerVault } from "@/models/CareerVault";
import { Resume } from "@/models/Resume";
import { LINKEDIN_PARSING_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { rawText } = await request.json();
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: "Missing rawText parameter" }, { status: 400 });
    }

    // Call Gemini to parse raw text
    const extractedData = await generateWithGemini({
      prompt: `Parse this raw LinkedIn profile text:\n\n${rawText}`,
      model: "gemini-2.5-flash",
      jsonMode: true,
      systemInstruction: LINKEDIN_PARSING_PROMPT
    });

    await connectToDatabase();
    
    // Save to CareerVault
    let vault = await CareerVault.findOne({ userId });
    if (!vault) {
      vault = new CareerVault({ userId, ...extractedData });
    } else {
      vault.skills = [...new Set([...(vault.skills || []).map((s: any) => s.name || s), ...(extractedData.skills || []).map((s: any) => s.name || s)])];
      vault.experience = [...(vault.experience || []), ...(extractedData.experience || [])];
      vault.projects = [...(vault.projects || []), ...(extractedData.projects || [])];
      vault.education = [...(vault.education || []), ...(extractedData.education || [])];
      vault.certifications = [...(vault.certifications || []), ...(extractedData.certifications || [])];
      vault.updatedAt = new Date();
    }
    await vault.save();

    // Create a base resume using extracted info
    const newResume = new Resume({
      userId,
      title: `${extractedData.personalInfo?.fullName || "LinkedIn"} Resume`,
      personalInfo: extractedData.personalInfo || {},
      skills: (extractedData.skills || []).map((s: any) => s.name || s),
      experience: (extractedData.experience || []).map((exp: any) => ({
        company: exp.company,
        position: exp.position,
        duration: exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.endDate || "Present"),
        location: exp.location || "",
        highlights: exp.highlights || []
      })),
      projects: (extractedData.projects || []).map((p: any) => ({
        title: p.title,
        technologies: p.technologies || [],
        highlights: p.highlights || [],
        url: p.url || ""
      })),
      education: (extractedData.education || []).map((edu: any) => ({
        institution: edu.institution,
        degree: edu.degree && edu.fieldOfStudy ? `${edu.degree} in ${edu.fieldOfStudy}` : (edu.degree || edu.fieldOfStudy || ""),
        duration: edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : (edu.startDate || edu.endDate || ""),
        gpa: edu.gpa || ""
      })),
      certifications: (extractedData.certifications || []).map((c: any) => c.name || c)
    });
    await newResume.save();

    return NextResponse.json({ success: true, vault, resume: newResume });
  } catch (error: any) {
    console.error("LinkedIn import error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse LinkedIn text" }, { status: 500 });
  }
}
