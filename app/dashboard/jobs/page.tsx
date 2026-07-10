"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, Briefcase, ExternalLink, Loader2,
  Sparkles, Users, Building, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "@/store/toastStore";

interface Job {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  posted_date?: string;
  apply_url?: string;
  description?: string;
  company_industry?: string;
  headcount?: string;
  direct_apply?: boolean;
  company_logo?: string | null;
}

interface ResumeItem {
  _id: string;
  title: string;
  updatedAt: string;
}

function JobsContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("Dubai OR Europe");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const addToast = useToastStore((state) => state.addToast);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Fetch jobs
  const { data: jobsData, isLoading: jobsLoading, error: jobsError, refetch } = useQuery({
    queryKey: ["jobs", searchQuery, locationFilter],
    queryFn: async () => {
      const url = new URL("/api/jobs", window.location.origin);
      if (searchQuery) url.searchParams.set("title", searchQuery);
      url.searchParams.set("location", locationFilter);
      
      const res = await fetch(url.toString());
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to fetch jobs");
      }
      const json = await res.json();
      return json.jobs as Job[];
    }
  });

  // Fetch resumes to offer "Tailor Resume" integration
  const { data: resumesList } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await fetch("/api/resume");
      if (!res.ok) throw new Error("Failed to load resumes");
      const json = await res.json();
      return (json.data || []) as ResumeItem[];
    }
  });

  const jobs = jobsData || [];
  const selectedJob = jobs.find((j) => j.job_id === selectedJobId) || jobs[0] || null;

  // Auto-select first job if none is selected
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].job_id);
    }
  }, [jobs, selectedJobId]);

  // Set default resume when list is fetched
  useEffect(() => {
    if (resumesList && resumesList.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumesList[0]._id);
    }
  }, [resumesList, selectedResumeId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleLogout = async () => {
    try {
      if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
        const { auth } = await import("@/lib/firebase");
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
      }
    } catch (err) {
      console.error("Firebase logout error:", err);
    }
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.replace("/signin");
  };

  const handleTailorResume = () => {
    if (!resumesList || resumesList.length === 0) {
      addToast({
        type: "warning",
        title: "No Resumes Found",
        message: "Please create a resume on the Dashboard first!"
      });
      return;
    }
    setShowTailorModal(true);
  };

  const executeTailoring = async () => {
    if (!selectedResumeId || !selectedJob) return;
    
    setIsGeneratingDescription(true);
    let finalDescription = selectedJob.description || "";
    
    const isPlaceholder = 
      !finalDescription || 
      finalDescription.includes("No description provided") || 
      finalDescription.includes("Click the 'View Job'") ||
      finalDescription.includes("Click Apply to view");
      
    if (isPlaceholder) {
      try {
        addToast({
          type: "info",
          title: "AI Generation",
          message: "Generating a realistic job description for " + selectedJob.title + "..."
        });
        
        const res = await fetch("/api/ai/generate-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: selectedJob.title,
            company: selectedJob.company_name,
            location: selectedJob.location,
            industry: selectedJob.company_industry
          })
        });
        
        if (res.ok) {
          const json = await res.json();
          if (json.description) {
            finalDescription = json.description;
          }
        }
      } catch (err) {
        console.error("Failed to generate AI description, falling back to original", err);
      }
    }
    
    // Save job details in localStorage for the ATS checker to fetch
    localStorage.setItem("prefilledJobDescription", finalDescription);
    
    addToast({
      type: "success",
      title: "Optimizing",
      message: "Redirecting to ATS auditor panel..."
    });
    
    setIsGeneratingDescription(false);
    setShowTailorModal(false);
    setShowDetailModal(false);
    
    // Redirect to the ATS checker page with the chosen resume ID
    router.push(`/ats-checker?id=${selectedResumeId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans" style={{ backgroundColor: "#020617" }}>
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Resume<span className="text-indigo-400">Buddy</span>
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/dashboard/vault" className="text-slate-400 hover:text-white transition-colors">Career Vault</Link>
          <Link href="/dashboard/jobs" className="text-white">Find Jobs</Link>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 hover:bg-slate-900 p-1.5 rounded-xl transition-smooth focus:outline-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white">
              T
            </div>
            <span className="text-sm font-medium hidden md:inline text-slate-300">Thirumurugan</span>
          </button>

          <AnimatePresence>
            {showProfileDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3 text-xs text-left"
              >
                <div className="flex flex-col gap-0.5 border-b border-slate-800 pb-2.5">
                  <span className="font-bold text-white">Thirumurugan</span>
                  <span className="text-[10px] text-slate-500 truncate">thirumuruganaks@gmail.com</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Sign Out / Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-8 overflow-hidden">
        {/* Header Title */}
        <div className="mb-6 text-left">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-400" />
            LinkedIn Jobs in Dubai & Europe
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real-time job listings matching tech hubs in Dubai and Europe. Click & Tailor your resume instantly.
          </p>
        </div>

        {/* Search controls */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 mb-6 bg-slate-900/50 p-4 border border-slate-900 rounded-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search job titles (e.g. Frontend, React, Node, DevOps)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 w-full transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all cursor-pointer min-w-[150px]"
            >
              <option value="Dubai OR Europe">Dubai & Europe</option>
              <option value="Dubai">Dubai, UAE</option>
              <option value="Europe">Europe (All)</option>
              <option value="London, United Kingdom">London, UK</option>
              <option value="Amsterdam, Netherlands">Amsterdam, NL</option>
              <option value="Berlin, Germany">Berlin, DE</option>
              <option value="Stockholm, Sweden">Stockholm, SE</option>
            </select>
            <button
              type="submit"
              disabled={jobsLoading}
              className="bg-indigo-600 hover:bg-indigo-550 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-650/10 cursor-pointer flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {jobsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Find Jobs"}
            </button>
          </div>
        </form>

        {/* Jobs Grid (4 Cards per Row on Desktop) */}
        <div className="flex-1 overflow-y-auto max-h-[750px] pr-2 custom-scrollbar">
          {jobsLoading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : jobsError ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-900/60 rounded-2xl text-center text-xs gap-2">
              <span className="text-slate-400 font-semibold">No active jobs found matching your criteria.</span>
              <span className="text-red-400/80 font-mono text-[10px]">Error details: {jobsError.message || "Failed to load job listings."}</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-900/60 p-10 rounded-2xl text-center text-slate-500 text-xs">
              No active jobs found matching your criteria. Try another search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  onClick={() => {
                    setSelectedJobId(job.job_id);
                    setShowDetailModal(true);
                  }}
                  className="group relative bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/70 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer text-left h-[260px]"
                >
                  {/* Top row: Logo and badges */}
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden shrink-0">
                      {job.company_logo ? (
                        <img
                          src={job.company_logo}
                          alt={job.company_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                            const sibling = (e.target as HTMLElement).nextElementSibling;
                            if (sibling) (sibling as HTMLElement).style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full flex items-center justify-center font-bold text-xs bg-indigo-650/10 text-indigo-400"
                        style={{ display: job.company_logo ? "none" : "flex" }}
                      >
                        {job.company_name ? job.company_name.charAt(0).toUpperCase() : "J"}
                      </div>
                    </div>
                    
                    {job.direct_apply && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                        Easy Apply
                      </span>
                    )}
                  </div>

                  {/* Content info */}
                  <div className="flex-1 flex flex-col justify-start">
                    <h3 className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug mb-1">
                      {job.title}
                    </h3>
                    <div className="text-[11px] text-slate-455 font-medium mb-3">{job.company_name}</div>
                  </div>

                  {/* Bottom info: Location & Date */}
                  <div className="border-t border-slate-850/60 pt-3 mt-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-600 font-semibold mt-1">
                      <span>{job.company_industry || "LinkedIn"}</span>
                      {job.posted_date && (
                        <span>
                          {new Date(job.posted_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Job Detail Modal Overlay */}
      <AnimatePresence>
        {showDetailModal && selectedJob && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-850 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex gap-4 items-start text-left">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden shrink-0">
                    {selectedJob.company_logo ? (
                      <img
                        src={selectedJob.company_logo}
                        alt={selectedJob.company_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          const sibling = (e.target as HTMLElement).nextElementSibling;
                          if (sibling) (sibling as HTMLElement).style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center font-bold text-lg bg-indigo-650/10 text-indigo-400"
                      style={{ display: selectedJob.company_logo ? "none" : "flex" }}
                    >
                      {selectedJob.company_name ? selectedJob.company_name.charAt(0).toUpperCase() : "J"}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white leading-snug">{selectedJob.title}</h2>
                    <div className="text-xs text-indigo-400 font-semibold mt-1">{selectedJob.company_name}</div>
                    
                    <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 mt-2.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {selectedJob.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        {selectedJob.company_industry || "LinkedIn"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800 p-1.5 rounded-full transition-smooth shrink-0 self-end sm:self-start cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Description Content */}
              <div className="p-6 overflow-y-auto text-left text-xs leading-relaxed text-slate-350 space-y-4 font-sans custom-scrollbar flex-1 max-h-[400px]">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Job Description</h3>
                  <p className="whitespace-pre-wrap">{selectedJob.description || "No description provided."}</p>
                </div>
              </div>

              {/* Footer Action Buttons */}
              <div className="p-6 border-t border-slate-850 bg-slate-900/60 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleTailorResume();
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-smooth shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tailor My Resume
                </button>
                
                {selectedJob.apply_url && (
                  <a
                    href={selectedJob.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-700/60 rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    Apply On LinkedIn
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tailor Resume Modal Overlay */}
      <AnimatePresence>
        {showTailorModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-left"
            >
              <div>
                <h3 className="font-bold text-sm text-white">Optimize Your Resume</h3>
                <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">
                  Select which resume version from your account you want to analyze and optimize against this job description.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Select Resume</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all cursor-pointer w-full"
                >
                  {resumesList?.map((resume) => (
                    <option key={resume._id} value={resume._id}>
                      {resume.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  onClick={() => setShowTailorModal(false)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-450 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeTailoring}
                  disabled={isGeneratingDescription}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isGeneratingDescription && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isGeneratingDescription ? "Generating Description..." : "Tailor Now"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 items-center justify-center p-6 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}
