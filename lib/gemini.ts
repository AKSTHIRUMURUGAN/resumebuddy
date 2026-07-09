import { GoogleGenerativeAI } from "@google/generative-ai";

export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-1.5-flash" | "gemini-1.5-pro";

interface GenerateTextOptions {
  prompt: string;
  model?: GeminiModel;
  jsonMode?: boolean;
  systemInstruction?: string;
}

// Initialize the Google Generative AI client
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn("Warning: Neither GEMINI_API_KEY nor GOOGLE_API_KEY environment variable is set.");
}
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function generateWithGemini({
  prompt,
  jsonMode = false,
  systemInstruction,
}: GenerateTextOptions) {
  try {
    // Force model to gemini-2.5-flash as requested
    const modelInstance = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined,
      systemInstruction: systemInstruction || undefined
    });

    const result = await modelInstance.generateContent(prompt);
    const response = await result.response;
    const textContent = response.text();

    if (!textContent) {
      throw new Error("Invalid response format received from Gemini API");
    }

    if (jsonMode) {
      try {
        let cleanText = textContent.trim();
        // Remove code block backticks if they are returned by the model
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();
        return JSON.parse(cleanText);
      } catch (err) {
        console.error("Failed to parse Gemini output as JSON. Output was:", textContent);
        throw new Error("Gemini response was not valid JSON in jsonMode");
      }
    }

    return textContent;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (
      error.status === 429 ||
      error.statusCode === 429 ||
      error.message?.includes("429") ||
      error.message?.toLowerCase().includes("quota") ||
      error.message?.toLowerCase().includes("rate limit")
    ) {
      throw new Error("AI Quota Exceeded. Please try again after a few minutes.");
    }
    throw error;
  }
}


/**
 * Extract structured resume data from unstructured raw text using Gemini.
 */
export async function extractResumeData(rawText: string): Promise<any> {
  const systemInstruction = `
    You are an expert recruiter and career data parsing assistant.
    Your task is to analyze the provided raw resume text and extract all profile details into a clean, structured JSON format.
    Do not guess or fabricate information; only extract what is present or reasonably implied in the text.
    Return the response as a single, valid JSON object matching the requested schema.
  `;

  const prompt = `
    Extract all resume sections from the text below. Map them exactly to this JSON schema:

    {
      "personalInfo": {
        "fullName": "String or empty",
        "email": "String or empty",
        "phone": "String or empty",
        "location": "String or empty",
        "website": "String or empty",
        "linkedin": "String or empty",
        "github": "String or empty",
        "portfolio": "String or empty",
        "summary": "Professional summary or profile statement if present, otherwise empty"
      },
      "skills": [
        {
          "name": "Skill name (e.g. React, Docker)",
          "category": "e.g., Frontend, Backend, DevOps, Language, Soft Skill",
          "proficiency": "beginner", "intermediate", or "expert"
        }
      ],
      "experience": [
        {
          "company": "Company Name",
          "position": "Job Title",
          "startDate": "Start date (e.g. June 2021 or 2021-06)",
          "endDate": "End date or 'Present'",
          "current": true or false,
          "highlights": ["Array of bullet points summarizing key actions, technologies, and achievements"],
          "location": "e.g. New York, NY",
          "tags": ["Array of tags like Frontend, AWS, Python matching tools used"]
        }
      ],
      "projects": [
        {
          "title": "Project Title",
          "description": "Brief summary",
          "url": "Project URL or empty",
          "technologies": ["Array of techs like React, Node.js"],
          "highlights": ["Array of bullets showing what was built and impact metrics"],
          "startDate": "Date string or empty",
          "endDate": "Date string or empty"
        }
      ],
      "education": [
        {
          "institution": "University/College Name",
          "degree": "Degree (e.g. Bachelor of Science)",
          "fieldOfStudy": "Field (e.g. Computer Science)",
          "startDate": "Date string or empty",
          "endDate": "Date string or empty",
          "gpa": "GPA or empty"
        }
      ],
      "certifications": [
        {
          "name": "Certification Name",
          "issuer": "Issuer Organization (e.g. AWS, Oracle)",
          "issueDate": "Date or empty",
          "expiryDate": "Date or empty",
          "credentialUrl": "URL or empty"
        }
      ],
      "achievements": [
        {
          "title": "Achievement Title (e.g., Hackathon Winner)",
          "description": "Details or empty",
          "date": "Date or empty"
        }
      ],
      "languages": [
        {
          "language": "Language name (e.g. English, Spanish)",
          "proficiency": "e.g. Native, Professional, Conversational"
        }
      ]
    }

    Resume Raw Text:
    ---
    ${rawText}
    ---
  `;

  const parsed = await generateWithGemini({
    prompt,
    model: "gemini-2.5-flash",
    jsonMode: true,
    systemInstruction,
  });

  return normalizeResumeData(parsed);
}

function toArray(val: any): any[] {
  return Array.isArray(val) ? val : [];
}

function toString(val: any): string {
  if (val === undefined || val === null) return "";
  return String(val)
    .replace(/â€“|â€”|—|–/g, "-")
    .replace(/â€˜|â€™|’|‘/g, "'")
    .replace(/â€œ|â€|“|”/g, '"')
    .replace(/Â/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url: any): string {
  const raw = toString(url);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export function normalizeResumeData(raw: any): any {
  if (!raw || typeof raw !== "object") raw = {};

  const cleanPersonalInfo = {
    fullName: toString(raw.personalInfo?.fullName || raw.personalInfo?.name || ""),
    email: toString(raw.personalInfo?.email || ""),
    phone: toString(raw.personalInfo?.phone || ""),
    location: toString(raw.personalInfo?.location || ""),
    website: normalizeUrl(raw.personalInfo?.website || ""),
    linkedin: normalizeUrl(raw.personalInfo?.linkedin || ""),
    github: normalizeUrl(raw.personalInfo?.github || ""),
    portfolio: normalizeUrl(raw.personalInfo?.portfolio || ""),
    summary: toString(raw.personalInfo?.summary || raw.summary?.summary || "")
  };

  const cleanSkills = toArray(raw.skills).map((s: any) => {
    if (typeof s === "string") {
      return { name: toString(s), category: "Other", proficiency: "intermediate" };
    }
    return {
      name: toString(s?.name || s?.skill || ""),
      category: toString(s?.category || "Other"),
      proficiency: ["beginner", "intermediate", "expert"].includes(s?.proficiency) 
        ? s.proficiency 
        : "intermediate"
    };
  }).filter((s: any) => s.name);

  const cleanExperience = toArray(raw.experience).map((exp: any) => {
    let highlights: string[] = [];
    if (Array.isArray(exp.highlights)) {
      highlights = exp.highlights.map(toString).filter(Boolean);
    } else if (Array.isArray(exp.achievements)) {
      highlights = exp.achievements.map(toString).filter(Boolean);
    } else if (exp.achievements && Array.isArray(exp.achievements.points)) {
      highlights = exp.achievements.points.map(toString).filter(Boolean);
    }

    return {
      company: toString(exp.company || ""),
      position: toString(exp.position || exp.jobTitle || ""),
      startDate: toString(exp.startDate || ""),
      endDate: toString(exp.endDate || ""),
      current: !!exp.current || toString(exp.endDate).toLowerCase().includes("present"),
      highlights,
      location: toString(exp.location || ""),
      tags: toArray(exp.tags).map(toString).filter(Boolean)
    };
  }).filter((exp: any) => exp.company && exp.position);

  const cleanProjects = toArray(raw.projects).map((p: any) => {
    let highlights: string[] = [];
    if (Array.isArray(p.highlights)) {
      highlights = p.highlights.map(toString).filter(Boolean);
    } else if (p.keyFeatures && Array.isArray(p.keyFeatures.points)) {
      highlights = p.keyFeatures.points.map(toString).filter(Boolean);
    }

    let technologies: string[] = [];
    if (Array.isArray(p.technologies)) {
      technologies = p.technologies.map(toString).filter(Boolean);
    } else if (Array.isArray(p.skillsUsed)) {
      technologies = p.skillsUsed.map(toString).filter(Boolean);
    } else if (typeof p.techStack === "string") {
      technologies = p.techStack.split(",").map((t: string) => toString(t)).filter(Boolean);
    }

    return {
      title: toString(p.title || p.name || ""),
      description: toString(p.description || ""),
      url: normalizeUrl(p.url || p.liveLink || ""),
      technologies,
      highlights,
      startDate: toString(p.startDate || ""),
      endDate: toString(p.endDate || "")
    };
  }).filter((p: any) => p.title);

  const cleanEducation = toArray(raw.education).map((edu: any) => ({
    institution: toString(edu.institution || edu.school || ""),
    degree: toString(edu.degree || ""),
    fieldOfStudy: toString(edu.fieldOfStudy || ""),
    startDate: toString(edu.startDate || ""),
    endDate: toString(edu.endDate || ""),
    gpa: toString(edu.gpa || "")
  })).filter((edu: any) => edu.institution && edu.degree);

  const cleanCertifications = toArray(raw.certifications).map((c: any) => ({
    name: toString(c?.name || ""),
    issuer: toString(c?.issuer || ""),
    issueDate: toString(c?.issueDate || ""),
    expiryDate: toString(c?.expiryDate || ""),
    credentialUrl: normalizeUrl(c?.credentialUrl || "")
  })).filter((c: any) => c.name);

  const cleanAchievements = toArray(raw.achievements).map((a: any) => ({
    title: toString(a?.title || ""),
    description: toString(a?.description || ""),
    date: toString(a?.date || "")
  })).filter((a: any) => a.title);

  const cleanLanguages = toArray(raw.languages).map((l: any) => {
    if (typeof l === "string") {
      return { language: toString(l), proficiency: "Conversational" };
    }
    return {
      language: toString(l?.language || l?.name || ""),
      proficiency: toString(l?.proficiency || "Conversational")
    };
  }).filter((l: any) => l.language);

  return {
    personalInfo: cleanPersonalInfo,
    skills: cleanSkills,
    experience: cleanExperience,
    projects: cleanProjects,
    education: cleanEducation,
    certifications: cleanCertifications,
    achievements: cleanAchievements,
    languages: cleanLanguages
  };
}
