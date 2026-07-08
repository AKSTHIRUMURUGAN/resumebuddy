import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resumeId = searchParams.get("id");
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!resumeId) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    await connectToDatabase();
    const resume = await Resume.findOne({ _id: resumeId, userId });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const { personalInfo = {}, experience = [], projects = [], education = [], skills = [] } = resume;

    // Create DOCX structure
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Name Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: personalInfo.fullName || "Your Full Name",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            // Contacts Row
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${personalInfo.email || ""} | ${personalInfo.phone || ""} | ${personalInfo.location || ""}`,
                  size: 18,
                }),
              ],
            }),
            // Summary Section
            ...(personalInfo.summary
              ? [
                  new Paragraph({ text: "", spacing: { before: 100 } }),
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 20 })],
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: personalInfo.summary, size: 20 })],
                  }),
                ]
              : []),

            // Experience Section
            ...(experience.length > 0
              ? [
                  new Paragraph({ text: "", spacing: { before: 150 } }),
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: "WORK EXPERIENCE", bold: true, size: 20 })],
                  }),
                  ...experience.flatMap((exp: any) => [
                    new Paragraph({
                      spacing: { before: 80 },
                      children: [
                        new TextRun({ text: `${exp.position} - ${exp.company}`, bold: true, size: 20 }),
                        new TextRun({ text: ` (${exp.duration})`, italics: true, size: 18 }),
                      ],
                    }),
                    ...(exp.highlights || []).map(
                      (hl: string) =>
                        new Paragraph({
                          bullet: { level: 0 },
                          children: [new TextRun({ text: hl, size: 20 })],
                        })
                    ),
                  ]),
                ]
              : []),

            // Projects Section
            ...(projects.length > 0
              ? [
                  new Paragraph({ text: "", spacing: { before: 150 } }),
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: "PROJECTS", bold: true, size: 20 })],
                  }),
                  ...projects.flatMap((proj: any) => [
                    new Paragraph({
                      spacing: { before: 80 },
                      children: [
                        new TextRun({ text: `${proj.title}`, bold: true, size: 20 }),
                        new TextRun({ text: ` - Tools: ${(proj.technologies || []).join(", ")}`, italics: true, size: 18 }),
                      ],
                    }),
                    ...(proj.highlights || []).map(
                      (hl: string) =>
                        new Paragraph({
                          bullet: { level: 0 },
                          children: [new TextRun({ text: hl, size: 20 })],
                        })
                    ),
                  ]),
                ]
              : []),

            // Education Section
            ...(education.length > 0
              ? [
                  new Paragraph({ text: "", spacing: { before: 150 } }),
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: "EDUCATION", bold: true, size: 20 })],
                  }),
                  ...education.map(
                    (edu: any) =>
                      new Paragraph({
                        spacing: { before: 60 },
                        children: [
                          new TextRun({ text: `${edu.institution}`, bold: true, size: 20 }),
                          new TextRun({ text: ` — ${edu.degree} (${edu.duration})`, size: 20 }),
                        ],
                      })
                  ),
                ]
              : []),

            // Skills Section
            ...(skills.length > 0
              ? [
                  new Paragraph({ text: "", spacing: { before: 150 } }),
                  new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [new TextRun({ text: "SKILLS", bold: true, size: 20 })],
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: skills.join(", "), size: 20 })],
                  }),
                ]
              : []),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${resume.title.replace(/\s+/g, "_")}.docx"`,
      },
    });
  } catch (error: any) {
    console.error("DOCX export error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate DOCX" }, { status: 500 });
  }
}
