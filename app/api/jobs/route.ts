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
    try {
      console.log(`Querying scraper API: ${scraperUrl.toString()}`);
      const res = await fetch(scraperUrl.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json"
        },
        // Set timeout to avoid waiting too long if the host is down
        signal: AbortSignal.timeout(8000) 
      });

      if (res.ok) {
        jobsArray = await res.json();
      } else {
        console.warn(`Scraper API returned non-OK status: ${res.status}`);
      }
    } catch (e) {
      console.error("Scraper API fetch failed, falling back to mock data.", e);
    }

    // If no jobs returned from scraper API (or it failed), use mock jobs as a fallback
    if (!jobsArray || jobsArray.length === 0) {
      const mockJobs = [
        {
          id: "mock-1",
          title: "Frontend Engineer (React)",
          company: "Emirates Group",
          city: "Dubai",
          country: "United Arab Emirates",
          posted_date: new Date().toISOString().split("T")[0],
          job_url: "https://www.linkedin.com/jobs/view/mock-1",
          apply_url: "https://www.emiratesgroupcareers.com",
          description: "Join the Emirates Group as a Frontend Engineer. You will work on building state-of-the-art booking portals and customer-facing interfaces using React, Next.js, and TypeScript. Experience with responsive layouts, visual design systems, and client performance is required.",
          source: "LinkedIn",
          applicants: 42
        },
        {
          id: "mock-2",
          title: "Senior Backend Developer (Node/Go)",
          company: "Careem",
          city: "Dubai",
          country: "United Arab Emirates",
          posted_date: new Date().toISOString().split("T")[0],
          job_url: "https://www.linkedin.com/jobs/view/mock-2",
          apply_url: "https://www.careem.com/careers",
          description: "Careem is looking for a Senior Backend Developer. You will design, build, and maintain high-performance microservices powering millions of rides and delivery orders daily. Stack: Node.js, Go, Redis, Kafka, and Kubernetes.",
          source: "LinkedIn",
          applicants: 15
        },
        {
          id: "mock-3",
          title: "Software Engineer (Full-Stack)",
          company: "ASML",
          city: "Veldhoven",
          country: "Netherlands (Europe)",
          posted_date: new Date().toISOString().split("T")[0],
          job_url: "https://www.linkedin.com/jobs/view/mock-3",
          apply_url: "https://www.asml.com/en/careers",
          description: "At ASML, you will shape the future of chip manufacturing technology. As a Full-Stack Software Engineer, you will build internal development toolings, data visualizers, and automation scripts using React and Python/C++ backends.",
          source: "LinkedIn",
          applicants: 9
        },
        {
          id: "mock-4",
          title: "React Developer",
          company: "Spotify",
          city: "Stockholm",
          country: "Sweden (Europe)",
          posted_date: new Date().toISOString().split("T")[0],
          job_url: "https://www.linkedin.com/jobs/view/mock-4",
          apply_url: "https://www.lifeatspotify.com",
          description: "Spotify is looking for a passionate React Developer to join our web player squad. You will help build and polish the next-generation music and podcast player experience for hundreds of millions of active users globally.",
          source: "LinkedIn",
          applicants: 64
        },
        {
          id: "mock-5",
          title: "Cloud Infrastructure Engineer",
          company: "Emaar Properties",
          city: "Dubai",
          country: "United Arab Emirates",
          posted_date: new Date().toISOString().split("T")[0],
          job_url: "https://www.linkedin.com/jobs/view/mock-5",
          apply_url: "https://www.emaar.com/en/careers",
          description: "Emaar is looking for a Cloud Infrastructure Engineer. You will help scale and maintain our smart-city cloud architectures on AWS, focusing on containerization, Terraform scripts, and CI/CD pipelines.",
          source: "LinkedIn",
          applicants: 11
        },
        {
          id: "mock-6",
          title: "Junior Frontend Engineer",
          company: "N26",
          city: "Berlin",
          country: "Germany (Europe)",
          posted_date: new Date().toISOString().split("T")[0],
          job_url: "https://www.linkedin.com/jobs/view/mock-6",
          apply_url: "https://n26.com/en-eu/careers",
          description: "Join N26 as a Junior Frontend Engineer. You will work within our digital banking team to build new banking interfaces, features, and cards using React, HTML5, and responsive CSS variables.",
          source: "LinkedIn",
          applicants: 8
        }
      ];

      // Simple keyword and location filtering for mock fallback
      let filtered = mockJobs;
      if (title) {
        const tLower = title.toLowerCase();
        filtered = mockJobs.filter(
          (j) => j.title.toLowerCase().includes(tLower) || j.description.toLowerCase().includes(tLower)
        );
      }
      if (location && location !== "Dubai OR Europe") {
        const lLower = location.toLowerCase();
        filtered = filtered.filter(
          (j) => j.city.toLowerCase().includes(lLower) || j.country.toLowerCase().includes(lLower)
        );
      }
      jobsArray = filtered;
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
