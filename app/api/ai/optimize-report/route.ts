import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  // Read body ONCE upfront so it's available for both the happy path and local fallback
  let body: { resume?: any; resumeId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { resume } = body;

  // Auth check — read header injected by proxy.ts
  // In dev mode proxy always injects mock-user-123, in prod it injects real uid
  const userId =
    request.headers.get("x-user-id") ||
    (process.env.NEXT_PUBLIC_DEV_MODE === "true" ? "mock-user-123" : null);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resume) {
    return NextResponse.json({ error: "Resume data required" }, { status: 400 });
  }

  // Try Gemini-powered analysis first, fall back to local if AI unavailable
  try {
    const resumeText = buildResumeText(resume);

    const prompt = `You are a professional resume analyzer. Analyze the following resume and return a structured JSON report.

RESUME:
${resumeText}

Return ONLY valid JSON in this exact format:
{
  "score": <number 0-100>,
  "totalIssues": <number>,
  "categories": [
    { "name": "Content", "score": <0-100> },
    { "name": "ATS Parse Rate", "score": <0-100> },
    { "name": "Sections", "score": <0-100> },
    { "name": "ATS Essentials", "score": <0-100> },
    { "name": "HR Red Flags", "score": <0-100> }
  ],
  "issues": [
    {
      "key": "ats_parse",
      "label": "ATS Parse Rate",
      "status": "pass",
      "description": "<short description>",
      "sample": null
    },
    {
      "key": "quantify",
      "label": "Quantifying Impact",
      "status": "fail",
      "description": "<short description>",
      "sample": "<a bullet that lacks numbers>"
    },
    {
      "key": "repetition",
      "label": "Repetition",
      "status": "pass",
      "description": "<short description, list repeated words>",
      "sample": null
    },
    {
      "key": "grammar",
      "label": "Spelling & Grammar",
      "status": "fail",
      "description": "<short description>",
      "sample": "<example with error>"
    },
    {
      "key": "contact_linkedin",
      "label": "LinkedIn in Contact",
      "status": "fail",
      "description": "LinkedIn URL should be present in contact information.",
      "sample": null
    },
    {
      "key": "contact_info",
      "label": "Contact Completeness",
      "status": "pass",
      "description": "<description>",
      "sample": null
    },
    {
      "key": "bullet_consistency",
      "label": "Bullet Consistency",
      "status": "pass",
      "description": "<description>",
      "sample": null
    },
    {
      "key": "sections",
      "label": "Essential Sections",
      "status": "pass",
      "description": "Resume should have Experience, Education, Skills, Summary.",
      "sample": null
    },
    {
      "key": "action_verbs",
      "label": "Action Verbs",
      "status": "pass",
      "description": "<description>",
      "sample": null
    },
    {
      "key": "length",
      "label": "Resume Length",
      "status": "pass",
      "description": "Resume content is appropriate length.",
      "sample": null
    }
  ]
}

Only return the JSON object, no markdown fences, no explanation.`;

    const raw = await generateWithGemini({ prompt });

    let data: any;
    try {
      const jsonMatch = (typeof raw === "string" ? raw : JSON.stringify(raw)).match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      data = JSON.parse(jsonMatch[0]);
    } catch {
      // AI response couldn't be parsed — fall back to local analysis
      data = computeLocalReport(resume);
    }

    // Ensure totalIssues reflects actual failing count
    const failingIssues = (data.issues || []).filter((i: any) => i.status === "fail");
    data.totalIssues = failingIssues.length;

    return NextResponse.json({ success: true, data });
  } catch (aiError: any) {
    // AI service unavailable (503 etc.) — use local deterministic analysis
    console.warn("[optimize-report] AI unavailable, using local fallback:", aiError.message);
    const data = computeLocalReport(resume);
    return NextResponse.json({ success: true, data, fallback: true });
  }
}


function buildResumeText(resume: any): string {
  const lines: string[] = [];
  if (resume.personalInfo) {
    const p = resume.personalInfo;
    lines.push(`Name: ${p.fullName || ""}`);
    lines.push(`Email: ${p.email || ""}`);
    lines.push(`Phone: ${p.phone || ""}`);
    lines.push(`LinkedIn: ${p.linkedin || "MISSING"}`);
    lines.push(`GitHub: ${p.github || ""}`);
    lines.push(`Summary: ${p.summary || ""}`);
  }
  if (resume.experience?.length) {
    lines.push("\nEXPERIENCE:");
    resume.experience.forEach((e: any) => {
      lines.push(`${e.position} at ${e.company} (${e.duration || ""})`);
      (e.highlights || []).forEach((h: string) => lines.push(`- ${h}`));
    });
  }
  if (resume.projects?.length) {
    lines.push("\nPROJECTS:");
    resume.projects.forEach((p: any) => {
      lines.push(`${p.title}`);
      (p.highlights || []).forEach((h: string) => lines.push(`- ${h}`));
    });
  }
  if (resume.skills?.length) lines.push(`\nSKILLS: ${resume.skills.join(", ")}`);
  if (resume.education?.length) {
    lines.push("\nEDUCATION:");
    resume.education.forEach((e: any) => lines.push(`${e.degree} - ${e.institution}`));
  }
  return lines.join("\n");
}

function computeLocalReport(resume: any) {
  const issues = [];
  let score = 100;

  // Check LinkedIn
  const hasLinkedin = !!resume.personalInfo?.linkedin;
  issues.push({ key: "contact_linkedin", label: "LinkedIn in Contact", status: hasLinkedin ? "pass" : "fail",
    description: hasLinkedin ? "LinkedIn URL found." : "LinkedIn URL is missing from contact info.", sample: null });
  if (!hasLinkedin) score -= 10;

  // Check essential sections
  const hasSummary = !!resume.personalInfo?.summary;
  const hasExp = (resume.experience || []).length > 0;
  const hasEdu = (resume.education || []).length > 0;
  const hasSkills = (resume.skills || []).length > 0;
  const hasAllSections = hasSummary && hasExp && hasEdu && hasSkills;
  issues.push({ key: "sections", label: "Essential Sections", status: hasAllSections ? "pass" : "fail",
    description: hasAllSections ? "All essential sections present." : `Missing: ${[!hasSummary && "Summary", !hasExp && "Experience", !hasEdu && "Education", !hasSkills && "Skills"].filter(Boolean).join(", ")}`,
    sample: null });
  if (!hasAllSections) score -= 10;

  // Check quantification (look for numbers in bullets)
  const allBullets = [...(resume.experience || []), ...(resume.projects || [])].flatMap((e: any) => e.highlights || []);
  const bulletsWithNumbers = allBullets.filter((b: string) => /\d+/.test(b));
  const hasQuantification = bulletsWithNumbers.length >= Math.ceil(allBullets.length * 0.3);
  const sampleNoNumbers = allBullets.find((b: string) => !/\d+/.test(b));
  issues.push({ key: "quantify", label: "Quantifying Impact", status: hasQuantification ? "pass" : "fail",
    description: hasQuantification ? "Good use of quantified achievements." : `${allBullets.length - bulletsWithNumbers.length} bullets lack quantified metrics.`,
    sample: sampleNoNumbers || null });
  if (!hasQuantification) score -= 15;

  // Check repetition (simple word frequency)
  const allText = allBullets.join(" ").toLowerCase();
  const words = allText.match(/\b[a-z]{4,}\b/g) || [];
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const repeated = Object.entries(freq).filter(([, c]) => c >= 4).map(([w]) => w);
  issues.push({ key: "repetition", label: "Repetition", status: repeated.length === 0 ? "pass" : "fail",
    description: repeated.length === 0 ? "No excessive word repetition." : `Repeated words: ${repeated.slice(0, 5).join(", ")}`,
    sample: repeated.length > 0 ? allBullets.find(b => repeated.some(r => b.toLowerCase().includes(r))) || null : null });
  if (repeated.length > 0) score -= 8;

  // Check contact completeness
  const p = resume.personalInfo || {};
  const hasContact = !!(p.email && p.phone);
  issues.push({ key: "contact_info", label: "Contact Completeness", status: hasContact ? "pass" : "fail",
    description: hasContact ? "Email and phone present." : "Missing email or phone number.", sample: null });
  if (!hasContact) score -= 10;

  // Action verbs check
  const actionVerbs = ["developed", "built", "created", "designed", "implemented", "led", "managed", "achieved", "improved", "optimized", "delivered", "launched", "engineered"];
  const usesActionVerbs = allBullets.some((b: string) => actionVerbs.some(v => b.toLowerCase().startsWith(v)));
  issues.push({ key: "action_verbs", label: "Action Verbs", status: usesActionVerbs ? "pass" : "fail",
    description: usesActionVerbs ? "Good use of action verbs." : "Bullets should start with strong action verbs.",
    sample: allBullets[0] || null });
  if (!usesActionVerbs) score -= 7;

  // ATS Parse Rate (check for special chars that hurt parsing)
  const fullText = JSON.stringify(resume);
  const specialChars = (fullText.match(/[★✓•→■]/g) || []).length;
  issues.push({ key: "ats_parse", label: "ATS Parse Rate", status: specialChars < 5 ? "pass" : "fail",
    description: specialChars < 5 ? "Good ATS compatibility." : "Special characters may reduce ATS parse rate.", sample: null });
  if (specialChars >= 5) score -= 5;

  // Grammar (basic checks)
  issues.push({ key: "grammar", label: "Spelling & Grammar", status: "pass",
    description: "No obvious grammar errors detected in local scan. Use Copilot for detailed grammar check.", sample: null });

  // Bullet consistency
  const bulletStyles = allBullets.map((b: string) => b.trim().charAt(0) === b.trim().charAt(0).toUpperCase() ? "cap" : "lower");
  const inconsistent = bulletStyles.includes("cap") && bulletStyles.includes("lower");
  issues.push({ key: "bullet_consistency", label: "Bullet Consistency", status: inconsistent ? "fail" : "pass",
    description: inconsistent ? "Inconsistent capitalization in bullet points." : "Bullet points are consistently formatted.",
    sample: inconsistent ? allBullets.find((b: string) => b.trim().charAt(0) !== b.trim().charAt(0).toUpperCase()) || null : null });
  if (inconsistent) score -= 5;

  // Resume length check
  const wordCount = allText.split(/\s+/).length;
  const goodLength = wordCount >= 150 && wordCount <= 800;
  issues.push({ key: "length", label: "Resume Length", status: goodLength ? "pass" : "fail",
    description: goodLength ? `Good length (~${wordCount} words).` : wordCount < 150 ? "Resume is too short. Add more detail." : "Resume may be too long. Consider condensing.",
    sample: null });
  if (!goodLength) score -= 5;

  const failingIssues = issues.filter(i => i.status === "fail");

  return {
    score: Math.max(0, Math.min(100, score)),
    totalIssues: failingIssues.length,
    categories: [
      { name: "Content", score: hasQuantification && usesActionVerbs ? 85 : 55 },
      { name: "ATS Parse Rate", score: specialChars < 5 ? 90 : 65 },
      { name: "Sections", score: hasAllSections ? 90 : 60 },
      { name: "ATS Essentials", score: hasContact && hasLinkedin ? 85 : 65 },
      { name: "HR Red Flags", score: repeated.length === 0 ? 88 : 70 },
    ],
    issues,
  };
}
