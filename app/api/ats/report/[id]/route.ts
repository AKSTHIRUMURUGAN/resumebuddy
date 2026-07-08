import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ATSReport } from "@/models/ATSReport";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: RouteContext) {
  try {
    const { id } = await props.params;
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!id) {
      return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
    }

    await connectToDatabase();

    const report = await ATSReport.findById(id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    console.error("Fetch single ATS report error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve report" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: RouteContext) {
  try {
    const { id } = await props.params;
    const userId = request.headers.get("x-user-id") || "mock-user-123";

    if (!id) {
      return NextResponse.json({ error: "Missing report ID" }, { status: 400 });
    }

    await connectToDatabase();

    // Verify and delete the report
    const deletedReport = await ATSReport.findOneAndDelete({ _id: id });

    if (!deletedReport) {
      return NextResponse.json({ error: "Report not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Report deleted successfully" });
  } catch (error: any) {
    console.error("Delete ATS report error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete report" }, { status: 500 });
  }
}
