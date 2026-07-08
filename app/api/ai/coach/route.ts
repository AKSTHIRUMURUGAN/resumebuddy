import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { COACH_SYSTEM_INSTRUCTION } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      history = [],
      resumeId,
      focusSection,
      resumeContext: clientContext, // sent directly by Copilot (avoids DB round-trip)
    } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message parameter" }, { status: 400 });
    }

    // Build resume context — prefer client-sent context, fallback to DB
    let resumeContextStr = "";

    if (clientContext) {
      // Rich context sent directly from the Copilot UI
      resumeContextStr = `
CANDIDATE RESUME (Focus: ${focusSection || "entire resume"}):
Name: ${clientContext.name || "Unknown"}
Target Role: ${clientContext.role || "Not specified"}
Summary: ${clientContext.summary || "None"}
Skills: ${(clientContext.skills || []).join(", ")}
Experience: ${(clientContext.experience || []).join(" | ")}
Projects: ${(clientContext.projects || []).join(", ")}
      `.trim();
    } else if (resumeId) {
      // Fallback: fetch from DB for Coach tab
      try {
        await connectToDatabase();
        const userId = request.headers.get("x-user-id") || "mock-user-123";
        const resume = await Resume.findOne({ _id: resumeId, userId });
        if (resume) {
          const r = resume.toObject();
          const pi = r.personalInfo || {};
          resumeContextStr = `
CANDIDATE RESUME:
Name: ${pi.fullName || ""}
Email: ${pi.email || ""}
Target Role: ${r.targetRole || ""}
Summary: ${pi.summary || ""}
Skills: ${(r.skills || []).join(", ")}
Experience: ${(r.experience || []).map((e: any) => `${e.position} at ${e.company}`).join(" | ")}
Projects: ${(r.projects || []).map((p: any) => p.title).join(", ")}
          `.trim();
        }
      } catch (dbErr) {
        console.warn("Coach: DB fetch failed, continuing without resume context");
      }
    }

    const focusInstruction = focusSection && focusSection !== "entire resume"
      ? `\nThe user is specifically asking about the "${focusSection}" section of their resume. Focus your response on that section.`
      : "";

    const formattedHistory = history
      .slice(-10) // last 10 messages for context window efficiency
      .map((msg: any) => `${msg.role === "user" ? "User" : "Coach"}: ${msg.content}`)
      .join("\n");

    const prompt = `
${resumeContextStr}
${focusInstruction}

Conversation History:
${formattedHistory}

User: ${message}

Coach:
    `.trim();

    const response = await generateWithGemini({
      prompt,
      model: "gemini-2.5-flash",
      systemInstruction: COACH_SYSTEM_INSTRUCTION,
    });

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error("AI Coach API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
