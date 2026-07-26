import { NextRequest, NextResponse } from "next/server";

// Extend the serverless function timeout to 60 s (Vercel Pro / self-hosted).
// On the free Vercel tier the hard cap is 10 s — host on a paid plan or
// self-host to benefit from this setting.
export const maxDuration = 60;

const SCRAPER_BASE = process.env.SCRAPER_URL || "http://145.223.19.170:8080/api/v1/jobs";
const TIMEOUT_MS = 40_000; // 40 s — headless browser scraping can take time

function buildScraperUrl(source: string, keyword: string, city?: string, company?: string): string {
  const url = new URL(SCRAPER_BASE);
  url.searchParams.set("source", source || "linkedin");
  if (keyword) url.searchParams.set("keyword", keyword);
  if (city) url.searchParams.set("city", city);
  if (company) url.searchParams.set("company", company);
  return url.toString();
}

function mapJob(job: any, fallbackLocation: string, source: string) {
  return {
    job_id: job.id || job.job_id || Math.random().toString(),
    title: job.title || "Job Position",
    company_name: job.company || job.company_name || "Confidential",
    location:
      [job.city, job.state, job.country].filter(Boolean).join(", ") ||
      job.location ||
      fallbackLocation,
    posted_date: job.posted_date || job.open_time || "",
    apply_url: job.apply_url || job.job_url || job.url || "#",
    description:
      job.description ||
      `No description provided. Click Apply to view full details on ${source.toUpperCase()}.`,
    company_industry: job.company_industry || source.toUpperCase(),
    headcount: job.applicants ? `${job.applicants} applicants` : undefined,
    direct_apply: !!(job.apply_url || job.job_url),
    company_logo: job.company_logo || null,
    source: job.source || source,
  };
}

async function fetchCity(source: string, keyword: string, city: string, fallback: string, company?: string) {
  const scraperUrl = buildScraperUrl(source, keyword, city, company);
  console.log(`[jobs] fetching: ${scraperUrl}`);

  const res = await fetch(scraperUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    console.warn(`[jobs] scraper returned ${res.status} for source="${source}" city="${city}"`);
    return [];
  }

  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((j: any) => mapJob(j, fallback, source));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const location = searchParams.get("location") || "dubai+europe";
    const source = searchParams.get("source") || "linkedin";
    const company = searchParams.get("company") || "";

    if (!keyword && !company) {
      return NextResponse.json({ jobs: [], total_jobs: 0 });
    }

    let targetLocation = location;
    let targetCompany = company;

    // Smart regional mapping when default/incompatible location is selected
    if (location === "dubai+europe" || location === "dubai" || location === "europe") {
      if (["seek", "jora", "careerone", "workforceaustralia"].includes(source)) {
        targetLocation = "Sydney";
      } else if (["irishjobs", "jobsireland"].includes(source)) {
        targetLocation = "Dublin";
      } else if (["jobbank", "workopolis", "eluta"].includes(source)) {
        targetLocation = "Toronto";
      } else if (["reed", "totaljobs", "cvlibrary"].includes(source)) {
        targetLocation = "London";
      } else if (["xing", "stepstone"].includes(source)) {
        targetLocation = "Berlin";
      } else if (["randstad", "michaelpage", "hays"].includes(source)) {
        targetLocation = "London";
      }
    }

    // Smart ATS company default if none provided
    if (["ashby", "greenhouse", "lever", "smartrecruiters", "personio"].includes(source) && !targetCompany) {
      if (source === "ashby") targetCompany = "openai";
      else if (source === "lever") targetCompany = "netflix";
      else if (source === "greenhouse") targetCompany = "contentful";
      else targetCompany = "spotify";
    }

    let jobs: ReturnType<typeof mapJob>[] = [];

    if (targetLocation === "dubai+europe") {
      // Parallel fetch both regions
      const [dubaiJobs, europeJobs] = await Promise.allSettled([
        fetchCity(source, keyword, "dubai", "Dubai", targetCompany),
        fetchCity(source, keyword, "europe", "Europe", targetCompany),
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
      jobs = await fetchCity(source, keyword, targetLocation, targetLocation, targetCompany);
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
