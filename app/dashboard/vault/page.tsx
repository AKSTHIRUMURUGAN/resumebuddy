"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Plus, Trash2, ArrowLeft, Loader2, Save, Sparkles, CheckCircle2,
  Briefcase, BookOpen, Award, Code, GraduationCap, Globe, ShieldAlert,
  Trophy, Users, FileText, Heart, Languages
} from "lucide-react";
import { motion } from "framer-motion";

export default function VaultPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"experience" | "projects" | "skills" | "education" | "certifications" | "hackathons" | "leadership" | "publications" | "volunteering" | "languages">("skills");

  // State slices matching the model fields
  const [skills, setSkills] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [leadership, setLeadership] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [volunteering, setVolunteering] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  // Fetch Career Vault details
  const { data: vaultData, isLoading } = useQuery({
    queryKey: ["vault"],
    queryFn: async () => {
      const res = await fetch("/api/vault");
      if (!res.ok) throw new Error("Failed to load vault");
      const json = await res.json();
      return json.data || {};
    }
  });

  // Sync state when data is loaded
  useEffect(() => {
    if (vaultData) {
      setSkills(vaultData.skills || []);
      setExperience(vaultData.experience || []);
      setProjects(vaultData.projects || []);
      setEducation(vaultData.education || []);
      setCertifications(vaultData.certifications || []);
      setHackathons(vaultData.hackathons || []);
      setLeadership(vaultData.leadership || []);
      setPublications(vaultData.publications || []);
      setVolunteering(vaultData.volunteering || []);
      setLanguages(vaultData.languages || []);
    }
  }, [vaultData]);

  // Save vault mutation
  const saveVaultMutation = useMutation({
    mutationFn: async (updatedVault: any) => {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedVault)
      });
      if (!res.ok) throw new Error("Failed to save vault data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault"] });
    }
  });

  const handleSave = () => {
    saveVaultMutation.mutate({
      skills,
      experience,
      projects,
      education,
      certifications,
      hackathons,
      leadership,
      publications,
      volunteering,
      languages
    });
  };

  // State mutator functions
  const addSkill = () => {
    setSkills([...skills, { name: "", category: "Backend", proficiency: "intermediate" }]);
  };

  const removeSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const updateSkill = (idx: number, field: string, value: any) => {
    const updated = [...skills];
    updated[idx] = { ...updated[idx], [field]: value };
    setSkills(updated);
  };

  const addExperience = () => {
    setExperience([...experience, {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      highlights: [""],
      location: ""
    }]);
  };

  const removeExperience = (idx: number) => {
    setExperience(experience.filter((_, i) => i !== idx));
  };

  const updateExperience = (idx: number, field: string, value: any) => {
    const updated = [...experience];
    updated[idx] = { ...updated[idx], [field]: value };
    setExperience(updated);
  };

  const addExpHighlight = (expIdx: number) => {
    const updated = [...experience];
    updated[expIdx].highlights = [...(updated[expIdx].highlights || []), ""];
    setExperience(updated);
  };

  const updateExpHighlight = (expIdx: number, hlIdx: number, value: string) => {
    const updated = [...experience];
    updated[expIdx].highlights[hlIdx] = value;
    setExperience(updated);
  };

  const removeExpHighlight = (expIdx: number, hlIdx: number) => {
    const updated = [...experience];
    updated[expIdx].highlights = updated[expIdx].highlights.filter((_: any, i: number) => i !== hlIdx);
    setExperience(updated);
  };

  const addProject = () => {
    setProjects([...projects, {
      title: "",
      description: "",
      url: "",
      technologies: [],
      highlights: [""]
    }]);
  };

  const removeProject = (idx: number) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  const updateProject = (idx: number, field: string, value: any) => {
    const updated = [...projects];
    updated[idx] = { ...updated[idx], [field]: value };
    setProjects(updated);
  };

  const addProjectHighlight = (projIdx: number) => {
    const updated = [...projects];
    updated[projIdx].highlights = [...(updated[projIdx].highlights || []), ""];
    setProjects(updated);
  };

  const updateProjectHighlight = (projIdx: number, hlIdx: number, value: string) => {
    const updated = [...projects];
    updated[projIdx].highlights[hlIdx] = value;
    setProjects(updated);
  };

  const removeProjectHighlight = (projIdx: number, hlIdx: number) => {
    const updated = [...projects];
    updated[projIdx].highlights = updated[projIdx].highlights.filter((_: any, i: number) => i !== hlIdx);
    setProjects(updated);
  };

  const addEducation = () => {
    setEducation([...education, {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      gpa: ""
    }]);
  };

  const removeEducation = (idx: number) => {
    setEducation(education.filter((_, i) => i !== idx));
  };

  const updateEducation = (idx: number, field: string, value: any) => {
    const updated = [...education];
    updated[idx] = { ...updated[idx], [field]: value };
    setEducation(updated);
  };

  const addCertification = () => {
    setCertifications([...certifications, {
      name: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credentialUrl: ""
    }]);
  };

  const removeCertification = (idx: number) => {
    setCertifications(certifications.filter((_, i) => i !== idx));
  };

  const updateCertification = (idx: number, field: string, value: any) => {
    const updated = [...certifications];
    updated[idx] = { ...updated[idx], [field]: value };
    setCertifications(updated);
  };

  // Hackathons
  const addHackathon = () => setHackathons([...hackathons, { name: "", organizer: "", year: "", award: "", role: "", description: "" }]);
  const removeHackathon = (idx: number) => setHackathons(hackathons.filter((_, i) => i !== idx));
  const updateHackathon = (idx: number, field: string, value: any) => {
    const updated = [...hackathons]; updated[idx] = { ...updated[idx], [field]: value }; setHackathons(updated);
  };

  // Leadership
  const addLeadership = () => setLeadership([...leadership, { role: "", organization: "", duration: "", description: "", impact: "" }]);
  const removeLeadership = (idx: number) => setLeadership(leadership.filter((_, i) => i !== idx));
  const updateLeadership = (idx: number, field: string, value: any) => {
    const updated = [...leadership]; updated[idx] = { ...updated[idx], [field]: value }; setLeadership(updated);
  };

  // Publications
  const addPublication = () => setPublications([...publications, { title: "", publisher: "", year: "", url: "", description: "" }]);
  const removePublication = (idx: number) => setPublications(publications.filter((_, i) => i !== idx));
  const updatePublication = (idx: number, field: string, value: any) => {
    const updated = [...publications]; updated[idx] = { ...updated[idx], [field]: value }; setPublications(updated);
  };

  // Volunteering
  const addVolunteering = () => setVolunteering([...volunteering, { organization: "", role: "", duration: "", description: "" }]);
  const removeVolunteering = (idx: number) => setVolunteering(volunteering.filter((_, i) => i !== idx));
  const updateVolunteering = (idx: number, field: string, value: any) => {
    const updated = [...volunteering]; updated[idx] = { ...updated[idx], [field]: value }; setVolunteering(updated);
  };

  // Languages
  const addLanguage = () => setLanguages([...languages, { name: "", proficiency: "Conversational" }]);
  const removeLanguage = (idx: number) => setLanguages(languages.filter((_, i) => i !== idx));
  const updateLanguage = (idx: number, field: string, value: any) => {
    const updated = [...languages]; updated[idx] = { ...updated[idx], [field]: value }; setLanguages(updated);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-40 glass border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="text-slate-500 hover:text-white transition-smooth p-1 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-display text-xl font-bold tracking-tight text-white ml-2">
            Career<span className="text-indigo-400">Vault</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saveVaultMutation.isPending}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-smooth shadow-lg shadow-indigo-600/30"
          >
            {saveVaultMutation.isPending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Save className="h-4.5 w-4.5" />
            )}
            Save Changes
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
        
        {/* Left Tabs Column */}
        <div className="md:w-1/4 flex flex-col gap-2">
          {([
            { key: "skills", icon: <Code className="h-4 w-4" />, label: "Skills", count: skills.length },
            { key: "experience", icon: <Briefcase className="h-4 w-4" />, label: "Experience", count: experience.length },
            { key: "projects", icon: <BookOpen className="h-4 w-4" />, label: "Projects", count: projects.length },
            { key: "education", icon: <GraduationCap className="h-4 w-4" />, label: "Education", count: education.length },
            { key: "certifications", icon: <Award className="h-4 w-4" />, label: "Certifications", count: certifications.length },
            { key: "hackathons", icon: <Trophy className="h-4 w-4" />, label: "Hackathons", count: hackathons.length },
            { key: "leadership", icon: <Users className="h-4 w-4" />, label: "Leadership", count: leadership.length },
            { key: "publications", icon: <FileText className="h-4 w-4" />, label: "Publications", count: publications.length },
            { key: "volunteering", icon: <Heart className="h-4 w-4" />, label: "Volunteering", count: volunteering.length },
            { key: "languages", icon: <Languages className="h-4 w-4" />, label: "Languages", count: languages.length },
          ] as any[]).map(({ key, icon, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-smooth text-left ${activeTab === key ? "bg-indigo-600 text-white" : "bg-slate-900/40 text-slate-400 hover:bg-slate-900 hover:text-white"}`}
            >
              {icon}
              {label} <span className="ml-auto text-[10px] opacity-60">({count})</span>
            </button>
          ))}
        </div>

        {/* Right Tab Contents Column */}
        <div className="flex-1 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-40 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mr-2" />
              <span>Loading Vault database...</span>
            </div>
          ) : (
            <div>
              {saveVaultMutation.isSuccess && (
                <div className="mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>All career snapshots saved successfully to MongoDB.</span>
                </div>
              )}

              {/* Skills Tab Content */}
              {activeTab === "skills" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Skills Matrix</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Manage master programming languages, frameworks, and tools.</p>
                    </div>
                    <button 
                      onClick={addSkill}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Skill
                    </button>
                  </div>

                  {skills.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No skills added. Click Add Skill to start.</div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {skills.map((skill, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                          <div className="flex-1 flex flex-col gap-2">
                            <input 
                              type="text" 
                              value={skill.name || ""} 
                              onChange={(e) => updateSkill(idx, "name", e.target.value)}
                              placeholder="e.g. React"
                              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                            <div className="flex items-center gap-2">
                              <select 
                                value={skill.category || "Backend"} 
                                onChange={(e) => updateSkill(idx, "category", e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-400 focus:outline-none"
                              >
                                <option value="Frontend">Frontend</option>
                                <option value="Backend">Backend</option>
                                <option value="DevOps">DevOps</option>
                                <option value="Database">Database</option>
                                <option value="Language">Language</option>
                                <option value="Soft Skill">Soft Skill</option>
                              </select>
                              <select 
                                value={skill.proficiency || "intermediate"} 
                                onChange={(e) => updateSkill(idx, "proficiency", e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-400 focus:outline-none"
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="expert">Expert</option>
                              </select>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeSkill(idx)}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Experience Tab Content */}
              {activeTab === "experience" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Work Experience</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Define job progression timelines, bullet accomplishments, and locations.</p>
                    </div>
                    <button 
                      onClick={addExperience}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Job
                    </button>
                  </div>

                  {experience.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No work experience added.</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {experience.map((exp, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative">
                          <button 
                            onClick={() => removeExperience(idx)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                              <input 
                                type="text"
                                value={exp.company || ""}
                                onChange={(e) => updateExperience(idx, "company", e.target.value)}
                                placeholder="e.g. Google"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Role / Position</label>
                              <input 
                                type="text"
                                value={exp.position || ""}
                                onChange={(e) => updateExperience(idx, "position", e.target.value)}
                                placeholder="e.g. Software Engineer"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                              <input 
                                type="text"
                                value={exp.startDate || ""}
                                onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                                placeholder="e.g. June 2021"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
                              <input 
                                type="text"
                                value={exp.current ? "Present" : (exp.endDate || "")}
                                disabled={exp.current}
                                onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                                placeholder="e.g. Present or Dec 2024"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                              <input 
                                type="text"
                                value={exp.location || ""}
                                onChange={(e) => updateExperience(idx, "location", e.target.value)}
                                placeholder="e.g. Bangalore, India"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                              <input 
                                type="checkbox"
                                id={`current-${idx}`}
                                checked={exp.current || false}
                                onChange={(e) => {
                                  updateExperience(idx, "current", e.target.checked);
                                  if (e.target.checked) updateExperience(idx, "endDate", "Present");
                                }}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <label htmlFor={`current-${idx}`} className="text-xs text-slate-300 font-medium cursor-pointer">
                                I currently work in this role
                              </label>
                            </div>
                          </div>

                          {/* Highlights bullet list */}
                          <div className="flex flex-col gap-3 mt-2 border-t border-slate-800/60 pt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Accomplishment Highlights (STAR Format Recommended)</span>
                              <button 
                                onClick={() => addExpHighlight(idx)}
                                className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Bullet
                              </button>
                            </div>

                            {((exp.highlights || [])).map((hl: string, hlIdx: number) => (
                              <div key={hlIdx} className="flex items-center gap-2">
                                <span className="text-slate-600 text-xs">•</span>
                                <input 
                                  type="text"
                                  value={hl}
                                  onChange={(e) => updateExpHighlight(idx, hlIdx, e.target.value)}
                                  placeholder="e.g. Engineered MERN payment processing gateways reducing checkouts dropoff rates by 24%."
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                                <button 
                                  onClick={() => removeExpHighlight(idx, hlIdx)}
                                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Projects Tab Content */}
              {activeTab === "projects" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Project Showcases</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Record tools used, links, and detailed builders summaries.</p>
                    </div>
                    <button 
                      onClick={addProject}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Project
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No projects added.</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative">
                          <button 
                            onClick={() => removeProject(idx)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Project Title</label>
                              <input 
                                type="text"
                                value={proj.title || ""}
                                onChange={(e) => updateProject(idx, "title", e.target.value)}
                                placeholder="e.g. Resume Buddy Dashboard"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Project Link / URL</label>
                              <input 
                                type="text"
                                value={proj.url || ""}
                                onChange={(e) => updateProject(idx, "url", e.target.value)}
                                placeholder="e.g. https://github.com/..."
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Project Description (Brief Summary)</label>
                              <input 
                                type="text"
                                value={proj.description || ""}
                                onChange={(e) => updateProject(idx, "description", e.target.value)}
                                placeholder="e.g. AI-driven SaaS platform providing interactive recruiter reviews and checklist scoring."
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Highlights bullet list */}
                          <div className="flex flex-col gap-3 border-t border-slate-800/60 pt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Project Highlights (Achievements, metrics, integrations)</span>
                              <button 
                                onClick={() => addProjectHighlight(idx)}
                                className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Bullet
                              </button>
                            </div>

                            {((proj.highlights || [])).map((hl: string, hlIdx: number) => (
                              <div key={hlIdx} className="flex items-center gap-2">
                                <span className="text-slate-600 text-xs">•</span>
                                <input 
                                  type="text"
                                  value={hl}
                                  onChange={(e) => updateProjectHighlight(idx, hlIdx, e.target.value)}
                                  placeholder="e.g. Integrated Google Gemini API for real-time section rewrite recommendations."
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                                <button 
                                  onClick={() => removeProjectHighlight(idx, hlIdx)}
                                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Education Tab Content */}
              {activeTab === "education" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Education History</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Manage degrees, colleges, GPAs, and graduation periods.</p>
                    </div>
                    <button 
                      onClick={addEducation}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add School
                    </button>
                  </div>

                  {education.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No education items recorded.</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {education.map((edu, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative">
                          <button 
                            onClick={() => removeEducation(idx)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Institution / University</label>
                              <input 
                                type="text"
                                value={edu.institution || ""}
                                onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                                placeholder="e.g. Stanford University"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Degree (e.g. B.S., M.S.)</label>
                              <input 
                                type="text"
                                value={edu.degree || ""}
                                onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                placeholder="e.g. Bachelor of Science"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Field of Study</label>
                              <input 
                                type="text"
                                value={edu.fieldOfStudy || ""}
                                onChange={(e) => updateEducation(idx, "fieldOfStudy", e.target.value)}
                                placeholder="e.g. Computer Science"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">GPA / Grade Score</label>
                              <input 
                                type="text"
                                value={edu.gpa || ""}
                                onChange={(e) => updateEducation(idx, "gpa", e.target.value)}
                                placeholder="e.g. 3.8/4.0 or 9.2/10"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                              <input 
                                type="text"
                                value={edu.startDate || ""}
                                onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                                placeholder="e.g. Aug 2018"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
                              <input 
                                type="text"
                                value={edu.endDate || ""}
                                onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                                placeholder="e.g. May 2022"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Certifications Tab Content */}
              {activeTab === "certifications" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Certifications & Licenses</h3>
                      <p className="text-xs text-slate-500 mt-0.5">List professional course qualifications, credentials, and expiry dates.</p>
                    </div>
                    <button 
                      onClick={addCertification}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Credential
                    </button>
                  </div>

                  {certifications.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No certifications listed.</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {certifications.map((cert, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative">
                          <button 
                            onClick={() => removeCertification(idx)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Certification Name</label>
                              <input 
                                type="text"
                                value={cert.name || ""}
                                onChange={(e) => updateCertification(idx, "name", e.target.value)}
                                placeholder="e.g. AWS Certified Solutions Architect"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Issuer Organization</label>
                              <input 
                                type="text"
                                value={cert.issuer || ""}
                                onChange={(e) => updateCertification(idx, "issuer", e.target.value)}
                                placeholder="e.g. Amazon Web Services"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Issue Date</label>
                              <input 
                                type="text"
                                value={cert.issueDate || ""}
                                onChange={(e) => updateCertification(idx, "issueDate", e.target.value)}
                                placeholder="e.g. Jan 2024"
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Credential Link / URL</label>
                              <input 
                                type="text"
                                value={cert.credentialUrl || ""}
                                onChange={(e) => updateCertification(idx, "credentialUrl", e.target.value)}
                                placeholder="e.g. https://creds.com/..."
                                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Hackathons Tab */}
              {activeTab === "hackathons" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Hackathons & Competitions</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Log hackathon wins, awards, and team highlights for your resume.</p>
                    </div>
                    <button onClick={addHackathon} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Hackathon
                    </button>
                  </div>
                  {hackathons.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No hackathons added yet. Click Add Hackathon to log your wins.</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {hackathons.map((hack, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative">
                          <button onClick={() => removeHackathon(idx)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"><Trash2 className="h-4 w-4" /></button>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Hackathon Name</label>
                              <input type="text" value={hack.name || ""} onChange={(e) => updateHackathon(idx, "name", e.target.value)} placeholder="e.g. Smart India Hackathon" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Organizer</label>
                              <input type="text" value={hack.organizer || ""} onChange={(e) => updateHackathon(idx, "organizer", e.target.value)} placeholder="e.g. AICTE / HackerEarth" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Year</label>
                              <input type="text" value={hack.year || ""} onChange={(e) => updateHackathon(idx, "year", e.target.value)} placeholder="e.g. 2024" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Award / Rank</label>
                              <input type="text" value={hack.award || ""} onChange={(e) => updateHackathon(idx, "award", e.target.value)} placeholder="e.g. Winner / Runner-up / Top 10" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Your Role</label>
                              <input type="text" value={hack.role || ""} onChange={(e) => updateHackathon(idx, "role", e.target.value)} placeholder="e.g. Team Lead / Backend Dev" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Description / Key Achievement</label>
                              <textarea value={hack.description || ""} onChange={(e) => updateHackathon(idx, "description", e.target.value)} placeholder="Describe the problem you solved and what you built..." className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[70px]" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Leadership Tab */}
              {activeTab === "leadership" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Leadership & Campus Activities</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Vice President, Club Lead, Campus Ambassador roles and community impact.</p>
                    </div>
                    <button onClick={addLeadership} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Role
                    </button>
                  </div>
                  {leadership.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No leadership roles added yet. Log your positions and impact.</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {leadership.map((lead, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative">
                          <button onClick={() => removeLeadership(idx)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"><Trash2 className="h-4 w-4" /></button>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Role / Position</label>
                              <input type="text" value={lead.role || ""} onChange={(e) => updateLeadership(idx, "role", e.target.value)} placeholder="e.g. Vice President" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Organization / Club</label>
                              <input type="text" value={lead.organization || ""} onChange={(e) => updateLeadership(idx, "organization", e.target.value)} placeholder="e.g. Devs Rec / Intellexa AI" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                              <input type="text" value={lead.duration || ""} onChange={(e) => updateLeadership(idx, "duration", e.target.value)} placeholder="e.g. Jan 2023 - Dec 2023" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Impact / Reach</label>
                              <input type="text" value={lead.impact || ""} onChange={(e) => updateLeadership(idx, "impact", e.target.value)} placeholder="e.g. Led 200+ member community" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Responsibilities & Highlights</label>
                              <textarea value={lead.description || ""} onChange={(e) => updateLeadership(idx, "description", e.target.value)} placeholder="What events did you organize? What was your contribution?" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[70px]" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Publications Tab */}
              {activeTab === "publications" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Publications & Research</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Track research papers, journal articles, blogs, and technical write-ups.</p>
                    </div>
                    <button onClick={addPublication} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Publication
                    </button>
                  </div>
                  {publications.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No publications added yet.</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {publications.map((pub, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative">
                          <button onClick={() => removePublication(idx)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"><Trash2 className="h-4 w-4" /></button>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
                              <input type="text" value={pub.title || ""} onChange={(e) => updatePublication(idx, "title", e.target.value)} placeholder="e.g. Machine Learning in Adaptive Systems" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Publisher / Conference</label>
                              <input type="text" value={pub.publisher || ""} onChange={(e) => updatePublication(idx, "publisher", e.target.value)} placeholder="e.g. IEEE / Medium / IJCAI" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Year Published</label>
                              <input type="text" value={pub.year || ""} onChange={(e) => updatePublication(idx, "year", e.target.value)} placeholder="e.g. 2024" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Publication URL</label>
                              <input type="text" value={pub.url || ""} onChange={(e) => updatePublication(idx, "url", e.target.value)} placeholder="https://doi.org/..." className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Abstract / Summary</label>
                              <textarea value={pub.description || ""} onChange={(e) => updatePublication(idx, "description", e.target.value)} placeholder="Brief summary of your research or article..." className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[70px]" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Volunteering Tab */}
              {activeTab === "volunteering" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Volunteering & Social Impact</h3>
                      <p className="text-xs text-slate-500 mt-0.5">NGO involvement, campus drives, community service, and social initiatives.</p>
                    </div>
                    <button onClick={addVolunteering} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Entry
                    </button>
                  </div>
                  {volunteering.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No volunteering entries added yet.</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {volunteering.map((vol, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 relative">
                          <button onClick={() => removeVolunteering(idx)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"><Trash2 className="h-4 w-4" /></button>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Organization</label>
                              <input type="text" value={vol.organization || ""} onChange={(e) => updateVolunteering(idx, "organization", e.target.value)} placeholder="e.g. GFG / NSS / Red Cross" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                              <input type="text" value={vol.role || ""} onChange={(e) => updateVolunteering(idx, "role", e.target.value)} placeholder="e.g. Campus Ambassador" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                              <input type="text" value={vol.duration || ""} onChange={(e) => updateVolunteering(idx, "duration", e.target.value)} placeholder="e.g. Sep 2023 - Present" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            </div>
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                              <textarea value={vol.description || ""} onChange={(e) => updateVolunteering(idx, "description", e.target.value)} placeholder="What did you do? What impact did you create?" className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[70px]" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Languages Tab */}
              {activeTab === "languages" && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Languages</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Spoken and written language proficiencies — Native, Fluent, Conversational, Basic.</p>
                    </div>
                    <button onClick={addLanguage} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Language
                    </button>
                  </div>
                  {languages.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-sm">No languages added yet.</div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {languages.map((lang, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                          <div className="flex-1 flex flex-col gap-2">
                            <input type="text" value={lang.name || ""} onChange={(e) => updateLanguage(idx, "name", e.target.value)} placeholder="e.g. Tamil / English / Hindi" className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                            <select value={lang.proficiency || "Conversational"} onChange={(e) => updateLanguage(idx, "proficiency", e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-400 focus:outline-none">
                              <option>Native / Bilingual</option>
                              <option>Full Professional</option>
                              <option>Fluent</option>
                              <option>Conversational</option>
                              <option>Basic</option>
                            </select>
                          </div>
                          <button onClick={() => removeLanguage(idx)} className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-smooth"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

      </main>
    </div>
  );
}
