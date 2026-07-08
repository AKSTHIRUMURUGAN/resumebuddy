import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { ResumeVersion } from "@/models/ResumeVersion";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: RouteContext) {
  try {
    const { id } = await props.params;
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    
    await connectToDatabase();
    const resume = await Resume.findOne({ _id: id, userId });
    
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: resume });
  } catch (error: any) {
    console.error("GET single resume error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch resume" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, props: RouteContext) {
  try {
    const { id } = await props.params;
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    const body = await request.json();
    
    await connectToDatabase();
    const resume = await Resume.findOne({ _id: id, userId });
    
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    
    // Save version history snapshot before saving changes
    const latestVersion = await ResumeVersion.findOne({ resumeId: id }).sort({ versionNumber: -1 });
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    
    const versionHistory = new ResumeVersion({
      resumeId: id,
      versionNumber: nextVersionNumber,
      snapshot: resume.toObject(),
      changesSummary: body.changesSummary || `Save State Version ${nextVersionNumber}`
    });
    await versionHistory.save();
    
    // Apply updates
    Object.keys(body).forEach((key) => {
      if (key !== "_id" && key !== "userId" && key !== "createdAt" && key !== "changesSummary") {
        resume[key] = body[key];
      }
    });
    
    resume.updatedAt = new Date();
    await resume.save();
    
    return NextResponse.json({ success: true, data: resume });
  } catch (error: any) {
    console.error("PUT update resume error:", error);
    return NextResponse.json({ error: error.message || "Failed to update resume" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: RouteContext) {
  try {
    const { id } = await props.params;
    const userId = request.headers.get("x-user-id") || "mock-user-123";
    
    await connectToDatabase();
    const deletedResume = await Resume.findOneAndDelete({ _id: id, userId });
    
    if (!deletedResume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    
    // Clean up associated versions
    await ResumeVersion.deleteMany({ resumeId: id });
    
    return NextResponse.json({ success: true, message: "Resume deleted successfully" });
  } catch (error: any) {
    console.error("DELETE resume error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete resume" }, { status: 500 });
  }
}
