"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Plus, Upload, Trash2, FileText, Sparkles, AlertCircle, 
  Briefcase, BookOpen, Award, CheckCircle2, ChevronRight,
  ShieldCheck, ArrowRight, Loader2, Star, Edit, ExternalLink,
  MessageSquare, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResumeLoading from "@/components/ui/ResumeLoading";
import { useToastStore } from "@/store/toastStore";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
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

export default function Dashboard() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  const [newResumeTitle, setNewResumeTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  
  const [linkedinText, setLinkedinText] = useState("");
  const [githubUser, setGithubUser] = useState("");

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
    // Clear server-side httpOnly session cookie
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.replace("/signin");
  };

  // Fetch resumes list
  const { data: resumesData, isLoading: resumesLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await fetch("/api/resume");
      if (!res.ok) throw new Error("Failed to load resumes");
      const json = await res.json();
      return json.data || [];
    }
  });

  // Fetch Career Vault summary
  const { data: vaultData, isLoading: vaultLoading } = useQuery({
    queryKey: ["vault"],
    queryFn: async () => {
      const res = await fetch("/api/vault");
      if (!res.ok) throw new Error("Failed to load vault");
      const json = await res.json();
      return json.data || { skills: [], experience: [], projects: [], education: [], certifications: [] };
    }
  });

  // Create empty resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, templateId: selectedTemplate })
      });
      if (!res.ok) throw new Error("Failed to create resume");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setShowCreateModal(false);
      setNewResumeTitle("");
    }
  });

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/resume/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete resume");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  });

  // Upload parser mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress("Parsing text from file...");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to parse document");
      }

      setUploadProgress("Synthesizing sections via AI...");
      return res.json();
    },
    onSuccess: () => {
      setUploadProgress("Success! Resume and Vault updated.");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["vault"] });
      setTimeout(() => setUploadProgress(""), 3000);
    },
    onError: (error: any) => {
      setUploadProgress("");
      addToast({
        type: "error",
        title: "Upload & Parsing Failed",
        message: error.message?.includes("503") || error.message?.includes("Service Unavailable") || error.message?.includes("high demand")
          ? "The AI synthesis service is experiencing high demand. Please try again in a few seconds."
          : error.message || "An unexpected error occurred while parsing your resume."
      });
    }
  });

  // LinkedIn text import mutation
  const linkedinMutation = useMutation({
    mutationFn: async (text: string) => {
      setUploadProgress("Analyzing profile text via AI...");
      const res = await fetch("/api/upload/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text })
      });
      if (!res.ok) throw new Error("Failed to import LinkedIn profile");
      return res.json();
    },
    onSuccess: () => {
      setUploadProgress("Success! LinkedIn parsed.");
      setShowLinkedInModal(false);
      setLinkedinText("");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["vault"] });
      setTimeout(() => setUploadProgress(""), 3000);
    },
    onError: (error: any) => {
      setUploadProgress("");
      addToast({
        type: "error",
        title: "LinkedIn Import Failed",
        message: error.message?.includes("503") || error.message?.includes("Service Unavailable") || error.message?.includes("high demand")
          ? "The AI synthesis service is experiencing high demand. Please try again in a few seconds."
          : error.message || "Failed to process your LinkedIn profile text."
      });
    }
  });

  // GitHub user import mutation
  const githubMutation = useMutation({
    mutationFn: async (username: string) => {
      setUploadProgress(`Pulling public repositories for ${username}...`);
      const res = await fetch("/api/upload/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      if (!res.ok) throw new Error("GitHub profile not found or API limits exceeded.");
      return res.json();
    },
    onSuccess: () => {
      setUploadProgress("Success! GitHub synced.");
      setShowGithubModal(false);
      setGithubUser("");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["vault"] });
      setTimeout(() => setUploadProgress(""), 3000);
    },
    onError: (error: any) => {
      setUploadProgress("");
      addToast({
        type: "error",
        title: "GitHub Sync Failed",
        message: error.message?.includes("503") || error.message?.includes("Service Unavailable") || error.message?.includes("high demand")
          ? "The AI synthesis service is experiencing high demand. Please try again in a few seconds."
          : error.message || "Could not retrieve repository info for this user."
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Helper: compute master profile strengths & weaknesses
  const computeVaultHealth = () => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    if (!vaultData) return { strengths, weaknesses, rating: 0 };

    const { skills = [], experience = [], projects = [], education = [], certifications = [] } = vaultData;

    if (skills.length > 5) strengths.push("Core Tech Stacks cataloged");
    else weaknesses.push("Skills count is low (< 5)");

    if (experience.length > 0) strengths.push("Work chronology complete");
    else weaknesses.push("Missing employment records");

    if (projects.length >= 2) strengths.push("Strong project portfolios");
    else weaknesses.push("Fewer than 2 projects listed");

    if (education.length > 0) strengths.push("Academic records detailed");
    else weaknesses.push("Missing education profile");

    if (certifications.length > 0) strengths.push("Industry credentials verified");

    // Calculate rating based on metrics completeness out of 5 stars
    let score = 0;
    if (skills.length > 0) score++;
    if (experience.length > 0) score++;
    if (projects.length > 0) score++;
    if (education.length > 0) score++;
    if (strengths.length > 3) score++;

    return { strengths, weaknesses, rating: Math.max(1, score) };
  };

  const { strengths, weaknesses, rating } = computeVaultHealth();
  const activeResumes = resumesData || [];
  const overallSyncPending = uploadMutation.isPending || linkedinMutation.isPending || githubMutation.isPending;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {overallSyncPending && <ResumeLoading statusText={uploadProgress} />}
      
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
          <Link href="/dashboard" className="text-white">Dashboard</Link>
          <Link href="/dashboard/vault" className="text-slate-400 hover:text-white transition-colors">Career Vault</Link>
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

      {/* Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col gap-10">
        
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 border border-indigo-500/20 p-8 md:p-10 shadow-2xl shadow-indigo-500/5">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative max-w-2xl flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full px-3 py-1 text-xs font-semibold w-fit">
              <ShieldCheck className="h-4 w-4" />
              AI recruiter review systems configured
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight leading-[1.2]">
              Welcome back to your Career Operating System
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Upload your current resume file, sync experience points to your unified Career Vault, or click "Create New" to generate a highly targeted role-specific layout.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-full transition-smooth shadow-lg shadow-indigo-600/30"
              >
                <Plus className="h-5 w-5" />
                Create New Resume
              </button>
              <Link 
                href="/dashboard/vault"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-6 py-3 rounded-full font-semibold transition-smooth"
              >
                Manage Career Vault
                <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Widgets grid */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Document Upload Widget */}
          <div className="md:col-span-2 bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white">Import / Parse Profile</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowLinkedInModal(true)}
                    className="inline-flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-600 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </button>
                  <button 
                    onClick={() => setShowGithubModal(true)}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-350 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" />
                    GitHub
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Parse files directly, paste LinkedIn logs, or import GitHub projects. Our AI scanner automatically extracts skills, educational milestones, and job parameters.
              </p>
            </div>
            
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerUploadClick}
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/40 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-smooth group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden" 
              />
              {uploadMutation.isPending ? (
                <div className="flex flex-col items-center gap-3 text-indigo-400 animate-pulse">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  <span className="text-sm font-semibold">{uploadProgress}</span>
                </div>
              ) : (
                <>
                  <div className="bg-slate-900 text-indigo-400 p-4 rounded-full group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-200">Drag and drop file here, or click to browse</p>
                    <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX and TXT up to 10MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Health Card */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Vault Health</h3>
              <p className="text-slate-400 text-sm mb-6">Master profile counts synced in database.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Award className="h-4.5 w-4.5 text-indigo-400" />
                    <span className="text-sm font-medium">Skills In Vault</span>
                  </div>
                  <span className="text-sm font-bold text-white">{(vaultData?.skills || []).length}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
                    <span className="text-sm font-medium">Experiences</span>
                  </div>
                  <span className="text-sm font-bold text-white">{(vaultData?.experience || []).length}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
                    <span className="text-sm font-medium">Projects</span>
                  </div>
                  <span className="text-sm font-bold text-white">{(vaultData?.projects || []).length}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between mt-6">
              <div>
                <span className="text-xs text-indigo-300 font-semibold block">Vault Quality</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {rating === 5 ? "Recruiter Ready" : rating >= 3 ? "Good Standings" : "Incomplete"}
                </span>
              </div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses Dynamic Checklist */}
        {vaultData && (
          <div className="grid md:grid-cols-2 gap-8 bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                Profile Strengths
              </h3>
              <ul className="text-xs text-slate-300 space-y-2">
                {strengths.map((str, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>{str}</span>
                  </li>
                ))}
                {strengths.length === 0 && (
                  <li className="text-slate-500 italic">No primary profile sections configured yet.</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-yellow-500" />
                Opportunities to Improve
              </h3>
              <ul className="text-xs text-slate-300 space-y-2">
                {weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-yellow-500">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
                {weaknesses.length === 0 && (
                  <li className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    All profile sections fully initialized. Excellent!
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Resumes List Table */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">My Resumes</h3>
            <span className="text-xs text-slate-500 font-semibold uppercase">{activeResumes.length} Layouts</span>
          </div>

          {resumesLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mr-2" />
              <span>Loading resumes database...</span>
            </div>
          ) : activeResumes.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-900 rounded-2xl bg-slate-950/20">
              <FileText className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <p className="font-semibold text-slate-400">No resumes found</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">Create one manually or sync details to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                    <th className="py-4 px-4">Title</th>
                    <th className="py-4 px-4">Template</th>
                    <th className="py-4 px-4">Last Updated</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeResumes.map((resume: any) => (
                    <tr key={resume._id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-sm">
                      <td className="py-4 px-4 font-semibold text-slate-200 flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-indigo-400" />
                        {resume.title}
                      </td>
                      <td className="py-4 px-4 text-slate-400 capitalize">{resume.templateId}</td>
                      <td className="py-4 px-4 text-slate-500">
                        {new Date(resume.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-3">
                          <Link 
                            href={`/resume-builder?id=${resume._id}`}
                            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Builder
                          </Link>
                          <Link 
                            href={`/ats-checker?id=${resume._id}`}
                            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Audit
                          </Link>
                          <button 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this resume?")) {
                                deleteResumeMutation.mutate(resume._id);
                              }
                            }}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-6"
            >
              <div>
                <h3 className="text-lg font-bold text-white">Create Targeted Resume</h3>
                <p className="text-xs text-slate-400 mt-1">Specify layout criteria to instantiate a blank template layout.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Resume Title</label>
                  <input 
                    type="text"
                    value={newResumeTitle}
                    onChange={(e) => setNewResumeTitle(e.target.value)}
                    placeholder="e.g. Software Developer Resume"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Base Design Template</label>
                  <select 
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="minimal">Minimal (Classic Black & White)</option>
                    <option value="modern">Modern (Accent Top Header)</option>
                    <option value="ats">ATS Parsing Friendly (Arial)</option>
                    <option value="executive">Executive Classic Leader</option>
                    <option value="harvard">Harvard Ivy League (Academic)</option>
                    <option value="tech">Developer Console (Monospace)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (newResumeTitle.trim()) {
                      createResumeMutation.mutate(newResumeTitle);
                    }
                  }}
                  disabled={createResumeMutation.isPending || !newResumeTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-600 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-smooth"
                >
                  {createResumeMutation.isPending ? "Creating..." : "Generate"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LINKEDIN IMPORT DIALOG */}
      <AnimatePresence>
        {showLinkedInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-indigo-400" />
                  Import from LinkedIn
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Copy and paste the raw text content of your LinkedIn profile page or summary PDF below. Gemini will parse and structure it into your Career Vault.
                </p>
              </div>

              <textarea 
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
                placeholder="Paste your LinkedIn profile text block here..."
                className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white min-h-[200px] w-full focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowLinkedInModal(false);
                    setLinkedinText("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (linkedinText.trim()) {
                      linkedinMutation.mutate(linkedinText);
                    }
                  }}
                  disabled={linkedinMutation.isPending || !linkedinText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-655 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-smooth flex items-center gap-1.5"
                >
                  {linkedinMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Parsing Profile...
                    </>
                  ) : (
                    "Import Details"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GITHUB IMPORT DIALOG */}
      <AnimatePresence>
        {showGithubModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4"
            >
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Github className="h-5 w-5 text-indigo-400" />
                  Sync GitHub Repositories
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sync public projects from your GitHub profile. AI will summarize them into standard resume descriptions.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">GitHub Username</label>
                <input 
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                  placeholder="e.g. thirumuruganaks"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowGithubModal(false);
                    setGithubUser("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (githubUser.trim()) {
                      githubMutation.mutate(githubUser);
                    }
                  }}
                  disabled={githubMutation.isPending || !githubUser.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-655 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-smooth flex items-center gap-1.5"
                >
                  {githubMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Syncing Repos...
                    </>
                  ) : (
                    "Sync Projects"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
