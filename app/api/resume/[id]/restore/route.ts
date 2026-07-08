import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import { ResumeVersion } from "@/models/ResumeVersion";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, props: RouteContext) {
  try {
    const { id } = await props.params;
    const { versionNumber } = await request.json();
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!versionNumber) {
      return NextResponse.json({ error: "Missing versionNumber parameter" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Find the snapshot
    const versionRecord = await ResumeVersion.findOne({ resumeId: id, versionNumber });
    if (!versionRecord) {
      return NextResponse.json({ error: "Version snapshot not found" }, { status: 404 });
    }

    // Find the active resume
    const resume = await Resume.findOne({ _id: id, userId });
    if (!resume) {
      return NextResponse.json({ error: "Active resume not found" }, { status: 404 });
    }

    // Save a backup version of the current state before restoring
    const latestVersion = await ResumeVersion.findOne({ resumeId: id }).sort({ versionNumber: -1 });
    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
    
    const preRestoreBackup = new ResumeVersion({
      resumeId: id,
      versionNumber: nextVersionNumber,
      snapshot: resume.toObject(),
      changesSummary: `Pre-restore Backup for V${versionNumber}`
    });
    await preRestoreBackup.save();

    // Overwrite fields
    const snapshot = versionRecord.snapshot;
    Object.keys(snapshot).forEach((key) => {
      if (key !== "_id" && key !== "userId" && key !== "createdAt" && key !== "updatedAt" && key !== "__v") {
        resume[key] = snapshot[key];
      }
    });

    resume.updatedAt = new Date();
    await resume.save();

    return NextResponse.json({ success: true, data: resume });
  } catch (error: any) {
    console.error("Restore resume error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore version" }, { status: 500 });
  }
}
