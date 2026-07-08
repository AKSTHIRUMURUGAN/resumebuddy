import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { CareerVault } from "@/models/CareerVault";
import { Resume } from "@/models/Resume";
import { normalizeResumeData } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!url || !url.trim()) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load URL webpage: ${response.statusText}`);
    }

    const html = await response.text();

    // Strip scripts, styles, and markup tags
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Crop content if it's exceptionally long to prevent token overflows
    if (cleanText.length > 30000) {
      cleanText = cleanText.substring(0, 30000);
    }

    const systemInstruction = `
      You are an expert career data extractor. Given the raw text content of a portfolio website, identify candidate skills, experiences, projects, education, and credentials.
      Map them to a clean JSON resume schema. Do not guess parameters; only map what exists.
    `;

    const prompt = `
      Analyze this website raw text content and extract resume details. Map to this JSON schema:
      {
        "personalInfo": {
          "fullName": "Name", "email": "Email", "phone": "Phone", "location": "Location",
          "website": "${url}", "linkedin": "", "github": "", "portfolio": "${url}", "summary": "About me profile details"
        },
        "skills": [{ "name": "Skill name", "category": "Frontend/Backend/etc" }],
        "experience": [{ "company": "Company", "position": "Title", "startDate": "", "endDate": "", "highlights": [] }],
        "projects": [{ "title": "Project Title", "description": "Details", "url": "", "technologies": [], "highlights": [] }],
        "education": [{ "institution": "School", "degree": "Degree", "fieldOfStudy": "" }],
        "certifications": [{ "name": "Certification name", "issuer": "Issuer" }]
      }

      Website Content:
      ${cleanText}
    `;

    const extracted = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      jsonMode: true,
      systemInstruction
    });

    // Normalize output format
    const extractedData = normalizeResumeData(extracted);

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
      title: `${extractedData.personalInfo?.fullName || "Portfolio"} Resume`,
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
    console.error("Portfolio URL import error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse portfolio webpage" }, { status: 500 });
  }
}
