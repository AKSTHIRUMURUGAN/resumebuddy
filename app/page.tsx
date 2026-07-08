import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Shield, Sparkles, Zap, Award, Search, FileText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            Resume<span className="text-indigo-400">Buddy</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#workflow" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/signin" className="text-sm font-medium hover:text-white transition-colors text-slate-300">
            Sign In
          </Link>
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition-smooth shadow-lg shadow-indigo-600/20">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Recruiter-Grade AI Optimizer
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
            Build. Test. Optimize. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              Get Hired 10x Faster
            </span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed">
            Resume Buddy is more than a builder. It's your AI Career Operating System. Parse your profiles, analyze section gaps, rewrite highlights, and simulate top ATS scanners.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <Link href="/signup" className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-full transition-smooth shadow-xl shadow-indigo-600/30">
              Create Your Free Resume
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-8 py-4 rounded-full font-semibold transition-smooth">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 border-t border-slate-800 bg-slate-950/40 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
              Powerful Features to Land Top Roles
            </h2>
            <p className="text-slate-400">
              Every section of Resume Buddy is engineered to beat standard Applicant Tracking Systems and impress recruiters.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-8 hover:border-indigo-500/30 transition-smooth group">
              <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Resume Builder</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Import from PDF/DOCX, LinkedIn, or GitHub. Extracted profile highlights are placed into your clean Career Vault instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-8 hover:border-indigo-500/30 transition-smooth group">
              <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">ATS Score Checker</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Get scores on formatting, section count, readability, keyword matching, action verbs, and impact metrics with a detailed gap report.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-8 hover:border-indigo-500/30 transition-smooth group">
              <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Interactive Section Editing</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Click any bullet point to open the AI panel. Instantly convert statements into STAR/XYZ formats or expand tech descriptions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-8 hover:border-indigo-500/30 transition-smooth group">
              <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Recruiter Simulation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Simulate reviews by an ATS scanner, HR specialist, and Hiring Manager. Highlight concerns, questions, and red-flags.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-8 hover:border-indigo-500/30 transition-smooth group">
              <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">One-Click Tailoring</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Paste any job description and let the AI find experiences in your Career Vault, mapping missing keywords naturally into sections.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/40 border border-slate-800/80 rounded-3xl p-8 hover:border-indigo-500/30 transition-smooth group">
              <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Premium PDF/DOCX Export</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Download fully parsed formats designed strictly according to modern ATS structure requirements, with zero broken styles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-slate-800 relative bg-slate-900">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
              Simple, Recruiter-Defeating Pricing
            </h2>
            <p className="text-slate-400">
              Upgrade to Pro to unlock comprehensive recruiter simulations, unlimited resume versions, and AI optimization.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-slate-800/20 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-300">Basic Tier</h3>
                <span className="text-4xl font-bold text-white mt-4 block">Free</span>
                <p className="text-slate-400 text-sm mt-2">Get started with essential templates.</p>
                <ul className="mt-8 space-y-4 text-sm text-slate-300">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
                    1 Resume Layout
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
                    3 ATS Audits per Day
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
                    Clean PDF Export
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="mt-8 w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-full text-center transition-smooth block">
                Start Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-800/60 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col justify-between relative">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Popular Choice
              </div>
              <div>
                <h3 className="text-lg font-semibold text-indigo-300">Professional</h3>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-bold text-white">₹399</span>
                  <span className="text-slate-400 text-sm">/ month</span>
                </div>
                <p className="text-slate-400 text-sm mt-2">Complete AI Career Companion Suite.</p>
                <ul className="mt-8 space-y-4 text-sm text-slate-200">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
                    Unlimited Resumes & Syncing
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
                    Unlimited Recruiter Simulations
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
                    AI Action Verb & Metrics Booster
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
                    Gmail Export Delivery
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
                    AI Mock Interview Prep
                  </li>
                </ul>
              </div>
              <Link href="/signup" className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-full text-center transition-smooth shadow-lg shadow-indigo-600/20 block">
                Upgrade via Razorpay
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-12 px-6 bg-slate-950 text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg text-indigo-400">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <span className="font-semibold text-slate-400">Resume Buddy</span>
          </div>
          <p>© {new Date().getFullYear()} Resume Buddy AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
