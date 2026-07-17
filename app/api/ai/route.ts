import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { BULLET_OPTIMIZER_PROMPTS } from "@/lib/prompts";

// Actions that don't require actual text to rewrite
const NO_TEXT_ACTIONS = new Set(["contact_linkedin", "sections", "length", "contact_info"]);

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
        length: "Your resume should ideally be between 150 and 800 words. Add more details to increase length, or condense content if it is too long.",
        contact_info: "Add your email and phone number to the Personal Info section in the left editor panel.",
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
Core Skills: ${formatSkillsForPrompt(context.skills || [])}

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

function formatSkillsForPrompt(skills: any[]): string {
  if (!skills || !Array.isArray(skills)) return "";
  const flat: string[] = [];
  for (const s of skills) {
    if (typeof s === "string") {
      flat.push(s);
    } else if (s && typeof s === "object") {
      if (Array.isArray(s.items)) {
        flat.push(...s.items.filter((item: any) => typeof item === "string"));
      } else if (typeof s.category === "string" && typeof s.items === "string") {
        flat.push(s.items);
      }
    }
  }
  return flat.join(", ");
}
