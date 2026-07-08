import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ResumeVersion } from "@/models/ResumeVersion";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: RouteContext) {
  try {
    const { id } = await props.params;
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    await connectToDatabase();
    // Verify versions associated with this resume
    const versions = await ResumeVersion.find({ resumeId: id }).sort({ versionNumber: -1 });

    return NextResponse.json({ success: true, data: versions });
  } catch (error: any) {
    console.error("GET resume versions error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch versions" }, { status: 500 });
  }
}
