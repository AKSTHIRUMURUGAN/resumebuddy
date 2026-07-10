import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { title, company, location, industry } = await request.json();
    if (!title) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    const prompt = `
      You are an expert HR recruiter. Generate a highly detailed, professional, and realistic job description for the following position:
      - Job Title: ${title}
      - Company Name: ${company || "a leading firm"}
      - Location: ${location || "Remote"}
      - Industry: ${industry || "Technology"}

      The job description should look like a real corporate job post and include the following sections:
      1. Role Overview (a summary of the position and its context in the team/organization)
      2. Key Responsibilities (6-8 clear, actionable bullets detailing day-to-day duties)
      3. Required Skills & Qualifications (5-7 bullets listing technical stack, tools, years of experience, and soft skills)
      4. What We Offer (benefits, work culture, growth opportunities)

      Keep the tone professional, structured, and realistic. Do not include markdown code block backticks (like \`\`\` or \`\`\`markdown) in your response; just return the plain text.
    `;

    const description = await generateWithGemini({
      prompt,
      systemInstruction: "You are a professional recruiting assistant. Your task is to generate realistic, detailed job descriptions based on a job title and company."
    });

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error("Generate description error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate job description" }, { status: 500 });
  }
}
