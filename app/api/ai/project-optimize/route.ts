import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { PROJECT_OPTIMIZER_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { title, description, technologies = [], metrics = "", role = "Software Developer" } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: "Missing title or description parameter" }, { status: 400 });
    }

    const prompt = `
      Project Title: ${title}
      Initial Description: ${description}
      Technologies Used: ${technologies.join(", ")}
      Metrics/Impact details: ${metrics || "None specified"}
      Target Role: ${role}
    `;

    const generated = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      jsonMode: true,
      systemInstruction: PROJECT_OPTIMIZER_PROMPT
    });

    return NextResponse.json({ success: true, data: generated });
  } catch (error: any) {
    console.error("AI Project Optimizer error:", error);
    return NextResponse.json({ error: error.message || "Failed to optimize project description" }, { status: 500 });
  }
}
