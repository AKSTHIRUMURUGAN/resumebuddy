"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { 
  ArrowLeft, Save, Sparkles, Wand2, RefreshCw, FileText, CheckCircle2,
  ChevronRight, Layout, Settings, Eye, EyeOff, Trash2, HelpCircle, Check, Loader2,
  MessageSquare, History, CheckSquare, Share2, Flame, Copy, QrCode, Play,
  Undo2, Redo2
} from "lucide-react";
import { useResumeStore } from "@/store/resumeStore";
import { useToastStore } from "@/store/toastStore";
import ResumeRenderer from "@/components/templates/ResumeRenderer";
import TipTapEditor from "@/components/editor/TipTapEditor";
import CustomizeSidebar from "@/components/editor/CustomizeSidebar";
import { motion, AnimatePresence } from "framer-motion";

function ResumeBuilderWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Get active ID from search query
  const id = searchParams.get("id");
  
  const { 
    activeResume, 
    setActiveResume, 
    selectedSection, 
    setSelectedSection,
    updatePersonalInfo,
    updateSkills,
    updateExperienceHighlight,
    updateProjectHighlight,
    updateFormatting,
    isSaving,
    setIsSaving
  } = useResumeStore();
  
  const addToast = useToastStore((state) => state.addToast);

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [workMode, setWorkMode] = useState<"edit" | "preview">("edit");
  const [activeSidebarTab, setActiveSidebarTab] = useState<"copilot" | "coach" | "optimizer" | "history">("copilot");
  const [activeAccordion, setActiveAccordion] = useState<string>("personal");
  const [leftTab, setLeftTab] = useState<"content" | "customize">("content");

  // Copilot chat state (full-context)
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotHistory, setCopilotHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [sendingCopilot, setSendingCopilot] = useState(false);
  const [copilotSection, setCopilotSection] = useState<string>("entire resume");

  // Optimizer score state
  const [optimizeReport, setOptimizeReport] = useState<any>(null);
  const [loadingOptimize, setLoadingOptimize] = useState(false);
  const [fixingIssue, setFixingIssue] = useState<string | null>(null);

  // Share Dialog state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // AI Interactive Fix Wizard state
  const [fixModalOpen, setFixModalOpen] = useState(false);
  const [fixModalKey, setFixModalKey] = useState<string | null>(null);
  const [fixModalData, setFixModalData] = useState<any>(null);
  const [fixModalOriginalText, setFixModalOriginalText] = useState("");
  const [fixModalExtraContext, setFixModalExtraContext] = useState("");

  // Skills Accordion local states
  const [editingSkillsCategoryIdx, setEditingSkillsCategoryIdx] = useState<number | null>(null);
  const [editSkillsCategoryName, setEditSkillsCategoryName] = useState("");
  const [newSkillInputMap, setNewSkillInputMap] = useState<Record<number, string>>({});

  // In-memory Undo / Redo History Stack
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const isHistoryAction = useRef(false);
  const prevResumeRef = useRef<any>(null);

  // Debounce references for continuous typing saves & history boundary grouping
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const typingStartResumeRef = useRef<any>(null);

  const saveImmediately = (resumeState: any) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    isTypingRef.current = false;
    if (resumeState) {
      saveMutation.mutate(resumeState);
    }
  };

  // Automatically track changes to activeResume for history stack & debounced MongoDB saves
  useEffect(() => {
    if (!activeResume) return;

    const cleanResume = (r: any) => {
      if (!r) return null;
      const { updatedAt, createdAt, _id, __v, ...rest } = r;
      return JSON.stringify(rest);
    };

    const prevClean = cleanResume(prevResumeRef.current);
    const activeClean = cleanResume(activeResume);

    if (prevClean && prevClean !== activeClean) {
      if (!isHistoryAction.current) {
        // Clear any existing timers so we reset the debounce window
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        // Group continuous keystrokes/typing into a single undo stack entry
        if (!isTypingRef.current) {
          isTypingRef.current = true;
          typingStartResumeRef.current = prevResumeRef.current;
          setUndoStack((prev) => {
            const next = [...prev, typingStartResumeRef.current];
            if (next.length > 50) next.shift(); // limit history memory to last 50 edits
            return next;
          });
          setRedoStack([]);
        }

        // Set typing boundary debounce timer (stops typing run after 1200ms)
        typingTimeoutRef.current = setTimeout(() => {
          isTypingRef.current = false;
          prevResumeRef.current = activeResume;
        }, 1200);

        // Set DB save auto-debounce timer (saves to DB after 1500ms of inactivity)
        saveTimeoutRef.current = setTimeout(() => {
          saveMutation.mutate(activeResume);
        }, 1500);
      }
    }

    isHistoryAction.current = false;
    // If not actively typing, track the baseline state
    if (!isTypingRef.current) {
      prevResumeRef.current = activeResume;
    }
  }, [activeResume]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    const current = activeResume;

    isHistoryAction.current = true;
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, current]);
    setActiveResume(prev);
    saveImmediately(prev); // Immediately persist undo baseline
    addToast({ type: "info", title: "Undo Applied", message: "Workspace reverted to previous change." });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const current = activeResume;

    isHistoryAction.current = true;
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, current]);
    setActiveResume(next);
    saveImmediately(next); // Immediately persist redo baseline
    addToast({ type: "info", title: "Redo Applied", message: "Workspace advanced to next change." });
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

  // Coach Chat states
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: "Hello! I am your Resume Buddy AI Coach. Paste a Job Description or ask me how to improve this resume's ATS score." }
  ]);
  const [sendingChat, setSendingChat] = useState(false);

  // Project Optimizer Wizard states
  const [projWizardStep, setProjWizardStep] = useState(1);
  const [projTitle, setProjTitle] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projMetrics, setProjMetrics] = useState("");
  const [projOptimizedVariants, setProjOptimizedVariants] = useState<any>(null);
  const [optimizingProj, setOptimizingProj] = useState(false);

  // Version diff states
  const [diffVerA, setDiffVerA] = useState("");
  const [diffVerB, setDiffVerB] = useState("");
  const [diffResult, setDiffResult] = useState<any>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  // Fetch resume data
  const { data: fetchResult, isLoading } = useQuery({
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

  // Fetch save versions list
  const { data: versionsList, refetch: refetchVersions } = useQuery({
    queryKey: ["resume-versions", id],
    queryFn: async () => {
      if (!id) return [];
      const res = await fetch(`/api/resume/${id}/versions`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!id
  });

  // Sync with Zustand store
  useEffect(() => {
    if (fetchResult) {
      setActiveResume(fetchResult);
    }
  }, [fetchResult, setActiveResume]);

  // Save changes mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      setIsSaving(true);
      const res = await fetch(`/api/resume/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedData, changesSummary: "Edited in workspace builder" })
      });
      if (!res.ok) throw new Error("Failed to save changes");
      return res.json();
    },
    onSuccess: () => {
      setIsSaving(false);
      setSaveStatus("Changes saved to database");
      addToast({
        type: "success",
        title: "Draft Saved",
        message: "Changes successfully synced and saved."
      });
      queryClient.invalidateQueries({ queryKey: ["resume", id] });
      refetchVersions();
      setTimeout(() => setSaveStatus(""), 3000);
    },
    onError: (error: any) => {
      setIsSaving(false);
      setSaveStatus("Failed to save draft");
      addToast({
        type: "error",
        title: "Save Failed",
        message: error.message || "Failed to persist changes to the database."
      });
      setTimeout(() => setSaveStatus(""), 4000);
    }
  });

  // Restore snapshot version mutation
  const restoreMutation = useMutation({
    mutationFn: async (versionNumber: number) => {
      setIsSaving(true);
      const res = await fetch(`/api/resume/${id}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNumber })
      });
      if (!res.ok) throw new Error("Failed to restore snapshot");
      const json = await res.json();
      return json.data;
    },
    onSuccess: (restoredData) => {
      setIsSaving(false);
      setActiveResume(restoredData);
      setSaveStatus(`Restored version snapshot!`);
      addToast({
        type: "success",
        title: "Snapshot Restored",
        message: "Your workspace has been successfully reverted to the selected snapshot version."
      });
      queryClient.invalidateQueries({ queryKey: ["resume", id] });
      setTimeout(() => setSaveStatus(""), 3000);
    },
    onError: (error: any) => {
      setIsSaving(false);
      setSaveStatus("Restore state failed");
      addToast({
        type: "error",
        title: "Restore Failed",
        message: error.message || "Could not restore version snapshot."
      });
      setTimeout(() => setSaveStatus(""), 4000);
    }
  });

  const triggerSave = () => {
    if (activeResume) {
      saveImmediately(activeResume);
    }
  };

  const downloadPdf = () => {
    window.open(`/api/export/pdf?id=${id}`, "_blank");
  };

  const downloadDocx = () => {
    window.open(`/api/export/docx?id=${id}`, "_blank");
  };

  const [emailSending, setEmailSending] = useState(false);
  const emailPdf = async () => {
    setEmailSending(true);
    setSaveStatus("Sending email...");
    try {
      const res = await fetch("/api/export/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: id })
      });
      if (res.ok) {
        setSaveStatus("Resume emailed to inbox!");
        addToast({
          type: "success",
          title: "Email Dispatched",
          message: "A copy of your resume has been sent successfully."
        });
      } else {
        setSaveStatus("Email dispatch failed");
        addToast({
          type: "error",
          title: "Dispatch Failed",
          message: "Failed to dispatch email. Please check configuration."
        });
      }
    } catch (err: any) {
      setSaveStatus("Email dispatch failed");
      addToast({
        type: "error",
        title: "Dispatch Failed",
        message: err.message || "An unexpected network error occurred."
      });
    } finally {
      setEmailSending(false);
      setTimeout(() => setSaveStatus(""), 3500);
    }
  };

  // Trigger browser JSON backup file save
  const downloadJsonBackup = () => {
    if (!activeResume) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(activeResume, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${activeResume.title.replace(/\s+/g, "_")}_backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSaveStatus("JSON backup exported!");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  // Compare version snapshot deltas
  const handleCompareDiff = async () => {
    if (!diffVerA || !diffVerB) return;
    setLoadingDiff(true);
    setDiffResult(null);
    try {
      const res = await fetch(`/api/resume/${id}/diff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionA: parseInt(diffVerA), versionB: parseInt(diffVerB) })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDiffResult(json.data);
      }
    } catch (err) {
      console.error("Diff generation failed", err);
    } finally {
      setLoadingDiff(false);
    }
  };

  // Triggers Gemini AI optimization
  const triggerAiAction = async (action: string) => {
    if (!selectedSection || !activeResume) return;
    
    setLoadingAi(true);
    setAiSuggestions([]);

    let originalText = "";
    if (selectedSection.type === "summary") {
      originalText = activeResume.personalInfo.summary;
    } else if (selectedSection.type === "experience") {
      originalText = activeResume.experience[selectedSection.index].highlights[selectedSection.highlightIndex!];
    } else if (selectedSection.type === "project") {
      originalText = activeResume.projects[selectedSection.index].highlights[selectedSection.highlightIndex!];
    }

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: originalText,
          context: {
            role: activeResume.targetRole || "Software Developer",
            skills: activeResume.skills || []
          }
        })
      });

      if (!res.ok) throw new Error("AI call failed");
      const json = await res.json();
      
      if (json.suggestions) {
        setAiSuggestions(json.suggestions);
      } else if (json.suggestion) {
        setAiSuggestions([json.suggestion]);
      }
    } catch (error: any) {
      console.error("AI optimization failed:", error);
      addToast({
        type: "error",
        title: "AI Action Failed",
        message: error.message?.includes("503") || error.message?.includes("Service Unavailable") || error.message?.includes("high demand")
          ? "The AI service is experiencing high demand. Please try again in a few seconds."
          : error.message || "Failed to call Gemini AI optimization."
      });
    } finally {
      setLoadingAi(false);
    }
  };

  // Chat Coach submit
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { role: "user" as const, content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage("");
    setSendingChat(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: chatHistory,
          resumeId: id
        })
      });
      const json = await res.json();
      if (json.success && json.response) {
        setChatHistory(prev => [...prev, { role: "assistant", content: json.response }]);
      } else {
        setChatHistory(prev => [...prev, { role: "assistant", content: "I encountered an issue analyzing your request." }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "assistant", content: "Connection error with AI Coach server." }]);
    } finally {
      setSendingChat(false);
    }
  };

  // Copilot full-context chat
  const sendCopilotMessage = async (messageOverride?: string) => {
    const msg = messageOverride || copilotInput.trim();
    if (!msg || !activeResume) return;
    const userMsg = { role: "user" as const, content: msg };
    setCopilotHistory(prev => [...prev, userMsg]);
    setCopilotInput("");
    setSendingCopilot(true);
    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: copilotHistory,
          resumeId: id,
          focusSection: copilotSection,
          resumeContext: {
            name: activeResume.personalInfo?.fullName,
            role: activeResume.targetRole,
            summary: activeResume.personalInfo?.summary,
            skills: activeResume.skills,
            experience: (activeResume.experience || []).map((e: any) => `${e.position} at ${e.company}`),
            projects: (activeResume.projects || []).map((p: any) => p.title),
          }
        })
      });
      const json = await res.json();
      if (json.success && json.response) {
        setCopilotHistory(prev => [...prev, { role: "assistant", content: json.response }]);
      } else {
        setCopilotHistory(prev => [...prev, { role: "assistant", content: "I had trouble processing that. Please try again." }]);
      }
    } catch {
      setCopilotHistory(prev => [...prev, { role: "assistant", content: "Connection error. Please retry." }]);
    } finally {
      setSendingCopilot(false);
    }
  };

  // Run full resume optimizer scan
  const runOptimize = async () => {
    if (!activeResume) return;
    setLoadingOptimize(true);
    setOptimizeReport(null);
    try {
      const res = await fetch("/api/ai/optimize-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: id, resume: activeResume })
      });
      const json = await res.json();
      if (json.success && json.data) setOptimizeReport(json.data);
    } catch (err: any) {
      addToast({ type: "error", title: "Analysis Failed", message: err.message || "Could not run optimization scan." });
    } finally {
      setLoadingOptimize(false);
    }
  };

  // Open context modal for the user to review and enhance details
  const fixIssue = (issueKey: string, issueData: any) => {
    if (!activeResume) return;

    // Direct informational fixes that don't need a text rewrite modal
    if (issueKey === "contact_linkedin" || issueKey === "sections") {
      executeFixIssue(issueKey, issueData, "", "");
      return;
    }

    // Determine the sample text to edit
    const sampleText = issueData.sample || activeResume.personalInfo?.summary || "";
    setFixModalKey(issueKey);
    setFixModalData(issueData);
    setFixModalOriginalText(sampleText);
    setFixModalExtraContext("");
    setFixModalOpen(true);
  };

  // Perform actual API call with user-provided parameters & context
  const executeFixIssue = async (issueKey: string, issueData: any, originalText: string, extraContext: string) => {
    setFixingIssue(issueKey);
    setFixModalOpen(false);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: issueKey,
          text: originalText || issueData.sample || activeResume?.personalInfo?.summary || "",
          context: {
            role: activeResume?.targetRole || "Software Developer",
            skills: activeResume?.skills || [],
            issue: issueData,
            extraContext: extraContext, // user context (team size, dates, impact)
            fullResume: activeResume
          }
        })
      });
      const json = await res.json();
      const fixed = json.suggestion || (json.suggestions && json.suggestions[0]) || null;
      if (fixed) {
        // 1. Traverse and update matching highlight in experience or projects
        let applied = false;
        let nextResume = { ...activeResume };

        if (nextResume.experience?.length) {
          const updatedExp = [...nextResume.experience];
          for (let eIdx = 0; eIdx < updatedExp.length; eIdx++) {
            const hIdx = (updatedExp[eIdx].highlights || []).indexOf(issueData.sample);
            if (hIdx !== -1) {
              updatedExp[eIdx] = {
                ...updatedExp[eIdx],
                highlights: [
                  ...updatedExp[eIdx].highlights.slice(0, hIdx),
                  fixed,
                  ...updatedExp[eIdx].highlights.slice(hIdx + 1)
                ]
              };
              nextResume = { ...nextResume, experience: updatedExp };
              applied = true;
              break;
            }
          }
        }

        if (!applied && nextResume.projects?.length) {
          const updatedProj = [...nextResume.projects];
          for (let pIdx = 0; pIdx < updatedProj.length; pIdx++) {
            const hIdx = (updatedProj[pIdx].highlights || []).indexOf(issueData.sample);
            if (hIdx !== -1) {
              updatedProj[pIdx] = {
                ...updatedProj[pIdx],
                highlights: [
                  ...updatedProj[pIdx].highlights.slice(0, hIdx),
                  fixed,
                  ...updatedProj[pIdx].highlights.slice(hIdx + 1)
                ]
              };
              nextResume = { ...nextResume, projects: updatedProj };
              applied = true;
              break;
            }
          }
        }

        // Fallback: update summary
        if (!applied) {
          nextResume = {
            ...nextResume,
            personalInfo: { ...nextResume.personalInfo, summary: fixed }
          };
        }

        // Apply changes to store & trigger auto-save mutation
        setActiveResume(nextResume);
        saveImmediately(nextResume);

        addToast({ type: "success", title: "Issue Fixed & Saved", message: `Applied and auto-saved AI fix for: ${issueKey}` });

        // Update optimization report state locally to avoid slow AI re-scan
        if (optimizeReport) {
          const updatedIssues = (optimizeReport.issues || []).map((iss: any) => {
            if (iss.key === issueKey) {
              return { ...iss, status: "pass", description: "Fixed with AI successfully." };
            }
            return iss;
          });
          const failingIssues = updatedIssues.filter((i: any) => i.status === "fail");
          const totalIssuesLeft = failingIssues.length;
          
          // Boost score locally per fix
          const prevFailing = (optimizeReport.issues || []).filter((i: any) => i.status === "fail").length;
          const fixedDiff = prevFailing - totalIssuesLeft;
          const newScore = Math.min(100, optimizeReport.score + (fixedDiff * 8));

          setOptimizeReport({
            ...optimizeReport,
            score: newScore,
            totalIssues: totalIssuesLeft,
            issues: updatedIssues
          });

          // Only auto-rescan using AI if all issues are completely resolved
          if (totalIssuesLeft === 0) {
            await runOptimize();
          }
        }
      }
    } catch (err: any) {
      addToast({ type: "error", title: "Fix Failed", message: err.message || "Could not apply fix." });
    } finally {
      setFixingIssue(null);
    }
  };

  const executeInlineImprove = async (selectedText: string, replaceText: (newText: string) => void) => {
    addToast({ type: "info", title: "Improving Selection", message: "Connecting to AI..." });
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "professional", // professional improvement prompt
          text: selectedText,
          context: {
            role: activeResume?.targetRole || "Software Developer",
            skills: activeResume?.skills || []
          }
        })
      });
      const json = await res.json();
      const result = json.suggestion || (json.suggestions && json.suggestions[0]);
      if (result) {
        replaceText(result);
        addToast({ type: "success", title: "Improved Selection", message: "Successfully replaced with professional AI rewrite!" });
      } else {
        throw new Error("No suggestion returned");
      }
    } catch (err: any) {
      addToast({ type: "error", title: "AI Action Failed", message: err.message || "Failed to process text selection." });
    }
  };



  // Project Optimizer Wizard submit
  const optimizeProject = async () => {
    setOptimizingProj(true);
    setProjOptimizedVariants(null);
    try {
      const res = await fetch("/api/ai/project-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projTitle,
          description: projDesc,
          technologies: projTech.split(",").map(t => t.trim()).filter(Boolean),
          metrics: projMetrics,
          role: activeResume?.targetRole || "Software Developer"
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setProjOptimizedVariants(json.data);
        setProjWizardStep(3);
      }
    } catch (err: any) {
      console.error("Optimize project highlights failed", err);
      addToast({
        type: "error",
        title: "Project Optimization Failed",
        message: err.message?.includes("503") || err.message?.includes("Service Unavailable") || err.message?.includes("high demand")
          ? "The AI service is experiencing high demand. Please try again in a few seconds."
          : err.message || "Failed to generate optimized project highlights."
      });
    } finally {
      setOptimizingProj(false);
    }
  };

  // Inserts optimized project into current resume store
  const insertOptimizedProject = (selectedBullet: string) => {
    if (!activeResume) return;
    const newProj = {
      title: projTitle,
      description: projDesc,
      technologies: projTech.split(",").map(t => t.trim()).filter(Boolean),
      highlights: [selectedBullet],
      url: ""
    };
    
    const updatedProjects = [...(activeResume.projects || []), newProj];
    setActiveResume({ ...activeResume, projects: updatedProjects });

    // Reset wizard
    setProjWizardStep(1);
    setProjTitle("");
    setProjDesc("");
    setProjTech("");
    setProjMetrics("");
    setProjOptimizedVariants(null);
    setActiveSidebarTab("copilot");
  };

  // Applies selected AI suggestion to the resume draft
  const applySuggestion = (text: string) => {
    if (!selectedSection || !activeResume) return;

    if (selectedSection.type === "summary") {
      updatePersonalInfo({ summary: text });
    } else if (selectedSection.type === "experience") {
      updateExperienceHighlight(selectedSection.index, selectedSection.highlightIndex!, text);
    } else if (selectedSection.type === "project") {
      updateProjectHighlight(selectedSection.index, selectedSection.highlightIndex!, text);
    }

    // Reset AI panel
    setAiSuggestions([]);
    setSelectedSection(null);
  };

  const getSelectedContent = () => {
    if (!selectedSection || !activeResume) return "";
    if (selectedSection.type === "summary") {
      return activeResume.personalInfo?.summary || "";
    } else if (selectedSection.type === "experience") {
      return activeResume.experience?.[selectedSection.index]?.highlights?.[selectedSection.highlightIndex!] || "";
    } else if (selectedSection.type === "project") {
      return activeResume.projects?.[selectedSection.index]?.highlights?.[selectedSection.highlightIndex!] || "";
    }
    return "";
  };

  // Generate shareable URL
  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/share/${id}`;
    }
    return "";
  };

  const getPortfolioUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/portfolio/${id}`;
    }
    return "";
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <span>Loading workspace canvas...</span>
      </div>
    );
  }

  if (!activeResume) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400 gap-4">
        <span>No active resume loaded.</span>
        <Link href="/dashboard" className="text-indigo-400 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Workspace Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-900 bg-slate-950 z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-smooth">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white leading-tight">{activeResume.title}</h1>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">{activeResume.templateId} Layout template</span>
          </div>
        </div>

        {/* Sync Indicator & Actions */}
        <div className="flex items-center gap-4">
           {saveStatus && (
            <span className="text-xs text-indigo-400 font-medium animate-pulse">
              {saveStatus}
            </span>
          )}

          {/* Undo / Redo Actions Group */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:text-slate-600 transition-colors"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:text-slate-600 transition-colors"
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Heatmap Toggle */}
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-smooth ${
              showHeatmap 
                ? "bg-amber-500/10 border-amber-500 text-amber-400" 
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            {showHeatmap ? "Heatmap Active" : "Show Heatmap"}
          </button>

          <button 
            onClick={triggerSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-smooth"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </button>
          
          <button 
            onClick={downloadPdf}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition-smooth"
          >
            PDF
          </button>
          
          <button 
            onClick={downloadDocx}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition-smooth"
          >
            DOCX
          </button>

          <button 
            onClick={downloadJsonBackup}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 px-3 py-2 rounded-xl text-xs font-semibold transition-smooth"
          >
            JSON Backup
          </button>

          <button 
            onClick={emailPdf}
            disabled={emailSending}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition-smooth"
          >
            {emailSending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Email Inbox"}
          </button>

          <button 
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition-smooth"
          >
            <Share2 className="h-3.5 w-3.5 text-indigo-400" />
            Share
          </button>

          <Link 
            href={`/ats-checker?id=${id}`}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-600 text-slate-350 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-smooth"
          >
            Audit Resume
            <ChevronRight className="h-4 w-4" />
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

      {/* Split Workspace Panels */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Form Controls Panel */}
        <div className="w-[350px] border-r border-slate-900 bg-slate-950 flex flex-col overflow-hidden">
          {/* Left Tab Switcher */}
          <div className="flex border-b border-slate-800/80 shrink-0">
            <button
              onClick={() => setLeftTab("content")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                leftTab === "content"
                  ? "text-white border-b-2 border-indigo-500 bg-slate-900/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              Content
            </button>
            <button
              onClick={() => setLeftTab("customize")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                leftTab === "customize"
                  ? "text-white border-b-2 border-violet-500 bg-slate-900/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Layout className="h-3.5 w-3.5" />
              Customize
            </button>
          </div>

          {/* Scrollable Panel Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">

          {/* ── CUSTOMIZE TAB ── */}
          {leftTab === "customize" && (
            <CustomizeSidebar
              formatting={activeResume.formatting || {}}
              onUpdate={(updates) => updateFormatting(updates)}
              resumeData={activeResume}
            />
          )}

          {/* ── CONTENT TAB ── */}
          {leftTab === "content" && <>

          {/* Personal Info Accordion */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveAccordion(activeAccordion === "personal" ? "" : "personal")}
                className="flex items-center gap-2 text-left font-bold text-xs uppercase tracking-wider text-slate-350 hover:text-white transition-colors cursor-pointer"
              >
                <span>{activeAccordion === "personal" ? "▼" : "▶"}</span>
                <span>Personal Info</span>
              </button>
            </div>
            
            {activeAccordion === "personal" && (
              <div className="flex flex-col gap-3 mt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                  <input 
                    type="text"
                    value={activeResume.personalInfo.fullName || ""}
                    onChange={(e) => updatePersonalInfo({ fullName: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input 
                    type="text"
                    value={activeResume.personalInfo.email || ""}
                    onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <input 
                    type="text"
                    value={activeResume.personalInfo.phone || ""}
                    onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                  <input 
                    type="text"
                    value={activeResume.personalInfo.location || ""}
                    onChange={(e) => updatePersonalInfo({ location: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">LinkedIn Profile</label>
                  <input 
                    type="text"
                    placeholder="https://linkedin.com/in/username"
                    value={activeResume.personalInfo.linkedin || ""}
                    onChange={(e) => updatePersonalInfo({ linkedin: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">GitHub Profile</label>
                  <input 
                    type="text"
                    placeholder="https://github.com/username"
                    value={activeResume.personalInfo.github || ""}
                    onChange={(e) => updatePersonalInfo({ github: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Portfolio Website</label>
                  <input 
                    type="text"
                    placeholder="https://mywebsite.dev"
                    value={activeResume.personalInfo.website || ""}
                    onChange={(e) => updatePersonalInfo({ website: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Layout & Style Accordion */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveAccordion(activeAccordion === "layout" ? "" : "layout")}
                className="flex items-center gap-2 text-left font-bold text-xs uppercase tracking-wider text-slate-350 hover:text-white transition-colors cursor-pointer"
              >
                <span>{activeAccordion === "layout" ? "▼" : "▶"}</span>
                <span>Layout & Style</span>
              </button>
            </div>

            {activeAccordion === "layout" && (
              <div className="flex flex-col gap-3 mt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Font Family (ATS Friendly)</label>
                  <select 
                    value={activeResume.formatting.fontFamily || "Arial"}
                    onChange={(e) => updateFormatting({ fontFamily: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Arial">Arial (Clean Sans-Serif)</option>
                    <option value="Calibri">Calibri (Modern Sans-Serif)</option>
                    <option value="Georgia">Georgia (Elegant Serif)</option>
                    <option value="Times New Roman">Times New Roman (Traditional Serif)</option>
                    <option value="Helvetica">Helvetica (Universal Sans-Serif)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Color Scheme (Professional Colors)</label>
                  <select 
                    value={activeResume.formatting.colorScheme || "charcoal"}
                    onChange={(e) => updateFormatting({ colorScheme: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="charcoal">Charcoal / Dark Slate</option>
                    <option value="navy">Navy Blue</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="burgundy">Burgundy / Wine</option>
                    <option value="teal">Corporate Teal</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Template Layout Category</label>
                  <select 
                    value={activeResume.templateId || "minimal"}
                    onChange={(e) => {
                      const updated = { ...activeResume, templateId: e.target.value };
                      setActiveResume(updated);
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="minimal">Minimalist Layout</option>
                    <option value="modern">Modern Two-Column Layout</option>
                    <option value="ats">ATS Parsing Friendly (Arial)</option>
                    <option value="executive">Executive Classic Leader</option>
                    <option value="harvard">Harvard Ivy League (Academic)</option>
                    <option value="tech">Developer Console (Monospace)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Professional Summary Accordion */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveAccordion(activeAccordion === "summary" ? "" : "summary")}
                className="flex items-center gap-2 text-left font-bold text-xs uppercase tracking-wider text-slate-350 hover:text-white transition-colors cursor-pointer"
              >
                <span>{activeAccordion === "summary" ? "▼" : "▶"}</span>
                <span>Professional Summary</span>
              </button>
              <button
                onClick={() => {
                  const visibility = activeResume.formatting.sectionVisibility || {};
                  updateFormatting({
                    sectionVisibility: {
                      ...visibility,
                      summary: visibility.summary === false ? true : false
                    }
                  });
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {activeResume.formatting.sectionVisibility?.summary !== false ? <Eye className="h-4 w-4 text-indigo-400" /> : <EyeOff className="h-4 w-4 text-slate-600" />}
              </button>
            </div>

            {activeAccordion === "summary" && (
              <div className="flex flex-col gap-2 mt-3">
                <textarea
                  value={activeResume.personalInfo.summary || ""}
                  onChange={(e) => updatePersonalInfo({ summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white min-h-[100px] focus:outline-none focus:border-indigo-500"
                  placeholder="Summarize your professional experience..."
                />
              </div>
            )}
          </div>

          {/* Work Experience Accordion */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveAccordion(activeAccordion === "experience" ? "" : "experience")}
                className="flex items-center gap-2 text-left font-bold text-xs uppercase tracking-wider text-slate-350 hover:text-white transition-colors cursor-pointer"
              >
                <span>{activeAccordion === "experience" ? "▼" : "▶"}</span>
                <span>Work Experience</span>
              </button>
              <button
                onClick={() => {
                  const visibility = activeResume.formatting.sectionVisibility || {};
                  updateFormatting({
                    sectionVisibility: {
                      ...visibility,
                      experience: visibility.experience === false ? true : false
                    }
                  });
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {activeResume.formatting.sectionVisibility?.experience !== false ? <Eye className="h-4 w-4 text-indigo-400" /> : <EyeOff className="h-4 w-4 text-slate-600" />}
              </button>
            </div>

            {activeAccordion === "experience" && (
              <div className="flex flex-col gap-4 mt-3">
                {(activeResume.experience || []).map((exp: any, expIdx: number) => (
                  <div key={expIdx} className="border border-slate-805 bg-slate-950/40 p-3 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">JOB #{expIdx + 1}</span>
                      <button 
                        onClick={() => {
                          const updated = [...activeResume.experience];
                          updated.splice(expIdx, 1);
                          setActiveResume({ ...activeResume, experience: updated });
                        }}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-semibold">Position</label>
                      <input 
                        type="text" 
                        value={exp.position || ""} 
                        onChange={(e) => {
                          const updated = [...activeResume.experience];
                          updated[expIdx].position = e.target.value;
                          setActiveResume({ ...activeResume, experience: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-semibold">Company</label>
                      <input 
                        type="text" 
                        value={exp.company || ""} 
                        onChange={(e) => {
                          const updated = [...activeResume.experience];
                          updated[expIdx].company = e.target.value;
                          setActiveResume({ ...activeResume, experience: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 uppercase font-semibold">Duration</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2024 - Present"
                          value={exp.duration || ""} 
                          onChange={(e) => {
                            const updated = [...activeResume.experience];
                            updated[expIdx].duration = e.target.value;
                            setActiveResume({ ...activeResume, experience: updated });
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 uppercase font-semibold">Location</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Remote"
                          value={exp.location || ""} 
                          onChange={(e) => {
                            const updated = [...activeResume.experience];
                            updated[expIdx].location = e.target.value;
                            setActiveResume({ ...activeResume, experience: updated });
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Highlights (Bullets) */}
                    <div className="flex flex-col gap-2 mt-1">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">Bullet Highlights</span>
                      {(exp.highlights || []).map((hl: string, hlIdx: number) => (
                        <div key={hlIdx} className="flex gap-1.5 items-center">
                          <input 
                            type="text"
                            value={hl}
                            onChange={(e) => {
                              const updated = [...activeResume.experience];
                              updated[expIdx].highlights[hlIdx] = e.target.value;
                              setActiveResume({ ...activeResume, experience: updated });
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-white focus:outline-none"
                          />
                          <button 
                            onClick={() => {
                              const updated = [...activeResume.experience];
                              updated[expIdx].highlights.splice(hlIdx, 1);
                              setActiveResume({ ...activeResume, experience: updated });
                            }}
                            className="text-slate-650 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const updated = [...activeResume.experience];
                          updated[expIdx].highlights = [...(updated[expIdx].highlights || []), ""];
                          setActiveResume({ ...activeResume, experience: updated });
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold self-start mt-1 cursor-pointer"
                      >
                        + Add Highlight Bullet
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => {
                    const updated = [...(activeResume.experience || []), {
                      company: "New Company",
                      position: "Position / Role",
                      duration: "Jan 2024 - Present",
                      location: "Remote",
                      highlights: ["Core technical contribution summary"]
                    }];
                    setActiveResume({ ...activeResume, experience: updated });
                  }}
                  className="bg-slate-900 border border-slate-800 text-xs font-bold text-white py-2 rounded-xl hover:bg-slate-850 cursor-pointer"
                >
                  + Add Work Experience
                </button>
              </div>
            )}
          </div>

          {/* Key Projects Accordion */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveAccordion(activeAccordion === "projects" ? "" : "projects")}
                className="flex items-center gap-2 text-left font-bold text-xs uppercase tracking-wider text-slate-350 hover:text-white transition-colors cursor-pointer"
              >
                <span>{activeAccordion === "projects" ? "▼" : "▶"}</span>
                <span>Key Projects</span>
              </button>
              <button
                onClick={() => {
                  const visibility = activeResume.formatting.sectionVisibility || {};
                  updateFormatting({
                    sectionVisibility: {
                      ...visibility,
                      projects: visibility.projects === false ? true : false
                    }
                  });
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {activeResume.formatting.sectionVisibility?.projects !== false ? <Eye className="h-4 w-4 text-indigo-400" /> : <EyeOff className="h-4 w-4 text-slate-600" />}
              </button>
            </div>

            {activeAccordion === "projects" && (
              <div className="flex flex-col gap-4 mt-3">
                {(activeResume.projects || []).map((proj: any, projIdx: number) => (
                  <div key={projIdx} className="border border-slate-805 bg-slate-950/40 p-3 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">PROJECT #{projIdx + 1}</span>
                      <button 
                        onClick={() => {
                          const updated = [...activeResume.projects];
                          updated.splice(projIdx, 1);
                          setActiveResume({ ...activeResume, projects: updated });
                        }}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-semibold">Title</label>
                      <input 
                        type="text" 
                        value={proj.title || ""} 
                        onChange={(e) => {
                          const updated = [...activeResume.projects];
                          updated[projIdx].title = e.target.value;
                          setActiveResume({ ...activeResume, projects: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-semibold">Project URL / Link</label>
                      <input 
                        type="text" 
                        placeholder="https://github.com/project"
                        value={proj.url || ""} 
                        onChange={(e) => {
                          const updated = [...activeResume.projects];
                          updated[projIdx].url = e.target.value;
                          setActiveResume({ ...activeResume, projects: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-semibold">Technologies (comma-separated)</label>
                      <input 
                        type="text" 
                        placeholder="React, Node.js, Tailwind"
                        value={(proj.technologies || []).join(", ")} 
                        onChange={(e) => {
                          const updated = [...activeResume.projects];
                          updated[projIdx].technologies = e.target.value.split(",").map(t => t.trim());
                          setActiveResume({ ...activeResume, projects: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    {/* Highlights (Bullets) */}
                    <div className="flex flex-col gap-2 mt-1">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">Bullet Highlights</span>
                      {(proj.highlights || []).map((hl: string, hlIdx: number) => (
                        <div key={hlIdx} className="flex gap-1.5 items-center">
                          <input 
                            type="text"
                            value={hl}
                            onChange={(e) => {
                              const updated = [...activeResume.projects];
                              updated[projIdx].highlights[hlIdx] = e.target.value;
                              setActiveResume({ ...activeResume, projects: updated });
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-white focus:outline-none"
                          />
                          <button 
                            onClick={() => {
                              const updated = [...activeResume.projects];
                              updated[projIdx].highlights.splice(hlIdx, 1);
                              setActiveResume({ ...activeResume, projects: updated });
                            }}
                            className="text-slate-655 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const updated = [...activeResume.projects];
                          updated[projIdx].highlights = [...(updated[projIdx].highlights || []), ""];
                          setActiveResume({ ...activeResume, projects: updated });
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold self-start mt-1 cursor-pointer"
                      >
                        + Add Highlight Bullet
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => {
                    const updated = [...(activeResume.projects || []), {
                      title: "New Project",
                      url: "",
                      technologies: ["Next.js", "MongoDB"],
                      highlights: ["Key project implementation summary"]
                    }];
                    setActiveResume({ ...activeResume, projects: updated });
                  }}
                  className="bg-slate-900 border border-slate-800 text-xs font-bold text-white py-2 rounded-xl hover:bg-slate-850 cursor-pointer"
                >
                  + Add Project
                </button>
              </div>
            )}
          </div>

          {/* Technical Skills Accordion */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveAccordion(activeAccordion === "skills" ? "" : "skills")}
                className="flex items-center gap-2 text-left font-bold text-xs uppercase tracking-wider text-slate-350 hover:text-white transition-colors cursor-pointer"
              >
                <span>{activeAccordion === "skills" ? "▼" : "▶"}</span>
                <span>Technical Skills</span>
              </button>
              <button
                onClick={() => {
                  const visibility = activeResume.formatting.sectionVisibility || {};
                  updateFormatting({
                    sectionVisibility: {
                      ...visibility,
                      skills: visibility.skills === false ? true : false
                    }
                  });
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {activeResume.formatting.sectionVisibility?.skills !== false ? <Eye className="h-4 w-4 text-indigo-400" /> : <EyeOff className="h-4 w-4 text-slate-600" />}
              </button>
            </div>

            {activeAccordion === "skills" && (() => {
              const editorSkills = (() => {
                const sk = activeResume.skills || [];
                if (sk.length > 0 && typeof sk[0] === "object" && sk[0] !== null && "category" in sk[0]) {
                  return sk as Array<{ category: string; items: string[] }>;
                }
                const stringItems = sk.filter((item: any) => typeof item === "string");
                return [{ category: "Skills", items: stringItems }];
              })();

              return (
                <div className="flex flex-col gap-4 mt-3">
                  {/* Category cards list */}
                  <div className="flex flex-col gap-3">
                    {editorSkills.map((cat, catIdx) => {
                      const isEditingName = editingSkillsCategoryIdx === catIdx;
                      return (
                        <div
                          key={catIdx}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 relative group/card"
                        >
                          {/* Card Header: Drag Handle indicator & Category Title */}
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1.5">
                            <div className="flex items-center gap-2 flex-1">
                              {/* Reorder actions */}
                              <div className="flex flex-col gap-0.5 text-slate-500 opacity-60 hover:opacity-100 shrink-0">
                                <button
                                  onClick={() => {
                                    const next = [...editorSkills];
                                    if (catIdx > 0) {
                                      const temp = next[catIdx];
                                      next[catIdx] = next[catIdx - 1];
                                      next[catIdx - 1] = temp;
                                      updateSkills(next);
                                    }
                                  }}
                                  disabled={catIdx === 0}
                                  className="hover:text-white disabled:opacity-20 cursor-pointer text-[10px]"
                                  title="Move Up"
                                >
                                  ▲
                                </button>
                                <button
                                  onClick={() => {
                                    const next = [...editorSkills];
                                    if (catIdx < next.length - 1) {
                                      const temp = next[catIdx];
                                      next[catIdx] = next[catIdx + 1];
                                      next[catIdx + 1] = temp;
                                      updateSkills(next);
                                    }
                                  }}
                                  disabled={catIdx === editorSkills.length - 1}
                                  className="hover:text-white disabled:opacity-20 cursor-pointer text-[10px]"
                                  title="Move Down"
                                >
                                  ▼
                                </button>
                              </div>

                              {isEditingName ? (
                                <input
                                  type="text"
                                  value={editSkillsCategoryName}
                                  onChange={(e) => setEditSkillsCategoryName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const next = [...editorSkills];
                                      next[catIdx] = { ...next[catIdx], category: editSkillsCategoryName.trim() };
                                      updateSkills(next);
                                      setEditingSkillsCategoryIdx(null);
                                    }
                                  }}
                                  className="bg-slate-950 border border-indigo-500 text-xs font-bold text-white px-2 py-0.5 rounded focus:outline-none flex-1"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-xs font-bold text-white leading-none">
                                  {cat.category}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Edit Name toggle */}
                              <button
                                onClick={() => {
                                  if (isEditingName) {
                                    const next = [...editorSkills];
                                    next[catIdx] = { ...next[catIdx], category: editSkillsCategoryName.trim() };
                                    updateSkills(next);
                                    setEditingSkillsCategoryIdx(null);
                                  } else {
                                    setEditingSkillsCategoryIdx(catIdx);
                                    setEditSkillsCategoryName(cat.category);
                                  }
                                }}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Category Name"
                              >
                                {isEditingName ? "✓" : "✏️"}
                              </button>

                              {/* Delete category card */}
                              <button
                                onClick={() => {
                                  const next = [...editorSkills];
                                  next.splice(catIdx, 1);
                                  updateSkills(next);
                                }}
                                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Skill Tags list */}
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {(cat.items || []).map((item: string, itemIdx: number) => (
                              <span
                                key={itemIdx}
                                className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800/80 text-[10px] text-indigo-300 font-semibold px-2 py-0.5 rounded-full"
                              >
                                {item}
                                <button
                                  onClick={() => {
                                    const next = [...editorSkills];
                                    const nextItems = [...next[catIdx].items];
                                    nextItems.splice(itemIdx, 1);
                                    next[catIdx] = { ...next[catIdx], items: nextItems };
                                    updateSkills(next);
                                  }}
                                  className="text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-full w-3.5 h-3.5 flex items-center justify-center cursor-pointer font-bold"
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {(!cat.items || cat.items.length === 0) && (
                              <span className="text-[10px] text-slate-650 italic">No skills added</span>
                            )}
                          </div>

                          {/* Add skill input card footer */}
                          <div className="flex items-center gap-1.5 mt-1 border-t border-slate-800/40 pt-1.5">
                            <input
                              type="text"
                              value={newSkillInputMap[catIdx] || ""}
                              onChange={(e) => {
                                setNewSkillInputMap((prev) => ({ ...prev, [catIdx]: e.target.value }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const skillVal = newSkillInputMap[catIdx] || "";
                                  if (skillVal.trim()) {
                                    const next = [...editorSkills];
                                    next[catIdx] = {
                                      ...next[catIdx],
                                      items: [...(next[catIdx].items || []), skillVal.trim()]
                                    };
                                    updateSkills(next);
                                    setNewSkillInputMap((prev) => ({ ...prev, [catIdx]: "" }));
                                  }
                                }
                              }}
                              placeholder="Add a skill (e.g. Docker)..."
                              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 flex-1"
                            />
                            <button
                              onClick={() => {
                                const skillVal = newSkillInputMap[catIdx] || "";
                                if (skillVal.trim()) {
                                  const next = [...editorSkills];
                                  next[catIdx] = {
                                    ...next[catIdx],
                                    items: [...(next[catIdx].items || []), skillVal.trim()]
                                  };
                                  updateSkills(next);
                                  setNewSkillInputMap((prev) => ({ ...prev, [catIdx]: "" }));
                                }
                              }}
                              className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Category button */}
                  <button
                    onClick={() => {
                      const name = prompt("Enter new category title (e.g., Programming Languages):");
                      if (name && name.trim()) {
                        const next = [...editorSkills];
                        next.push({ category: name.trim(), items: [] });
                        updateSkills(next);
                      }
                    }}
                    className="border border-dashed border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white py-2 rounded-xl text-center bg-slate-900/10 cursor-pointer"
                  >
                    + Add Skills Category
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Education Accordion */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveAccordion(activeAccordion === "education" ? "" : "education")}
                className="flex items-center gap-2 text-left font-bold text-xs uppercase tracking-wider text-slate-350 hover:text-white transition-colors cursor-pointer"
              >
                <span>{activeAccordion === "education" ? "▼" : "▶"}</span>
                <span>Education Profile</span>
              </button>
              <button
                onClick={() => {
                  const visibility = activeResume.formatting.sectionVisibility || {};
                  updateFormatting({
                    sectionVisibility: {
                      ...visibility,
                      education: visibility.education === false ? true : false
                    }
                  });
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {activeResume.formatting.sectionVisibility?.education !== false ? <Eye className="h-4 w-4 text-indigo-400" /> : <EyeOff className="h-4 w-4 text-slate-600" />}
              </button>
            </div>

            {activeAccordion === "education" && (
              <div className="flex flex-col gap-4 mt-3">
                {(activeResume.education || []).map((edu: any, eduIdx: number) => (
                  <div key={eduIdx} className="border border-slate-805 bg-slate-950/40 p-3 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">COLLEGE #{eduIdx + 1}</span>
                      <button 
                        onClick={() => {
                          const updated = [...activeResume.education];
                          updated.splice(eduIdx, 1);
                          setActiveResume({ ...activeResume, education: updated });
                        }}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-semibold">Institution Name</label>
                      <input 
                        type="text" 
                        value={edu.institution || ""} 
                        onChange={(e) => {
                          const updated = [...activeResume.education];
                          updated[eduIdx].institution = e.target.value;
                          setActiveResume({ ...activeResume, education: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-semibold">Degree / Concentration</label>
                      <input 
                        type="text" 
                        value={edu.degree || ""} 
                        onChange={(e) => {
                          const updated = [...activeResume.education];
                          updated[eduIdx].degree = e.target.value;
                          setActiveResume({ ...activeResume, education: updated });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 uppercase font-semibold">Duration</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2020 - 2024"
                          value={edu.duration || ""} 
                          onChange={(e) => {
                            const updated = [...activeResume.education];
                            updated[eduIdx].duration = e.target.value;
                            setActiveResume({ ...activeResume, education: updated });
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-500 uppercase font-semibold">GPA / Grade</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 9.1 CGPA"
                          value={edu.gpa || ""} 
                          onChange={(e) => {
                            const updated = [...activeResume.education];
                            updated[eduIdx].gpa = e.target.value;
                            setActiveResume({ ...activeResume, education: updated });
                          }}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => {
                    const updated = [...(activeResume.education || []), {
                      institution: "University / School",
                      degree: "B.E. Computer Science",
                      duration: "2020 - 2024",
                      gpa: "9.0 CGPA"
                    }];
                    setActiveResume({ ...activeResume, education: updated });
                  }}
                  className="bg-slate-900 border border-slate-800 text-xs font-bold text-white py-2 rounded-xl hover:bg-slate-850 cursor-pointer"
                >
                  + Add Education Record
                </button>
              </div>
            )}
          </div>

          {/* Custom Sections Accordion */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-900/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setActiveAccordion(activeAccordion === "customSections" ? "" : "customSections")}
                className="flex items-center gap-2 text-left font-bold text-xs uppercase tracking-wider text-slate-350 hover:text-white transition-colors cursor-pointer"
              >
                <span>{activeAccordion === "customSections" ? "▼" : "▶"}</span>
                <span>Custom Sections</span>
              </button>
              <button
                onClick={() => {
                  const visibility = activeResume.formatting.sectionVisibility || {};
                  updateFormatting({
                    sectionVisibility: {
                      ...visibility,
                      customSections: visibility.customSections === false ? true : false
                    }
                  });
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                {activeResume.formatting.sectionVisibility?.customSections !== false ? <Eye className="h-4 w-4 text-indigo-400" /> : <EyeOff className="h-4 w-4 text-slate-600" />}
              </button>
            </div>

            {activeAccordion === "customSections" && (
              <div className="flex flex-col gap-4 mt-3">
                {(activeResume.customSections || []).map((sec: any, secIdx: number) => (
                  <div key={secIdx} className="border border-slate-805 bg-slate-950/40 p-3 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <input 
                        type="text"
                        value={sec.heading || ""}
                        onChange={(e) => {
                          const updated = [...activeResume.customSections];
                          updated[secIdx].heading = e.target.value;
                          setActiveResume({ ...activeResume, customSections: updated });
                        }}
                        placeholder="HACKATHON HIGHLIGHTS"
                        className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-bold uppercase w-[80%] focus:outline-none"
                      />
                      <button 
                        onClick={() => {
                          const updated = [...activeResume.customSections];
                          updated.splice(secIdx, 1);
                          setActiveResume({ ...activeResume, customSections: updated });
                        }}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Bullet Items */}
                    <div className="flex flex-col gap-2">
                      {(sec.items || []).map((item: string, itemIdx: number) => (
                        <div key={itemIdx} className="flex gap-1.5 items-center">
                          <input 
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const updated = [...activeResume.customSections];
                              updated[secIdx].items[itemIdx] = e.target.value;
                              setActiveResume({ ...activeResume, customSections: updated });
                            }}
                            placeholder="Vice president - Devs Rec"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-white focus:outline-none"
                          />
                          <button 
                            onClick={() => {
                              const updated = [...activeResume.customSections];
                              updated[secIdx].items.splice(itemIdx, 1);
                              setActiveResume({ ...activeResume, customSections: updated });
                            }}
                            className="text-slate-655 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const updated = [...activeResume.customSections];
                          updated[secIdx].items = [...(updated[secIdx].items || []), ""];
                          setActiveResume({ ...activeResume, customSections: updated });
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold self-start mt-1 cursor-pointer"
                      >
                        + Add Bullet Point
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => {
                    const updated = [...(activeResume.customSections || []), {
                      heading: "HACKATHON HIGHLIGHTS",
                      items: ["Team leader - Smart Hackathon Winner", "Campus Representative - Tech Hackathon"]
                    }];
                    setActiveResume({ ...activeResume, customSections: updated });
                  }}
                  className="bg-slate-900 border border-slate-800 text-xs font-bold text-white py-2 rounded-xl hover:bg-slate-850 cursor-pointer"
                >
                  + Add Custom Section
                </button>
              </div>
            )}
          </div>
          </>}
          </div>
        </div>

        {/* Center Panel: Live Preview Canvas */}
        <div 
          onClick={() => setSelectedSection(null)}
          className="flex-1 bg-slate-950 p-8 overflow-y-auto flex items-start justify-center border-r border-slate-900 scrollbar-thin cursor-default"
        >
          <div className="w-full max-w-[800px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500 px-2">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                <button
                  onClick={() => setWorkMode("edit")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all text-[11px] ${
                    workMode === "edit"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Wand2 className="h-3 w-3" />
                  Editor Mode
                </button>
                <button
                  onClick={() => {
                    setWorkMode("preview");
                    setSelectedSection(null); // Clear selection outline
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all text-[11px] ${
                    workMode === "preview"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Preview Mode
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span>210mm x 297mm Standard A4 Layout</span>
              </div>
            </div>
            
            <ResumeRenderer 
              data={activeResume} 
              onSelectSection={(sec) => setSelectedSection(sec)}
              selectedSection={selectedSection}
              heatmap={showHeatmap}
              workMode={workMode}
              onUpdateResume={(next) => {
                setActiveResume(next);
              }}
              onImproveAiSelection={executeInlineImprove}
            />
          </div>
        </div>

        {/* Right Side Sidebar: Multifunctional AI Panel */}
        <div className="w-[320px] bg-slate-950 flex flex-col border-l border-slate-900 overflow-hidden">
          
          {/* Tab switches */}
          <div className="grid grid-cols-4 border-b border-slate-900 text-xs">
            <button 
              onClick={() => setActiveSidebarTab("copilot")}
              className={`py-3 flex flex-col items-center gap-1 transition-colors ${
                activeSidebarTab === "copilot" ? "border-b-2 border-indigo-500 text-white bg-slate-900/30" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Copilot</span>
            </button>
            <button 
              onClick={() => setActiveSidebarTab("coach")}
              className={`py-3 flex flex-col items-center gap-1 transition-colors ${
                activeSidebarTab === "coach" ? "border-b-2 border-indigo-500 text-white bg-slate-900/30" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>AI Coach</span>
            </button>
            <button 
              onClick={() => setActiveSidebarTab("optimizer")}
              className={`py-3 flex flex-col items-center gap-1 transition-colors ${
                activeSidebarTab === "optimizer" ? "border-b-2 border-indigo-500 text-white bg-slate-900/30" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Optimize</span>
            </button>
            <button 
              onClick={() => setActiveSidebarTab("history")}
              className={`py-3 flex flex-col items-center gap-1 transition-colors ${
                activeSidebarTab === "history" ? "border-b-2 border-indigo-500 text-white bg-slate-900/30" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin flex flex-col gap-6">
            
            {/* TAB 1: COPILOT WRITER */}
            {activeSidebarTab === "copilot" && (
              <div className="flex flex-col gap-4 h-[calc(100vh-180px)]">
                {/* Header */}
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI Copilot</h2>
                  <p className="text-[10px] text-slate-500 mt-1">Chat with full resume context. Select a section to focus on or ask anything.</p>
                </div>

                {/* Section Focus Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Focus Section</label>
                  <select
                    value={copilotSection}
                    onChange={(e) => setCopilotSection(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="entire resume">🗂 Entire Resume</option>
                    <option value="summary">📝 Professional Summary</option>
                    <option value="experience">💼 Work Experience</option>
                    <option value="projects">🚀 Projects</option>
                    <option value="skills">⚡ Skills</option>
                    <option value="education">🎓 Education</option>
                    <option value="achievements">🏆 Achievements / Hackathons</option>
                  </select>
                </div>

                {/* Quick Prompt Shortcuts */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Quick Actions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "✨ Improve", prompt: `Improve my ${copilotSection} section with stronger action verbs and quantified impact.` },
                      { label: "📊 Quantify", prompt: `Add metrics and quantifiable achievements to my ${copilotSection}.` },
                      { label: "🔄 Rewrite", prompt: `Rewrite my ${copilotSection} section to be more concise and ATS-friendly.` },
                      { label: "🎯 ATS Match", prompt: `Optimize my ${copilotSection} for ATS scoring and recruiter readability.` },
                      { label: "🔠 Fix Grammar", prompt: `Fix any grammar, spelling, and tense inconsistencies in my ${copilotSection}.` },
                      { label: "💡 Suggestions", prompt: `What are the top 3 improvements I can make to my ${copilotSection}?` },
                      { label: "📋 Bullet Points", prompt: `Rewrite my experience bullets using strong action verbs for ${copilotSection}.` },
                      { label: "🌟 Highlight", prompt: `What are the strongest selling points in my resume that I should emphasize for ${copilotSection}?` },
                    ].map(({ label, prompt }) => (
                      <button
                        key={label}
                        onClick={() => sendCopilotMessage(prompt)}
                        disabled={sendingCopilot}
                        className="text-[10px] bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 px-2.5 py-1.5 rounded-lg transition-all font-medium disabled:opacity-40"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* If section is also clicked on canvas, show inline edit too */}
                {selectedSection && (
                  <div className="bg-slate-900/60 border border-indigo-500/20 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">{selectedSection.type} selected from canvas</span>
                      <button onClick={() => { setSelectedSection(null); setAiSuggestions([]); }} className="text-[10px] text-slate-500 hover:text-white">✕</button>
                    </div>
                    <TipTapEditor
                      key={`${selectedSection.type}-${selectedSection.index}-${selectedSection.highlightIndex || 0}`}
                      content={getSelectedContent()}
                      onChange={(text) => {
                        if (selectedSection.type === "summary") updatePersonalInfo({ summary: text });
                        else if (selectedSection.type === "experience") updateExperienceHighlight(selectedSection.index, selectedSection.highlightIndex!, text);
                        else if (selectedSection.type === "project") updateProjectHighlight(selectedSection.index, selectedSection.highlightIndex!, text);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] mt-1">
                      {["star", "metrics", "professional", "shorten"].map((action) => (
                        <button key={action} onClick={() => triggerAiAction(action)} disabled={loadingAi}
                          className="bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white py-1.5 rounded-lg transition-smooth flex items-center justify-center gap-1 font-medium capitalize disabled:opacity-40">
                          <Wand2 className="h-3 w-3" />{action === "star" ? "STAR" : action}
                        </button>
                      ))}
                    </div>
                    {loadingAi && <div className="flex items-center gap-2 text-slate-400 text-[10px]"><Loader2 className="h-3 w-3 animate-spin text-indigo-500" />Generating...</div>}
                    {aiSuggestions.length > 0 && (
                      <div className="flex flex-col gap-1.5 border-t border-slate-800 pt-2">
                        {aiSuggestions.map((sug, idx) => (
                          <div key={idx} onClick={() => applySuggestion(sug)} className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg p-2 cursor-pointer text-[10px] text-slate-300 hover:text-white transition-smooth">{sug}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Chat area */}
                <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3 overflow-y-auto space-y-3 scrollbar-none text-xs min-h-0">
                  {copilotHistory.length === 0 && (
                    <div className="text-center text-slate-600 text-[10px] py-6">
                      <Sparkles className="h-6 w-6 mx-auto mb-2 text-indigo-800" />
                      <p>Ask anything about your resume or click a quick action above.</p>
                      <p className="mt-1 opacity-60">I have full context of your resume.</p>
                    </div>
                  )}
                  {copilotHistory.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <span className="text-[9px] text-slate-600 font-semibold uppercase mb-0.5">{msg.role === "user" ? "You" : "Copilot"}</span>
                      <div className={`p-2.5 rounded-2xl max-w-[95%] leading-relaxed text-[11px] ${
                        msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-900 text-slate-300 rounded-tl-none border border-slate-800"
                      }`}>{msg.content}</div>
                    </div>
                  ))}
                  {sendingCopilot && (
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] italic">
                      <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                      <span>Copilot is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={(e) => { e.preventDefault(); sendCopilotMessage(); }} className="flex gap-2">
                  <input
                    type="text"
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    placeholder={`Ask about ${copilotSection}...`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" disabled={sendingCopilot || !copilotInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-3.5 rounded-xl text-xs font-semibold transition-colors">
                    ↑
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: AI RESUME COACH CHAT */}
            {activeSidebarTab === "coach" && (
              <div className="flex flex-col h-[calc(100vh-180px)] justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI Career Coach</h2>
                  <p className="text-[10px] text-slate-500">Ask questions regarding low scores, CGPA inclusions, or general layout queries.</p>
                </div>

                {/* Message display area */}
                <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3 overflow-y-auto space-y-3 scrollbar-none text-xs">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <span className="text-[9px] text-slate-600 font-semibold uppercase mb-0.5">{msg.role === "user" ? "You" : "Coach"}</span>
                      <div className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                        msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-900 text-slate-300 rounded-tl-none border border-slate-800"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {sendingChat && (
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] italic">
                      <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                      <span>Coach is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Message input form */}
                <form onSubmit={sendChatMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask standard advice..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    type="submit" 
                    disabled={sendingChat || !chatMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-3.5 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: RESUME OPTIMIZER SCORE + ISSUE FIXES */}
            {activeSidebarTab === "optimizer" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Resume Optimizer</h2>
                  <p className="text-[10px] text-slate-500 mt-1">Scan your resume for issues and auto-fix them with AI.</p>
                </div>

                {/* Scan Button */}
                {!optimizeReport && (
                  <button
                    onClick={runOptimize}
                    disabled={loadingOptimize}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {loadingOptimize ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing Resume...</> : <><Sparkles className="h-4 w-4" />Run Full Analysis</>}
                  </button>
                )}

                {loadingOptimize && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#1e293b" strokeWidth="8" />
                        <circle cx="40" cy="40" r="34" fill="none" stroke="#6366f1" strokeWidth="8" strokeDasharray="213" strokeDashoffset="60" strokeLinecap="round" className="animate-pulse" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-indigo-400" /></div>
                    </div>
                    <span className="text-xs">Scanning all sections...</span>
                  </div>
                )}

                {optimizeReport && (
                  <div className="flex flex-col gap-4">
                    {/* Score Gauge */}
                    <div className="flex flex-col items-center bg-slate-900/60 border border-slate-800 rounded-2xl p-5 gap-3">
                      <div className="relative w-28 h-28">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                          <circle cx="56" cy="56" r="48" fill="none" stroke="#1e293b" strokeWidth="10" />
                          <circle
                            cx="56" cy="56" r="48" fill="none"
                            stroke={optimizeReport.score >= 80 ? "#22c55e" : optimizeReport.score >= 60 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 48}`}
                            strokeDashoffset={`${2 * Math.PI * 48 * (1 - optimizeReport.score / 100)}`}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-white">{optimizeReport.score}</span>
                          <span className="text-[9px] text-slate-400 font-bold">/ 100</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-white">Your Score</p>
                        <p className="text-[10px] text-slate-500">{optimizeReport.totalIssues} issues found across all sections</p>
                      </div>
                      <button onClick={runOptimize} disabled={loadingOptimize} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Re-scan
                      </button>
                    </div>

                    {/* Category Bars */}
                    <div className="flex flex-col gap-2">
                      {(optimizeReport.categories || []).map((cat: any) => (
                        <div key={cat.name} className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-400 w-20 truncate">{cat.name}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all duration-500" style={{
                              width: `${cat.score}%`,
                              backgroundColor: cat.score >= 80 ? "#22c55e" : cat.score >= 60 ? "#f59e0b" : "#ef4444"
                            }} />
                          </div>
                          <span className={`w-8 text-right font-bold ${
                            cat.score >= 80 ? "text-emerald-400" : cat.score >= 60 ? "text-amber-400" : "text-red-400"
                          }`}>{cat.score}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Issues List with Fix Buttons */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{optimizeReport.totalIssues} Issues Found</span>
                      {(optimizeReport.issues || []).map((issue: any) => (
                        <div key={issue.key} className={`border rounded-xl p-3 flex flex-col gap-2 ${
                          issue.status === "pass" ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] ${ issue.status === "pass" ? "text-emerald-400" : "text-red-400"}`}>
                                {issue.status === "pass" ? "✓" : "✗"}
                              </span>
                              <span className="text-[10px] font-bold text-white">{issue.label}</span>
                            </div>
                            {issue.status !== "pass" && (
                              <button
                                onClick={() => fixIssue(issue.key, issue)}
                                disabled={fixingIssue === issue.key}
                                className="text-[9px] bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                {fixingIssue === issue.key ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
                                Fix
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{issue.description}</p>
                          {issue.sample && issue.status !== "pass" && (
                            <div className="bg-slate-900 rounded-lg px-2 py-1.5 text-[9px] text-slate-500 italic border-l-2 border-amber-500/50">
                              "{issue.sample.substring(0, 80)}{issue.sample.length > 80 ? "..." : ""}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: VERSION HISTORY RESTORE & DIFF */}
            {activeSidebarTab === "history" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Version Snapshots</h2>
                  <p className="text-[10px] text-slate-500 mt-1">Roll back to any database snapshot. Storing saves automated upon draft updates.</p>
                </div>

                {/* Compare Versions panel */}
                {versionsList && versionsList.length >= 2 && (
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3 text-xs">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Compare Draft Changes</span>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={diffVerA} 
                        onChange={(e) => setDiffVerA(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 focus:outline-none"
                      >
                        <option value="">Version A</option>
                        {versionsList.map((v: any) => (
                          <option key={v.versionNumber} value={v.versionNumber}>V{v.versionNumber}</option>
                        ))}
                      </select>
                      <select 
                        value={diffVerB} 
                        onChange={(e) => setDiffVerB(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 focus:outline-none"
                      >
                        <option value="">Version B</option>
                        {versionsList.map((v: any) => (
                          <option key={v.versionNumber} value={v.versionNumber}>V{v.versionNumber}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleCompareDiff}
                      disabled={loadingDiff || !diffVerA || !diffVerB}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {loadingDiff ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Comparing...
                        </>
                      ) : (
                        "Compare Drafts"
                      )}
                    </button>
                  </div>
                )}

                {/* Diff Comparison Report Display */}
                {diffResult && (
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase">Score Delta: {diffResult.scoreDelta}</span>
                      <button onClick={() => setDiffResult(null)} className="text-[9px] text-slate-500 hover:text-white">Clear</button>
                    </div>
                    
                    {diffResult.additions?.length > 0 && (
                      <div>
                        <span className="text-[9px] text-emerald-400 uppercase font-bold">Additions:</span>
                        <ul className="list-disc pl-4 text-[10px] space-y-1 text-slate-300 mt-1">
                          {diffResult.additions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    {diffResult.deletions?.length > 0 && (
                      <div>
                        <span className="text-[9px] text-red-400 uppercase font-bold">Deletions:</span>
                        <ul className="list-disc pl-4 text-[10px] space-y-1 text-slate-350 mt-1">
                          {diffResult.deletions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    {diffResult.modifications?.length > 0 && (
                      <div>
                        <span className="text-[9px] text-amber-400 uppercase font-bold">Modifications:</span>
                        <ul className="list-disc pl-4 text-[10px] space-y-1 text-slate-350 mt-1">
                          {diffResult.modifications.map((item: string, i: number) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Draft snap version list */}
                <div className="flex flex-col gap-2.5">
                  {versionsList && versionsList.length > 0 ? (
                    versionsList.map((ver: any) => (
                      <div key={ver._id} className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span>Version {ver.versionNumber}</span>
                          <span className="text-[10px] text-slate-500">{new Date(ver.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-400 text-[10px] italic leading-tight">"{ver.changesSummary}"</p>
                        <button 
                          onClick={() => restoreMutation.mutate(ver.versionNumber)}
                          disabled={restoreMutation.isPending}
                          className="bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white py-1 rounded-lg text-[10px] font-semibold transition-colors mt-1"
                        >
                          Restore Snapshot
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs italic">
                      No previous draft versions saved yet. Click Save Draft to log version history.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* SHARE MODAL WITH PORTFOLIO LINK */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full flex flex-col gap-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Share Resume & Portfolio</h3>
              <p className="text-xs text-slate-400">Generate public links and QR access codes for hiring managers.</p>
            </div>

            {/* QR Code Container */}
            <div className="flex justify-center bg-white p-4 rounded-2xl w-fit mx-auto shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(getShareUrl())}`}
                alt="QR Code Link"
                className="w-40 h-40"
              />
            </div>

            {/* Copy URL */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Public Share URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={getShareUrl()}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono select-all focus:outline-none"
                />
                <button 
                  onClick={handleCopyLink}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </button>
              </div>
            </div>

            {/* Portfolio Link Exporter */}
            <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase">One-Click Portfolio Page</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={getPortfolioUrl()}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono select-all focus:outline-none"
                />
                <a 
                  href={`/portfolio/${id}`}
                  target="_blank"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  View Site
                </a>
              </div>
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-colors"
            >
              Close Dialog
            </button>
          </div>
        </div>
      )}
      {/* AI INTERACTIVE SMART FIX WIZARD MODAL */}
      {fixModalOpen && fixModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full flex flex-col gap-5 shadow-2xl">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Fix Wizard</span>
              <h3 className="text-lg font-bold text-white mb-1">Enhance Fix: {fixModalData.label}</h3>
              <p className="text-xs text-slate-400">Review the target text and supply extra details to generate a highly tailored, metrics-driven fix.</p>
            </div>

            {/* Target Text Review */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Target Text to Fix</label>
              <textarea
                value={fixModalOriginalText}
                onChange={(e) => setFixModalOriginalText(e.target.value)}
                placeholder="No text selected"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white min-h-[75px] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Additional Context/Details */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Extra Details / Spacing Context</label>
                <span className="text-[9px] text-indigo-400 italic">Optional but recommended</span>
              </div>
              <textarea
                value={fixModalExtraContext}
                onChange={(e) => setFixModalExtraContext(e.target.value)}
                placeholder={
                  fixModalKey === "quantify"
                    ? "Add details like: Saved 40% loading time, managed team of 5, reduced budget by $10k..."
                    : fixModalKey === "repetition"
                    ? "Add details like: Replace repeated verbs with 'spearheaded' or 'architected'..."
                    : fixModalKey === "grammar"
                    ? "Add details like: Keep past tense, correct spelling of custom words..."
                    : "Add any extra details (dates, numbers, impact, members, tech stacks used) to include..."
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white min-h-[75px] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setFixModalOpen(false)}
                className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold py-2.5 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeFixIssue(fixModalKey!, fixModalData, fixModalOriginalText, fixModalExtraContext)}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Wand2 className="h-4 w-4" />
                Generate Smart Fix
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default function ResumeBuilderWorkspaceWrapper() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <span>Initializing Workspace canvas...</span>
      </div>
    }>
      <ResumeBuilderWorkspace />
    </Suspense>
  );
}
