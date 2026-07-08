import React from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { Resume } from "@/models/Resume";
import Link from "next/link";
import { 
  Mail, Phone, Globe, ExternalLink, 
  Briefcase, BookOpen, Award, Sparkles, Terminal, Code, Cpu
} from "lucide-react";
import ContactForm from "@/components/portfolio/ContactForm";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
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
    width="18"
    height="18"
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

interface PortfolioPageProps {
  params: Promise<{ id: string }>;
}

export default async function PortfolioPage(props: PortfolioPageProps) {
  const { id } = await props.params;

  let resumeData = null;
  try {
    await connectToDatabase();
    const resume = await Resume.findById(id);
    if (resume) {
      resumeData = JSON.parse(JSON.stringify(resume.toObject()));
    }
  } catch (error) {
    console.error("Portfolio fetch error:", error);
  }

  if (!resumeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 gap-4">
        <h1 className="text-xl font-bold text-white">Portfolio Not Found</h1>
        <p className="text-sm">We couldn't load the associated resume profile credentials.</p>
        <Link href="/" className="text-indigo-400 hover:underline">Go to Home</Link>
      </div>
    );
  }

  const { personalInfo = {}, skills = [], experience = [], projects = [], education = [], certifications = [] } = resumeData;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar Header */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-slate-900/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Code className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-white tracking-tight">
            {personalInfo.fullName || "Candidate"}<span className="text-indigo-400">.dev</span>
          </span>
        </div>
        <nav className="flex items-center gap-6 text-xs font-semibold text-slate-400">
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#projects" className="hover:text-white transition-colors">Projects</a>
          <a href="#experience" className="hover:text-white transition-colors">Experience</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="about" className="max-w-5xl mx-auto px-6 pt-20 pb-16 md:py-28 grid md:grid-cols-3 gap-10 items-center relative z-10">
        <div className="md:col-span-2 flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full px-3 py-1 text-xs font-semibold w-fit">
            <Sparkles className="h-4 w-4" />
            Open for opportunities
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Hi, I'm <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">{personalInfo.fullName || "Your Name"}</span>
          </h1>
          <p className="text-lg text-slate-400 font-mono">
            {resumeData.targetRole || "Full Stack Software Architect"}
          </p>
          <p className="text-slate-300 leading-relaxed max-w-xl">
            {personalInfo.summary || "Result-driven engineer focused on building robust backends, scalable layouts, and high-performance server architectures."}
          </p>

          {/* Socials & Actions */}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <a 
              href={`/api/export/pdf?id=${id}`}
              target="_blank" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors shadow-lg shadow-indigo-600/20"
            >
              Download PDF Resume
            </a>
            <div className="flex gap-3">
              {personalInfo.github && (
                <a href={personalInfo.github} target="_blank" className="p-3 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                  <Terminal className="h-4.5 w-4.5" />
                </a>
              )}
              {personalInfo.linkedin && (
                <a href={personalInfo.linkedin} target="_blank" className="p-3 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                  <Globe className="h-4.5 w-4.5" />
                </a>
              )}
              {personalInfo.email && (
                <a href={`mailto:${personalInfo.email}`} className="p-3 bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                  <Mail className="h-4.5 w-4.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tech Stack widget column */}
        <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
          <h3 className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-widest">Language Matrix</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string, idx: number) => (
              <span key={idx} className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 px-3 py-1 rounded font-mono">
                {skill}
              </span>
            ))}
            {skills.length === 0 && (
              <span className="text-xs text-slate-500 italic">No skills listed</span>
            )}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      {projects.length > 0 && (
        <section id="projects" className="py-20 border-t border-slate-900 bg-slate-950/40 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-12 flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white">Highlighted Projects</h2>
              <p className="text-xs text-slate-500">Showcase of software engineering builds and applications.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((proj: any, idx: number) => (
                <div key={idx} className="bg-slate-900 border border-slate-850 hover:border-indigo-500/20 rounded-3xl p-6 transition-colors group flex flex-col justify-between gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{proj.title}</h3>
                      {proj.url && (
                        <a href={proj.url} target="_blank" className="text-slate-500 hover:text-white">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">{proj.description}</p>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                      {(proj.highlights || []).map((hl: string, hIdx: number) => (
                        <li key={hIdx}>{hl}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {(proj.technologies || []).map((tech: string, tIdx: number) => (
                      <span key={tIdx} className="bg-slate-950 text-[9px] text-indigo-300 font-mono px-2 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Experience Chronology */}
      {experience.length > 0 && (
        <section id="experience" className="py-20 border-t border-slate-900 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-12 flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white">Work Chronology</h2>
              <p className="text-xs text-slate-500">Chronological history of employment and technical roles.</p>
            </div>

            <div className="flex flex-col gap-8 relative border-l border-slate-800 pl-6 ml-2">
              {experience.map((exp: any, idx: number) => (
                <div key={idx} className="relative group text-left">
                  {/* Timeline Bullet */}
                  <div className="absolute -left-[31px] top-1.5 bg-slate-950 border border-slate-800 rounded-full w-4 h-4 group-hover:bg-indigo-500 transition-colors" />
                  
                  <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-3xl flex flex-col gap-2">
                    <div className="flex flex-wrap justify-between items-baseline gap-2">
                      <h3 className="text-md font-bold text-white">{exp.position}</h3>
                      <span className="text-[10px] text-slate-500 font-mono font-semibold">{exp.duration}</span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-400">{exp.company} — {exp.location}</div>
                    <ul className="list-disc pl-4 space-y-1.5 mt-3 text-xs text-slate-350 leading-relaxed">
                      {(exp.highlights || []).map((hl: string, hIdx: number) => (
                        <li key={hIdx}>{hl}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Form */}
      <section id="contact" className="py-20 border-t border-slate-900 bg-slate-950/40 relative z-10">
        <div className="max-w-xl mx-auto px-6 text-center flex flex-col gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Let's Connect</h2>
            <p className="text-xs text-slate-500 mt-1">Get in touch for contract designs or roles.</p>
          </div>

          <ContactForm />
        </div>
      </section>
    </div>
  );
}
