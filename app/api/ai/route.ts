import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { BULLET_OPTIMIZER_PROMPTS } from "@/lib/prompts";

// Actions that don't require actual text to rewrite
const NO_TEXT_ACTIONS = new Set(["contact_linkedin", "sections"]);

export async function POST(request: NextRequest) {
  try {
    const { action, text = "", context = {} } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    // Special informational fixes — return guidance, no AI needed
    if (NO_TEXT_ACTIONS.has(action)) {
      const messages: Record<string, string> = {
        contact_linkedin: "Add your LinkedIn profile URL (e.g. https://linkedin.com/in/your-username) to the Personal Info section in the left editor panel.",
        sections: "Ensure your resume has Summary, Experience, Education, and Skills sections. Use the left editor panel to add any missing sections.",
      };
      return NextResponse.json({
        success: true,
        suggestion: messages[action] || "Please check your resume structure.",
        suggestions: [messages[action] || "Please check your resume structure."],
      });
    }

    if (!text) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    const instruction = BULLET_OPTIMIZER_PROMPTS[action];
    if (!instruction) {
      return NextResponse.json({ error: `Unsupported AI action: ${action}` }, { status: 400 });
    }

    const extraContextInstruction = context.extraContext
      ? `\nIMPORTANT: The user provided this additional context/parameters to weave into the rewrite:\n"${context.extraContext}"`
      : "";

    const prompt = `
You are an expert resume optimization coach.

Target Role: ${context.role || "Software Developer"}
Core Skills: ${(context.skills || []).join(", ")}

Original Bullet/Text Block:
"${text}"
${extraContextInstruction}

Task:
${instruction}

Generate exactly 2 high-impact, professional rewrite variations that are fully tailored and ready to be inserted directly into the resume.
Return the output as a valid JSON array of strings: ["Option 1", "Option 2"]. Do not include markdown blocks or any other explanation.
    `.trim();


    const response = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      jsonMode: true,
    });

    if (Array.isArray(response)) {
      return NextResponse.json({ success: true, suggestions: response, suggestion: response[0] });
    }

    // Fallback if single string
    return NextResponse.json({ success: true, suggestions: [response], suggestion: response });
  } catch (error: any) {
    console.error("AI rewrite error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate rewrites" },
      { status: 500 }
    );
  }
}
