"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { 
  ArrowLeft, Search, Loader2, Award, AlertTriangle, ShieldCheck, 
  Sparkles, CheckCircle2, UserCheck, Cpu, HardHat, Terminal, HelpCircle,
  TrendingUp, FileText, ArrowRight, Check, Play, RefreshCw, MessageSquare, BookOpen, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

function AtsCheckerPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const queryClient = useQueryClient();

  const [jobDescription, setJobDescription] = useState("");
  const [activeReport, setActiveReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"audit" | "cover-letter" | "interview" | "linkedin">("audit");

  useEffect(() => {
    const prefilled = localStorage.getItem("prefilledJobDescription");
    if (prefilled) {
      setJobDescription(prefilled);
      localStorage.removeItem("prefilledJobDescription");
    }
  }, []);

  // LinkedIn Optimizer states
  const [linkedinHeadline, setLinkedinHeadline] = useState("");
  const [linkedinAbout, setLinkedinAbout] = useState("");
  const [linkedinOptimizedData, setLinkedinOptimizedData] = useState<any>(null);
  const [loadingLinkedinOpt, setLoadingLinkedinOpt] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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

  // Fetch active resume details
  const { data: resumeData, isLoading: resumeLoading } = useQuery({
    queryKey: ["resume", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/resume/${id}`);
      if (!res.ok) throw new Error("Failed to load resume");
      const json = await res.json();
      return json.data;
    },
    enabled: !!id
  });

  // Fetch past reports list history
  const { data: historyList, refetch: refetchHistory } = useQuery({
    queryKey: ["ats-history", id],
    queryFn: async () => {
      if (!id) return [];
      const res = await fetch(`/api/ats/history?resumeId=${id}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!id
  });

  // Load latest report on first load
  useEffect(() => {
    if (historyList && historyList.length > 0 && !activeReport && !jobDescription) {
      loadReportDetails(historyList[0]._id);
    }
  }, [historyList]);

  // Load specific historical report details
  const loadReportDetails = async (reportId: string) => {
    try {
      const res = await fetch(`/api/ats/report/${reportId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setActiveReport(json.data);
          // Prefill LinkedIn inputs if cached
          if (json.data.linkedinOptimization && json.data.linkedinOptimization.score) {
            setLinkedinOptimizedData(json.data.linkedinOptimization);
          } else {
            setLinkedinOptimizedData(null);
          }
        }
      }
    } catch (err) {
      console.error("Load report details failed:", err);
    }
  };

  // Delete historical audit report
  const deleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this audit report history?")) return;
    try {
      const res = await fetch(`/api/ats/report/${reportId}`, { method: "DELETE" });
      if (res.ok) {
        refetchHistory(); // Reload history items list
        // If deleted report is currently selected, reset active state
        if (activeReport?._id === reportId) {
          setActiveReport(null);
          setJobDescription("");
          setLinkedinOptimizedData(null);
          setActiveTab("audit");
        }
      }
    } catch (err) {
      console.error("Delete report failed:", err);
    }
  };

  // Audit mutation
  const auditMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: id,
          jobDescriptionText: jobDescription
        })
      });
      if (!res.ok) throw new Error("Audit failed");
      const json = await res.json();
      return json.data;
    },
    onSuccess: (data) => {
      setActiveReport(data);
      queryClient.invalidateQueries({ queryKey: ["resume", id] });
      refetchHistory();
    }
  });

  // Cover Letter fetch
  const { data: coverLetterData, isLoading: coverLetterLoading, refetch: refetchCoverLetter } = useQuery({
    queryKey: ["cover-letter", id, activeReport?._id],
    queryFn: async () => {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: id,
          jobDescriptionText: activeReport?.jobDescriptionText || jobDescription,
          atsReportId: activeReport?._id
        })
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    enabled: activeTab === "cover-letter" && !!id && !!activeReport?._id
  });

  // Interview Questions fetch
  const { data: interviewData, isLoading: interviewLoading, refetch: refetchInterview } = useQuery({
    queryKey: ["interview", id, activeReport?._id],
    queryFn: async () => {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: id,
          jobDescriptionText: activeReport?.jobDescriptionText || jobDescription,
          atsReportId: activeReport?._id
        })
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    enabled: activeTab === "interview" && !!id && !!activeReport?._id
  });

  // LinkedIn Optimizer request
  const optimizeLinkedin = async () => {
    setLoadingLinkedinOpt(true);
    setLinkedinOptimizedData(null);
    try {
      const res = await fetch("/api/ai/linkedin-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: linkedinHeadline,
          about: linkedinAbout,
          resumeId: id,
          atsReportId: activeReport?._id
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLinkedinOptimizedData(json.data);
        refetchHistory(); // Reload cached report list
      }
    } catch (err) {
      console.error("Optimize LinkedIn failed", err);
    } finally {
      setLoadingLinkedinOpt(false);
    }
  };

  // Intelligent Keyword Inserter mutation
  const insertKeywordsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/keyword-insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: id,
          missingKeywords: activeReport.missingKeywords
        })
      });
      if (!res.ok) throw new Error("Keyword injection failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", id] });
      auditMutation.mutate();
    }
  });

  // Apply autofix recommendation
  const fixMutation = useMutation({
    mutationFn: async ({ section, autofixText }: { section: string; autofixText: string }) => {
      if (!resumeData) return;
      
      const updatedResume = { ...resumeData };
      if (section.toLowerCase() === "summary") {
        updatedResume.personalInfo.summary = autofixText;
      } else if (section.toLowerCase() === "impact" || section.toLowerCase() === "experience") {
        if (updatedResume.experience.length > 0) {
          updatedResume.experience[0].highlights.push(autofixText);
        }
      }

      const res = await fetch(`/api/resume/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedResume)
      });
      if (!res.ok) throw new Error("Autofix save failed");
      return res.json();
    },
    onSuccess: () => {
      auditMutation.mutate();
    }
  });

  if (resumeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <span>Loading resume details...</span>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 gap-4">
        <span>No resume loaded for audit.</span>
        <Link href="/dashboard" className="text-indigo-400 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/resume-builder?id=${id}`} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-smooth">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-display text-xl font-bold tracking-tight text-white ml-2">
            ATS<span className="text-indigo-400">Auditor</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href={`/resume-builder?id=${id}`}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Back to Workspace Builder
          </Link>

          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 hover:bg-slate-900 p-1.5 rounded-xl transition-smooth focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                T
              </div>
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
        </div>
      </header>

      {/* Main Content Layout (Sidebar + Main Audit Dashboard) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex gap-8">
        
        {/* Left Column: Job Audits History List */}
        <div className="w-[280px] bg-slate-900/40 border border-slate-900 rounded-3xl p-5 shrink-0 flex flex-col gap-4 h-fit sticky top-24">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audits History</span>
            <button 
              onClick={() => {
                setActiveReport(null);
                setJobDescription("");
                setLinkedinOptimizedData(null);
                setActiveTab("audit");
              }}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              + New Job Audit
            </button>
          </div>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {historyList && historyList.length > 0 ? (
              historyList.map((rep: any) => (
                <div 
                  key={rep._id}
                  onClick={() => loadReportDetails(rep._id)}
                  className={`p-3 rounded-2xl cursor-pointer border transition-all text-left flex flex-col gap-1 relative ${
                    activeReport?._id === rep._id 
                      ? "bg-indigo-600/10 border-indigo-500/40" 
                      : "bg-slate-950/60 border-slate-900 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">Score: {rep.overallScore}/100</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-500">{new Date(rep.createdAt).toLocaleDateString()}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent loading report details
                          deleteReport(rep._id);
                        }}
                        className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-450 truncate italic pr-4">
                    {rep.jobDescriptionText || "General role audit"}
                  </p>
                </div>
              ))
            ) : (
              <span className="text-[10px] text-slate-600 italic block py-4 text-center">No past job audits</span>
            )}
          </div>
        </div>

        {/* Right Column: Active Audit Workspace */}
        <div className="flex-1">
          
          {/* JD Paste & Audit Trigger (Shown when no active report is selected) */}
          {!activeReport && (
            <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-8 flex flex-col gap-6 w-full">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Simulate Recruiter Auditing</h2>
                <p className="text-sm text-slate-400">
                  Paste the target Job Description below. Resume Buddy will run checklist rules, extract keyword metrics, and simulate review board opinions.
                </p>
              </div>

              <textarea 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job details (Responsibilities, requirements, skills, etc.) here..."
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[180px] w-full"
              />

              <button 
                onClick={() => auditMutation.mutate()}
                disabled={auditMutation.isPending}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-655 text-white font-semibold py-4 rounded-xl text-sm transition-smooth shadow-lg shadow-indigo-600/30"
              >
                {auditMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Running Board Review Board Simulation...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Analyze ATS & Recruiter Fit
                  </>
                )}
              </button>
            </div>
          )}

          {/* Audit Results Panel */}
          {activeReport && (
            <div className="flex flex-col gap-8">
              
              {/* Checker Sub-navigation Tabs */}
              <div className="flex gap-4 border-b border-slate-900 pb-1 text-sm font-semibold">
                <button 
                  onClick={() => setActiveTab("audit")}
                  className={`pb-3 px-1 transition-colors relative ${activeTab === "audit" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-355"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>ATS Audit Report</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab("cover-letter")}
                  className={`pb-3 px-1 transition-colors relative ${activeTab === "cover-letter" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-355"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>AI Cover Letter</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab("interview")}
                  className={`pb-3 px-1 transition-colors relative ${activeTab === "interview" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-355"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    <span>Interview Readiness</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab("linkedin")}
                  className={`pb-3 px-1 transition-colors relative ${activeTab === "linkedin" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-355"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Linkedin />
                    <span>LinkedIn Optimizer</span>
                  </div>
                </button>
              </div>

              {/* TAB CONTENT: AUDIT PANEL */}
              {activeTab === "audit" && (
                <div className="flex flex-col gap-10">
                  
                  {/* Score Ring Summary banner */}
                  <div className="grid md:grid-cols-3 gap-8 items-center bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    
                    {/* Radial score */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="72" cy="72" r="64" stroke="currentColor" className="text-slate-800" strokeWidth="10" fill="transparent" />
                          <circle 
                            cx="72" 
                            cy="72" 
                            r="64" 
                            stroke="currentColor" 
                            className="text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                            strokeWidth="10" 
                            fill="transparent" 
                            strokeDasharray={402}
                            strokeDashoffset={402 - (402 * activeReport.overallScore) / 100}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-extrabold text-white font-display">{activeReport.overallScore}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Overall Rating</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setJobDescription(activeReport.jobDescriptionText || "");
                          setActiveReport(null);
                        }}
                        className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-audit Job JD
                      </button>
                    </div>

                    {/* Breakdown sliders */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                      <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider text-slate-400">Auditor Breakdowns</h3>
                      
                      <div className="space-y-3">
                        {Object.entries(activeReport.breakdown || {}).map(([key, val]: any) => (
                          <div key={key} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-slate-300 capitalize">{key.replace("Score", "")} Match</span>
                              <span className="text-white font-bold">{val}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div style={{ width: `${val}%` }} className="h-full bg-indigo-500 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Red Flags & Keyword checks */}
                  <div className="grid md:grid-cols-2 gap-8">
                    
                    {/* Red Flags Card */}
                    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
                      <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Recruiter Red Flags
                      </h3>

                      {activeReport.recruiterRedFlags.length === 0 ? (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl text-xs font-medium">
                          <CheckCircle2 className="h-4.5 w-4.5" />
                          No critical formatting or credential warnings detected.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {activeReport.recruiterRedFlags.map((flag: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl">
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Keywords Match cloud & Keyword Inserter */}
                    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-md font-bold text-white flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-indigo-400" />
                            Target Keywords Match
                          </h3>
                          {activeReport.missingKeywords.length > 0 && (
                            <button 
                              onClick={() => insertKeywordsMutation.mutate()}
                              disabled={insertKeywordsMutation.isPending}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold py-1.5 px-3 rounded-xl text-[10px] transition-colors flex items-center gap-1"
                            >
                              {insertKeywordsMutation.isPending ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Inserting...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3 w-3" />
                                  Insert Intelligently
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {activeReport.matchedKeywords.map((kw: string, idx: number) => (
                            <span key={idx} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                              ✓ {kw}
                            </span>
                          ))}
                          {activeReport.missingKeywords.map((kw: string, idx: number) => (
                            <span key={idx} className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                              ✗ {kw}
                            </span>
                          ))}
                          {activeReport.matchedKeywords.length === 0 && activeReport.missingKeywords.length === 0 && (
                            <span className="text-xs text-slate-500 italic">No job keywords tested. Paste a JD above to see density maps.</span>
                          )}
                        </div>
                      </div>
                      {insertKeywordsMutation.isSuccess && (
                        <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                          Keywords successfully inserted into experiences! Resume re-audited.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Persona review cards */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recruiter Panel Feedback</h3>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                      {/* 1. ATS Bot */}
                      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between gap-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-600/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
                              <Cpu className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">ATS Scanner</h4>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">Rule Parsing</span>
                            </div>
                          </div>
                          <ul className="text-xs text-slate-300 space-y-2 mt-2">
                            {activeReport.recruiterSimulation.atsScanner.feedback.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                          <span className="text-xs text-slate-500">Hire Status</span>
                          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                            activeReport.recruiterSimulation.atsScanner.recommendation === "Hire" ? "bg-emerald-500/10 text-emerald-400" :
                            activeReport.recruiterSimulation.atsScanner.recommendation === "Reject" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                          }`}>{activeReport.recruiterSimulation.atsScanner.recommendation}</span>
                        </div>
                      </div>

                      {/* 2. HR Recruiter */}
                      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between gap-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-600/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
                              <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">HR Specialist</h4>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">Career Gaps & Gist</span>
                            </div>
                          </div>
                          <ul className="text-xs text-slate-300 space-y-2 mt-2">
                            {activeReport.recruiterSimulation.hrRecruiter.feedback.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                          <span className="text-xs text-slate-500">Hire Status</span>
                          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                            activeReport.recruiterSimulation.hrRecruiter.recommendation === "Hire" ? "bg-emerald-500/10 text-emerald-400" :
                            activeReport.recruiterSimulation.hrRecruiter.recommendation === "Reject" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                          }`}>{activeReport.recruiterSimulation.hrRecruiter.recommendation}</span>
                        </div>
                      </div>

                      {/* 3. Tech Lead */}
                      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between gap-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-600/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
                              <Terminal className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">Hiring Manager</h4>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">Code stacks & depths</span>
                            </div>
                          </div>
                          <ul className="text-xs text-slate-300 space-y-2 mt-2">
                            {activeReport.recruiterSimulation.hiringManager.feedback.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                          <span className="text-xs text-slate-500">Hire Status</span>
                          <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                            activeReport.recruiterSimulation.hiringManager.recommendation === "Hire" ? "bg-emerald-500/10 text-emerald-400" :
                            activeReport.recruiterSimulation.hiringManager.recommendation === "Reject" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                          }`}>{activeReport.recruiterSimulation.hiringManager.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions Table with Autofix */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
                    <h3 className="text-md font-bold text-white mb-6">Suggested Improvement Tasks</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                            <th className="py-4 px-4">Section</th>
                            <th className="py-4 px-4">Detected Issue</th>
                            <th className="py-4 px-4">AI Recommendation</th>
                            <th className="py-4 px-4 text-right">Autofix</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeReport.improvements.map((imp: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-sm">
                              <td className="py-4 px-4 font-semibold text-indigo-400 uppercase text-[10px]">{imp.section}</td>
                              <td className="py-4 px-4 text-slate-200">{imp.issue}</td>
                              <td className="py-4 px-4 text-slate-400 text-xs">{imp.suggestion}</td>
                              <td className="py-4 px-4 text-right">
                                {imp.autofixText ? (
                                  <button 
                                    onClick={() => fixMutation.mutate({ section: imp.section, autofixText: imp.autofixText })}
                                    disabled={fixMutation.isPending}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth"
                                  >
                                    {fixMutation.isPending ? "Applying..." : "Auto-repair"}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-600 font-medium">Manual edit</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB CONTENT: COVER LETTER TAB */}
              {activeTab === "cover-letter" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">AI Document Generator</h3>
                      <p className="text-xs text-slate-400">One-click cover letters and networking outreach scripts.</p>
                    </div>
                    <button 
                      onClick={() => refetchCoverLetter()}
                      className="bg-slate-900 border border-slate-800 text-slate-355 p-2 rounded-xl text-xs flex items-center gap-1 hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </button>
                  </div>

                  {coverLetterLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <span>Writing customized cover letter scripts...</span>
                    </div>
                  ) : coverLetterData ? (
                    <div className="grid md:grid-cols-2 gap-8">
                      
                      {/* Cover Letter Block */}
                      <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Formal Cover Letter</span>
                        <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-850">
                          {coverLetterData.coverLetter}
                        </pre>
                      </div>

                      <div className="flex flex-col gap-8">
                        {/* Cold Email */}
                        <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-3">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Cold Email Outreach</span>
                          <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-850">
                            {coverLetterData.coldEmail}
                          </pre>
                        </div>

                        {/* LinkedIn outreach */}
                        <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-3">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">LinkedIn Networking Message</span>
                          <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-850">
                            {coverLetterData.linkedinMessage}
                          </pre>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-20 italic text-slate-500">Failed to load Cover Letter. Click Regenerate to retry.</div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: INTERVIEW QUESTIONS */}
              {activeTab === "interview" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">AI Mock Interview Board</h3>
                      <p className="text-xs text-slate-400">Tailored practice questions mapped to your resume history.</p>
                    </div>
                    <button 
                      onClick={() => refetchInterview()}
                      className="bg-slate-900 border border-slate-800 text-slate-355 p-2 rounded-xl text-xs flex items-center gap-1 hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </button>
                  </div>

                  {interviewLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <span>Analyzing experiences and formulating questions...</span>
                    </div>
                  ) : interviewData ? (
                    <div className="grid md:grid-cols-3 gap-8">
                      
                      {/* HR questions */}
                      <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <UserCheck className="h-5 w-5" />
                          <h4 className="text-sm font-bold text-white">HR / Behavioral</h4>
                        </div>
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                          {(interviewData.hr || []).map((q: any, i: number) => (
                            <div key={i} className="text-xs border-b border-slate-850/80 pb-3 flex flex-col gap-1.5">
                              <span className="font-bold text-slate-200">Q: {q.question}</span>
                              <span className="text-[10px] text-slate-500 leading-normal bg-slate-950 p-2 rounded-lg border border-slate-850">
                                <span className="font-bold uppercase tracking-widest text-[8px] text-indigo-400 block mb-0.5">Tip / Hint</span>
                                {q.hint}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Technical questions */}
                      <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Terminal className="h-5 w-5" />
                          <h4 className="text-sm font-bold text-white">Technical Deep-Dive</h4>
                        </div>
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                          {(interviewData.technical || []).map((q: any, i: number) => (
                            <div key={i} className="text-xs border-b border-slate-850/80 pb-3 flex flex-col gap-1.5">
                              <span className="font-bold text-slate-200">Q: {q.question}</span>
                              <span className="text-[10px] text-slate-500 leading-normal bg-slate-950 p-2 rounded-lg border border-slate-850">
                                <span className="font-bold uppercase tracking-widest text-[8px] text-indigo-400 block mb-0.5">Tip / Hint</span>
                                {q.hint}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Behavioral / Project questions */}
                      <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <BookOpen className="h-5 w-5" />
                          <h4 className="text-sm font-bold text-white">Project Highlights</h4>
                        </div>
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                          {(interviewData.behavioral || []).map((q: any, i: number) => (
                            <div key={i} className="text-xs border-b border-slate-850/80 pb-3 flex flex-col gap-1.5">
                              <span className="font-bold text-slate-200">Q: {q.question}</span>
                              <span className="text-[10px] text-slate-500 leading-normal bg-slate-950 p-2 rounded-lg border border-slate-850">
                                <span className="font-bold uppercase tracking-widest text-[8px] text-indigo-400 block mb-0.5">Tip / Hint</span>
                                {q.hint}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-20 italic text-slate-500">Failed to load Interview questions. Click Regenerate.</div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: LINKEDIN OPTIMIZER */}
              {activeTab === "linkedin" && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">AI LinkedIn Profile Optimizer</h3>
                    <p className="text-xs text-slate-400">Audit and align your LinkedIn summary credentials with your active resume details.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    
                    {/* Pasting Box */}
                    <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-4 h-fit">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">LinkedIn Profile Details</span>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Current LinkedIn Headline</label>
                        <input 
                          type="text" 
                          value={linkedinHeadline}
                          onChange={(e) => setLinkedinHeadline(e.target.value)}
                          placeholder="e.g. Software Engineer | React | Node"
                          className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Current About / Summary Section</label>
                        <textarea 
                          value={linkedinAbout}
                          onChange={(e) => setLinkedinAbout(e.target.value)}
                          placeholder="Paste your LinkedIn description summary..."
                          className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white min-h-[150px] focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button 
                        onClick={optimizeLinkedin}
                        disabled={loadingLinkedinOpt || !linkedinHeadline || !linkedinAbout}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        {loadingLinkedinOpt ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Auditing profile...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            Optimize LinkedIn Summary
                          </>
                        )}
                      </button>
                    </div>

                    {/* Results Display */}
                    <div className="flex flex-col gap-6">
                      {loadingLinkedinOpt ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                          <span>Formulating optimization suggestions...</span>
                        </div>
                      ) : linkedinOptimizedData ? (
                        <div className="flex flex-col gap-6">
                          
                          {/* Rating Card */}
                          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase block">Optimization Score</span>
                              <span className="text-3xl font-extrabold text-white mt-1 block">{linkedinOptimizedData.score}/100</span>
                            </div>
                            <div className="flex flex-wrap gap-1 text-[9px] font-bold text-slate-400">
                              {linkedinOptimizedData.score >= 80 ? (
                                <span className="text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Recruiter Friendly</span>
                              ) : (
                                <span className="text-yellow-400 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Needs Polish</span>
                              )}
                            </div>
                          </div>

                          {/* Suggestions list */}
                          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-3">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Profile Critique Suggestions</span>
                            <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1.5">
                              {(linkedinOptimizedData.critique || []).map((crit: string, idx: number) => (
                                <li key={idx}>{crit}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Suggested Headlines */}
                          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-3">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Optimized Headlines</span>
                            <div className="flex flex-col gap-2.5">
                              {(linkedinOptimizedData.headlineOptions || []).map((h: string, idx: number) => (
                                <div key={idx} className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-xs text-slate-200 font-mono">
                                  {h}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Suggested Summaries */}
                          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col gap-3">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Compelling About Descriptions</span>
                            <div className="flex flex-col gap-3">
                              {(linkedinOptimizedData.aboutOptions || []).map((a: string, idx: number) => (
                                <pre key={idx} className="bg-slate-950 p-4 border border-slate-850 rounded-xl text-[11px] text-slate-355 font-sans whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                                  {a}
                                </pre>
                              ))}
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-850 rounded-3xl italic text-slate-500">
                          Input current LinkedIn parameters on the left to start optimization.
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function AtsCheckerPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <span>Initializing Auditor workspace...</span>
      </div>
    }>
      <AtsCheckerPage />
    </Suspense>
  );
}
