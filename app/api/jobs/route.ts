import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || "";
    const location = searchParams.get("location") || "Dubai OR Europe";

    // Call the user's deployed scraper API
    const scraperUrl = new URL("http://145.223.19.170:8080/api/v1/jobs");
    scraperUrl.searchParams.set("source", "linkedin");
    if (title) {
      scraperUrl.searchParams.set("keyword", title);
    }
    if (location) {
      scraperUrl.searchParams.set("city", location);
    }

    let jobsArray: any[] = [];
    let fetchError: string | null = null;

    try {
      console.log(`Querying scraper API: ${scraperUrl.toString()}`);
      const res = await fetch(scraperUrl.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        signal: AbortSignal.timeout(8000) 
      });

      if (res.ok) {
        jobsArray = await res.json();
      } else {
        fetchError = `Scraper API returned status ${res.status}: ${res.statusText || "Fetch Error"}`;
      }
    } catch (e: any) {
      fetchError = `Scraper API connection failed: ${e.message || e}`;
    }

    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 502 });
    }

    // Map to client-expected format
    const mappedJobs = (jobsArray || []).map((job: any) => ({
      job_id: job.id || Math.random().toString(),
      title: job.title || "Job Position",
      company_name: job.company || "Confidential",
      location: [job.city, job.state, job.country].filter(Boolean).join(", ") || "Dubai / Europe",
      posted_date: job.posted_date || job.open_time || "",
      apply_url: job.apply_url || job.job_url || "https://www.linkedin.com/jobs",
      description: job.description || "No description provided. Click Apply to view full details on LinkedIn.",
      company_industry: job.source || "LinkedIn",
      headcount: job.applicants ? `${job.applicants} applicants` : undefined,
      direct_apply: !!job.apply_url,
      company_logo: job.company_logo || null
    }));

    return NextResponse.json({
      total_jobs: mappedJobs.length,
      jobs: mappedJobs
    });
  } catch (error: any) {
    console.error("Jobs fetch endpoint error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve jobs" }, { status: 500 });
  }
}
