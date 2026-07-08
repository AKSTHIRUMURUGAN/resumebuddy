import { NextRequest, NextResponse } from "next/server";
import { parseDocument } from "@/lib/parser";
import { extractResumeData } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { CareerVault } from "@/models/CareerVault";
import { Resume } from "@/models/Resume";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const userId = request.headers.get("x-user-id") || "mock-user-123";
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse file buffer to text
    const text = await parseDocument(buffer, file.type);
    
    // Extract structured JSON via Gemini
    const extractedData = await extractResumeData(text);

    // Save to CareerVault
    await connectToDatabase();
    let vault = await CareerVault.findOne({ userId });
    if (!vault) {
      vault = new CareerVault({ 
        userId, 
        skills: extractedData.skills || [],
        experience: extractedData.experience || [],
        projects: extractedData.projects || [],
        education: extractedData.education || [],
        certifications: extractedData.certifications || [],
        achievements: extractedData.achievements || [],
        languages: extractedData.languages || []
      });
    } else {
      vault.skills = extractedData.skills || [];
      vault.experience = extractedData.experience || [];
      vault.projects = extractedData.projects || [];
      vault.education = extractedData.education || [];
      vault.certifications = extractedData.certifications || [];
      vault.achievements = extractedData.achievements || [];
      vault.languages = extractedData.languages || [];
      vault.updatedAt = new Date();
    }
    await vault.save();

    // Group extracted skills by category
    const skillsMap: Record<string, string[]> = {};
    (extractedData.skills || []).forEach((s: any) => {
      const categoryName = s.category || "Technical Skills";
      if (!skillsMap[categoryName]) {
        skillsMap[categoryName] = [];
      }
      if (s.name && !skillsMap[categoryName].includes(s.name)) {
        skillsMap[categoryName].push(s.name);
      }
    });

    const structuredSkills = Object.keys(skillsMap).map((catName) => ({
      category: catName,
      items: skillsMap[catName]
    }));

    // Create a base resume using extracted info
    const newResume = new Resume({
      userId,
      title: `${extractedData.personalInfo?.fullName || "My"} Resume - Imported`,
      personalInfo: extractedData.personalInfo || {},
      skills: structuredSkills,
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
      certifications: (extractedData.certifications || []).map((c: any) => c.name),
      achievements: (extractedData.achievements || []).map((a: any) => a.title),
      languages: (extractedData.languages || []).map((l: any) => l.language),
    });
    await newResume.save();

    return NextResponse.json({ success: true, vault, resume: newResume });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to process upload" }, { status: 500 });
  }
}
