import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    await connectToDatabase();
    
    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: resumes });
  } catch (error: any) {
    console.error("GET resume list error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch resumes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    const body = await request.json().catch(() => ({}));
    
    await connectToDatabase();
    
    const newResume = new Resume({
      userId,
      title: body.title || "Untitled Resume",
      templateId: body.templateId || "minimal",
      personalInfo: {
        fullName: body.fullName || "",
        email: body.email || "",
        phone: "",
        location: "",
        website: "",
        linkedin: "",
        github: "",
        portfolio: "",
        summary: ""
      },
      skills: [],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      achievements: [],
      languages: [],
      formatting: {
        fontFamily: "Inter",
        fontSize: 11,
        lineHeight: 1.2,
        margins: 0.75,
        colorScheme: "classic"
      }
    });

    await newResume.save();
    return NextResponse.json({ success: true, data: newResume });
  } catch (error: any) {
    console.error("POST create resume error:", error);
    return NextResponse.json({ error: error.message || "Failed to create resume" }, { status: 500 });
  }
}
