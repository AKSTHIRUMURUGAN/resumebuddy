import { NextRequest, NextResponse } from "next/server";

// Extend the serverless function timeout to 60 s (Vercel Pro / self-hosted).
// On the free Vercel tier the hard cap is 10 s — host on a paid plan or
// self-host to benefit from this setting.
export const maxDuration = 60;

const SCRAPER_BASE = "http://145.223.19.170:8080/api/v1/jobs";
const TIMEOUT_MS = 30_000; // 30 s — LinkedIn scraping is slow

function buildScraperUrl(keyword: string, city?: string): string {
  const url = new URL(SCRAPER_BASE);
  url.searchParams.set("source", "linkedin");
  if (keyword) url.searchParams.set("keyword", keyword);
  if (city) url.searchParams.set("city", city);
  return url.toString();
}

function mapJob(job: any, fallbackLocation: string) {
  return {
    job_id: job.id || Math.random().toString(),
    title: job.title || "Job Position",
    company_name: job.company || "Confidential",
    location:
      [job.city, job.state, job.country].filter(Boolean).join(", ") ||
      fallbackLocation,
    posted_date: job.posted_date || job.open_time || "",
    // job_url is the LinkedIn listing; apply_url is Easy Apply (often null)
    apply_url: job.job_url || job.apply_url || "https://www.linkedin.com/jobs",
    description:
      job.description ||
      "No description provided. Click Apply to view full details on LinkedIn.",
    company_industry: "LinkedIn",
    headcount: job.applicants ? `${job.applicants} applicants` : undefined,
    direct_apply: !!job.apply_url,
    company_logo: job.company_logo || null,
  };
}

async function fetchCity(keyword: string, city: string, fallback: string) {
  const scraperUrl = buildScraperUrl(keyword, city);
  console.log(`[jobs] fetching: ${scraperUrl}`);

  const res = await fetch(scraperUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    console.warn(`[jobs] scraper returned ${res.status} for city="${city}"`);
    return [];
  }

  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((j: any) => mapJob(j, fallback));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const location = searchParams.get("location") || "dubai+europe";

    if (!keyword) {
      return NextResponse.json({ jobs: [], total_jobs: 0 });
    }

    let jobs: ReturnType<typeof mapJob>[] = [];

    if (location === "dubai+europe") {
      // Parallel fetch both regions
      const [dubaiJobs, europeJobs] = await Promise.allSettled([
        fetchCity(keyword, "dubai", "Dubai"),
        fetchCity(keyword, "europe", "Europe"),
      ]);

      const dubai =
        dubaiJobs.status === "fulfilled" ? dubaiJobs.value : [];
      const europe =
        europeJobs.status === "fulfilled" ? europeJobs.value : [];

      // Deduplicate by job_id
      const seen = new Set<string>();
      jobs = [...dubai, ...europe].filter((j) => {
        if (seen.has(j.job_id)) return false;
        seen.add(j.job_id);
        return true;
      });
    } else {
      jobs = await fetchCity(keyword, location, location);
    }

    return NextResponse.json({ jobs, total_jobs: jobs.length });
  } catch (error: any) {
    console.error("[jobs] route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve jobs" },
      { status: 502 }
    );
  }
}
