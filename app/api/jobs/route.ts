import { NextRequest, NextResponse } from "next/server";

// Extend the serverless function timeout to 60 s (Vercel Pro / self-hosted).
// On the free Vercel tier the hard cap is 10 s — host on a paid plan or
// self-host to benefit from this setting.
export const maxDuration = 60;

const SCRAPER_BASE = process.env.SCRAPER_URL || "http://145.223.19.170:8080/api/v1/jobs";
const TIMEOUT_MS = 40_000; // 40 s — headless browser scraping can take time

function buildScraperUrl(source: string, keyword: string, city?: string, company?: string, page: number = 1): string {
  const url = new URL(SCRAPER_BASE);
  url.searchParams.set("source", source || "linkedin");
  if (keyword) url.searchParams.set("keyword", keyword);
  if (city) url.searchParams.set("city", city);
  if (company) url.searchParams.set("company", company);
  if (page > 1) url.searchParams.set("page", String(page));
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

async function fetchCity(source: string, keyword: string, city: string, fallback: string, company?: string, page: number = 1) {
  const scraperUrl = buildScraperUrl(source, keyword, city, company, page);
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

const SOURCE_BATCHES = [
  ["linkedin", "adzuna"],                     // Batch 0: Exactly 2 API calls! Super fast!
  ["reed", "ashby", "greenhouse"],            // Batch 1: 3 API calls! Fast!
  ["lever", "smartrecruiters", "personio"],     // Batch 2: 3 API calls! Fast!
  ["irishjobs", "jobsireland", "eures"],      // Batch 3: 3 API calls! Fast!
  ["randstad", "michaelpage", "hays"],        // Batch 4: 3 API calls!
  ["glassdoor", "seek", "jora"]               // Batch 5: 3 API calls!
];

function getTargetLocationForSource(src: string, loc: string): string {
  if (["ashby", "greenhouse", "lever", "smartrecruiters", "personio"].includes(src)) {
    return ""; // ATS systems search globally without city restriction
  }
  if (loc && loc !== "all" && loc !== "dubai+europe" && loc !== "dubai" && loc !== "europe") {
    return loc; // Specific city like london, berlin, sydney, amsterdam, dublin, toronto
  }
  // Smart default city for regional portals when loc is "all", "dubai+europe", etc.
  if (["seek", "jora", "careerone", "workforceaustralia"].includes(src)) return "Sydney";
  if (["irishjobs", "jobsireland"].includes(src)) return "Dublin";
  if (["jobbank", "workopolis", "eluta"].includes(src)) return "Toronto";
  if (["xing", "stepstone"].includes(src)) return "Berlin";
  return "London"; // Neutral global default for LinkedIn, Adzuna, Reed, Glassdoor, Randstad, Michael Page, Hays, etc.
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const location = searchParams.get("location") || "all";
    const source = searchParams.get("source") || "all";
    const company = searchParams.get("company") || "";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const batchIdx = Math.max(0, Math.min(pageParam - 1, SOURCE_BATCHES.length - 1));

    if (!keyword && !company) {
      return NextResponse.json({ jobs: [], total_jobs: 0, has_more: false, page: 1 });
    }

    let jobs: ReturnType<typeof mapJob>[] = [];
    let hasMore = true;

    if (source === "all") {
      const currentBatchSources = SOURCE_BATCHES[batchIdx] || SOURCE_BATCHES[0];
      // Execute only 2 or 3 API calls for the current batch! Lightning speed!
      const fetchPromises = currentBatchSources.map(async (src) => {
        try {
          const loc = getTargetLocationForSource(src, location);
          const comp = ["ashby", "greenhouse", "lever", "smartrecruiters", "personio"].includes(src) && !company ? "" : company;
          const res = await fetchCity(src, keyword, loc, loc || "Global", comp, 1);
          return res.slice(0, 6); // Take up to 6 jobs from each portal in the batch
        } catch {
          return [];
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      const portalsData = results
        .filter((r): r is PromiseFulfilledResult<ReturnType<typeof mapJob>[]> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((arr) => arr.length > 0);

      const maxLen = Math.max(...portalsData.map((arr) => arr.length), 0);
      const seen = new Set<string>();
      for (let i = 0; i < maxLen; i++) {
        for (const portalArr of portalsData) {
          if (portalArr[i]) {
            const j = portalArr[i];
            if (!seen.has(j.job_id)) {
              seen.add(j.job_id);
              jobs.push(j);
            }
          }
        }
      }
      hasMore = batchIdx < SOURCE_BATCHES.length - 1;
    } else {
      const targetLocation = getTargetLocationForSource(source, location);
      const targetCompany = ["ashby", "greenhouse", "lever", "smartrecruiters", "personio"].includes(source) && !company ? "" : company;
      
      if (location === "dubai+europe") {
        const [dubaiJobs, europeJobs] = await Promise.allSettled([
          fetchCity(source, keyword, "dubai", "Dubai", targetCompany, pageParam),
          fetchCity(source, keyword, "europe", "Europe", targetCompany, pageParam),
        ]);
        const dubai = dubaiJobs.status === "fulfilled" ? dubaiJobs.value : [];
        const europe = europeJobs.status === "fulfilled" ? europeJobs.value : [];
        const seen = new Set<string>();
        jobs = [...dubai, ...europe].filter((j) => {
          if (seen.has(j.job_id)) return false;
          seen.add(j.job_id);
          return true;
        });
      } else {
        jobs = await fetchCity(source, keyword, targetLocation, targetLocation || "Global", targetCompany, pageParam);
      }
      hasMore = jobs.length > 0 && pageParam < 5;
    }

    return NextResponse.json({ jobs, total_jobs: jobs.length, has_more: hasMore, page: pageParam });
  } catch (error: any) {
    console.error("[jobs] route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve jobs" },
      { status: 502 }
    );
  }
}
