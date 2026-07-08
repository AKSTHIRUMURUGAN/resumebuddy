import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ATSReport } from "@/models/ATSReport";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resumeId = searchParams.get("resumeId");
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!resumeId) {
      return NextResponse.json({ error: "Missing resumeId parameter" }, { status: 400 });
    }

    await connectToDatabase();

    // Find all ATS reports for this resume
    const reports = await ATSReport.find({ resumeId })
      .select("_id overallScore createdAt jobDescriptionText")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    console.error("Fetch ATS report history error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve history" }, { status: 500 });
  }
}
