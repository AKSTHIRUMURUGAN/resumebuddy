import React from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import Link from "next/link";
import { ArrowLeft, Sparkles, Printer } from "lucide-react";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default async function ShareResumePage(props: SharePageProps) {
  const { id } = await props.params;

  let resumeData = null;
  try {
    await connectToDatabase();
    // Fetch resume publicly without user ID validation (read-only share link)
    const resume = await Resume.findById(id);
    if (resume) {
      resumeData = JSON.parse(JSON.stringify(resume.toObject()));
    }
  } catch (error) {
    console.error("Public share fetch error:", error);
  }

  if (!resumeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 gap-4">
        <h1 className="text-xl font-bold text-white">Resume Not Found</h1>
        <p className="text-sm">The link is either incorrect or the resume has been deleted.</p>
        <Link href="/" className="text-indigo-400 hover:underline">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Resume<span className="text-indigo-400">Buddy</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 italic hidden sm:inline">
            Public View of {resumeData.personalInfo?.fullName || "Candidate"}'s Resume
          </span>
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save
          </button>
        </div>
      </header>

      {/* Main visual preview container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
          <ResumeRenderer data={resumeData} />
        </div>
        
        <div className="text-center text-xs text-slate-500 mt-4">
          Powered by <Link href="/" className="text-indigo-400 hover:underline">Resume Buddy AI Career Operating System</Link>
        </div>
      </main>
    </div>
  );
}
