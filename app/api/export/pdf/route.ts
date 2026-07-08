import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";

const getPdfStyles = (formatting: any) => {
  const colorScheme = formatting?.colorScheme || "charcoal";
  const fontFamily = formatting?.fontFamily || "Arial";

  // Map user-selected font family to standard PDF core fonts
  let pdfFont = "Helvetica";
  if (fontFamily === "Times New Roman" || fontFamily === "Georgia") {
    pdfFont = "Times-Roman";
  }

  // Define professional color configurations
  const colors: Record<string, { primary: string; text: string }> = {
    charcoal: { primary: "#334155", text: "#1e293b" },
    navy: { primary: "#1e3a8a", text: "#1e293b" },
    emerald: { primary: "#065f46", text: "#1e293b" },
    burgundy: { primary: "#7f1d1d", text: "#1e293b" },
    teal: { primary: "#0f766e", text: "#1e293b" }
  };

  const currentColors = colors[colorScheme] || colors.charcoal;

  return StyleSheet.create({
    page: { 
      padding: 30, 
      fontFamily: pdfFont, 
      fontSize: 9,
      lineHeight: 1.3,
      color: currentColors.text
    },
    headerName: { 
      fontSize: 18, 
      fontWeight: "bold", 
      textAlign: "center", 
      textTransform: "uppercase",
      color: currentColors.primary
    },
    headerSub: { 
      fontSize: 8, 
      textAlign: "center", 
      color: "#555555", 
      marginTop: 4 
    },
    sectionTitle: { 
      fontSize: 10, 
      fontWeight: "bold", 
      borderBottomWidth: 1, 
      borderBottomColor: currentColors.primary + "33", 
      marginTop: 14, 
      paddingBottom: 2, 
      textTransform: "uppercase",
      color: currentColors.primary
    },
    entryTitleRow: { 
      flexDirection: "row", 
      justifyContent: "space-between", 
      alignItems: "flex-start",
      marginTop: 6 
    },
    entryTitle: { 
      fontSize: 9,
      fontWeight: "bold",
      color: "#111111",
      flex: 1
    },
    entryDuration: { 
      fontSize: 9,
      color: "#666666",
      marginLeft: 10,
      flexShrink: 0
    },
    summaryText: {
      marginTop: 6,
      fontSize: 9,
      fontStyle: "italic",
      color: "#444444"
    },
    bulletList: {
      marginTop: 4,
      paddingLeft: 12
    },
    bulletItem: { 
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 2
    },
    bulletPoint: { 
      width: 8, 
      fontSize: 9,
      color: currentColors.primary
    },
    bulletText: { 
      flex: 1, 
      fontSize: 9 
    },
    skillsText: {
      marginTop: 6,
      fontSize: 9,
      color: "#333333"
    }
  });
};

const createPdfDocument = (resume: any) => {
  const { 
    personalInfo = {}, 
    experience = [], 
    projects = [], 
    education = [], 
    skills = [], 
    formatting = {},
    customSections = []
  } = resume;
  const styles = getPdfStyles(formatting);

  const sectionVisibility = formatting?.sectionVisibility || {};
  const isVisible = (key: string) => sectionVisibility[key] !== false;

  const children: any[] = [
    // Header Name
    React.createElement(Text, { style: styles.headerName }, personalInfo.fullName || "Your Name"),
    // Header details
    React.createElement(
      Text, 
      { style: styles.headerSub }, 
      `${personalInfo.email || ""}  |  ${personalInfo.phone || ""}  |  ${personalInfo.location || ""}`
    )
  ];

  // Optional LinkedIn & GitHub links
  const links: string[] = [];
  if (personalInfo.linkedin) links.push(`LinkedIn: ${personalInfo.linkedin}`);
  if (personalInfo.github) links.push(`GitHub: ${personalInfo.github}`);
  if (personalInfo.website) links.push(`Website: ${personalInfo.website}`);
  
  if (links.length > 0) {
    children.push(
      React.createElement(
        Text,
        { style: [styles.headerSub, { color: styles.headerName.color, marginTop: 2 }] },
        links.join("  |  ")
      )
    );
  }

  // Summary
  if (isVisible("summary") && personalInfo.summary) {
    children.push(
      React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Summary"),
        React.createElement(Text, { style: styles.summaryText }, personalInfo.summary)
      )
    );
  }

  // Experience
  if (isVisible("experience") && experience.length > 0) {
    const expChildren = experience.map((exp: any, idx: number) => {
      const bulletItems = (exp.highlights || []).map((hl: string, hIdx: number) => 
        React.createElement(View, { key: hIdx, style: styles.bulletItem },
          React.createElement(Text, { style: styles.bulletPoint }, "•"),
          React.createElement(Text, { style: styles.bulletText }, hl)
        )
      );

      return React.createElement(View, { key: idx, style: { marginBottom: 6 } },
        React.createElement(View, { style: styles.entryTitleRow },
          React.createElement(Text, { style: styles.entryTitle }, `${exp.position} - ${exp.company}`),
          React.createElement(Text, { style: styles.entryDuration }, exp.duration)
        ),
        React.createElement(View, { style: styles.bulletList }, ...bulletItems)
      );
    });

    children.push(
      React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Work Experience"),
        ...expChildren
      )
    );
  }

  // Projects
  if (isVisible("projects") && projects.length > 0) {
    const projChildren = projects.map((proj: any, idx: number) => {
      const bulletItems = (proj.highlights || []).map((hl: string, hIdx: number) => 
        React.createElement(View, { key: hIdx, style: styles.bulletItem },
          React.createElement(Text, { style: styles.bulletPoint }, "•"),
          React.createElement(Text, { style: styles.bulletText }, hl)
        )
      );

      return React.createElement(View, { key: idx, style: { marginBottom: 6 } },
        React.createElement(View, { style: styles.entryTitleRow },
          React.createElement(Text, { style: styles.entryTitle }, proj.title),
          React.createElement(Text, { style: styles.entryDuration }, (proj.technologies || []).join(", "))
        ),
        React.createElement(View, { style: styles.bulletList }, ...bulletItems)
      );
    });

    children.push(
      React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Projects"),
        ...projChildren
      )
    );
  }

  // Education
  if (isVisible("education") && education.length > 0) {
    const eduChildren = education.map((edu: any, idx: number) => 
      React.createElement(View, { key: idx, style: styles.entryTitleRow },
        React.createElement(Text, { style: styles.entryTitle }, `${edu.institution} — ${edu.degree}`),
        React.createElement(Text, { style: styles.entryDuration }, edu.duration)
      )
    );

    children.push(
      React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Education"),
        ...eduChildren
      )
    );
  }

  // Skills
  if (isVisible("skills") && skills.length > 0) {
    children.push(
      React.createElement(View, null,
        React.createElement(Text, { style: styles.sectionTitle }, "Skills"),
        React.createElement(Text, { style: styles.skillsText }, skills.join(", "))
      )
    );
  }

  // Custom Sections
  if (isVisible("customSections") && customSections.length > 0) {
    customSections.forEach((sec: any, idx: number) => {
      const bulletItems = (sec.items || []).map((item: string, iIdx: number) => 
        React.createElement(View, { key: iIdx, style: styles.bulletItem },
          React.createElement(Text, { style: styles.bulletPoint }, "•"),
          React.createElement(Text, { style: styles.bulletText }, item)
        )
      );

      children.push(
        React.createElement(View, { key: idx, style: { marginTop: 10 } },
          React.createElement(Text, { style: styles.sectionTitle }, sec.heading),
          React.createElement(View, { style: styles.bulletList }, ...bulletItems)
        )
      );
    });
  }

  return React.createElement(
    Document,
    null,
    React.createElement(Page, { size: "A4", style: styles.page }, ...children)
  );
};

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

    // Render component into readable node stream
    const docElement = createPdfDocument(resume);
    const stream = await renderToStream(docElement);
    
    // Convert stream chunks to Uint8Array/Buffer
    const chunks: any[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resume.title.replace(/\s+/g, "_")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF export error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 });
  }
}
