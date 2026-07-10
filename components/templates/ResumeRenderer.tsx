"use client";

import React from "react";
import { Mail, Phone, Globe, Link, Link2, ExternalLink, ArrowUp, ArrowDown, Trash2, Sparkles } from "lucide-react";
import InlineTipTapEditor from "@/components/editor/InlineTipTapEditor";

interface ResumeRendererProps {
  data: any;
  onSelectSection?: (section: { type: string; index: number; highlightIndex?: number; field?: string }) => void;
  selectedSection?: { type: string; index: number; highlightIndex?: number; field?: string } | null;
  heatmap?: boolean;
  workMode?: "edit" | "preview";
  onUpdateResume?: (updatedData: any) => void;
  onImproveAiSelection?: (selectedText: string, replaceText: (newText: string) => void) => void;
}

interface BlockWrapperProps {
  type: "experience" | "project" | "education";
  index: number;
  workMode: "edit" | "preview";
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onImprove: () => void;
  children: React.ReactNode;
}

function BlockWrapper({
  type,
  index,
  workMode,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onImprove,
  children
}: BlockWrapperProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  if (workMode !== "edit") {
    return <>{children}</>;
  }

  const showAiButton = type !== "education";

  const getLabel = () => {
    switch (type) {
      case "experience": return "Experience Block";
      case "project": return "Project Block";
      case "education": return "Education Block";
      default: return "Block";
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsFocused(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setIsFocused(true);
      }}
      className={`relative rounded-xl transition-all duration-200 p-2.5 -m-2.5 border ${
        isFocused 
          ? "border-2 border-dashed border-indigo-500/80 bg-indigo-50/50 dark:bg-indigo-950/10 shadow-[0_4px_12px_rgba(99,102,241,0.08)] z-10"
          : isHovered
            ? "border-dashed border-indigo-500/30 bg-indigo-50/[0.02] dark:bg-indigo-950/[0.005] z-10"
            : "border-transparent"
      }`}
    >
      {children}

      {/* Floating Toolbar when Hovered or Focused */}
      {(isHovered || isFocused) && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-10 flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-white rounded-xl p-1.5 shadow-2xl z-50 pointer-events-auto select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {showAiButton && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onImprove();
                }}
                title={`Improve all bullets in this ${getLabel()} with AI`}
                className="flex items-center gap-1 text-[10px] bg-violet-600 hover:bg-violet-500 text-white font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span>Improve with AI</span>
              </button>
              <div className="h-4 w-px bg-slate-800 mx-0.5" />
            </>
          )}
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            title="Move Up"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            title="Move Down"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            title={`Delete this ${getLabel()}`}
            className="p-1 rounded-lg hover:bg-red-950/80 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function textToHtml(text: string): string {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  let html = "";
  let inList = false;

  for (const line of lines) {
    const isBullet = /^[\s•\-\*\d\.\)]+/g.test(line);
    if (isBullet) {
      if (!inList) {
        html += `<ul style="list-style-type: disc; padding-left: 20px; margin-top: 4px;">`;
        inList = true;
      }
      const cleanLine = line.replace(/^[\s•\-\*\d\.\)]+/g, "").trim();
      html += `<li>${cleanLine}</li>`;
    } else {
      if (inList) {
        html += `</ul>`;
        inList = false;
      }
      html += `<div>${line}</div>`;
    }
  }
  if (inList) {
    html += `</ul>`;
  }
  return `<div>${html}</div>`;
}


function getInitialContentHtml(item: any, type: "experience" | "education" | "project", templateId: string): string {
  if (type === "experience") {
    const position = item.position || "Position";
    const company = item.company || "Company";
    const duration = item.duration || "Duration";
    const location = item.location || "Location";
    const highlights = item.highlights || [];

    let headerStr = "";
    if (templateId === "ats") {
      headerStr = `<div><strong>${position}</strong><span style="float: right; font-weight: bold;">${duration}</span></div>` +
                  `<div style="font-style: italic; margin-bottom: 4px;">${company} - ${location}</div>`;
    } else if (templateId === "minimal") {
      headerStr = `<div style="display: flex; justify-content: space-between; font-weight: bold;"><span>${position} <span style="font-weight: normal; color: #94a3b8; font-size: 11px;">at</span> ${company}</span><span style="font-weight: 500; font-size: 12px; color: #64748b;">${duration}</span></div>` +
                  `<div style="font-style: italic; font-size: 11px; color: #4b5563; margin-bottom: 4px;">${location}</div>`;
    } else if (templateId === "executive") {
      headerStr = `<div style="display: flex; justify-content: space-between; font-weight: bold;"><span>${position}</span><span>${duration}</span></div>` +
                  `<div style="color: #4338ca; font-weight: 500;">${company} — ${location}</div>`;
    } else if (templateId === "harvard") {
      headerStr = `<div style="display: flex; justify-content: space-between; font-weight: bold;"><span>${company}</span><span>${duration}</span></div>` +
                  `<div style="display: flex; justify-content: space-between; font-style: italic;"><span>${position}</span><span>${location}</span></div>`;
    } else if (templateId === "tech") {
      headerStr = `<div style="display: flex; justify-content: space-between; font-weight: bold;"><span>${position}</span><span style="color: #64748b;">${duration}</span></div>` +
                  `<div style="color: #6366f1; font-weight: 500; margin-bottom: 4px;">${company} — ${location}</div>`;
    } else if (templateId === "latex") {
      headerStr = `<div style="display: flex; justify-content: space-between; font-weight: bold; font-family: Georgia, serif; color: #000; font-size: 12px;"><span>${company}</span><span>${location}</span></div>` +
                  `<div style="display: flex; justify-content: space-between; font-style: italic; font-family: Georgia, serif; color: #000; font-size: 11px;"><span>${position}</span><span>${duration}</span></div>`;
    } else {
      // Modern fallback (LaTeX inspired)
      headerStr = `<div style="display: flex; justify-content: space-between; font-weight: bold; font-family: Georgia, serif;"><span style="color: #0000FF; font-size: 12px;">${company}</span><span style="font-size: 12px;">${location}</span></div>` +
                  `<div style="display: flex; justify-content: space-between; font-style: italic; font-family: Georgia, serif;"><span style="font-size: 11px;">${position}</span><span style="font-size: 11px;">${duration}</span></div>`;
    }

    let bulletList = "";
    if (highlights && highlights.length > 0) {
      bulletList = `<ul style="list-style-type: disc; padding-left: 20px; margin-top: 4px;">` +
                   highlights.map((hl: string) => `<li>${hl}</li>`).join("") +
                   `</ul>`;
    } else {
      bulletList = `<ul style="list-style-type: disc; padding-left: 20px; margin-top: 4px;"><li>Key achievement or responsibility</li></ul>`;
    }
    return `<div>${headerStr}${bulletList}</div>`;
  }

  if (type === "education") {
    const institution = item.institution || "School/Institution";
    const degree = item.degree || "Degree";
    const duration = item.duration || "Duration";
    const gpa = item.gpa || "";

    if (templateId === "ats") {
      const gpaStr = gpa ? ` - GPA: ${gpa}` : "";
      return `<div><div style="display: flex; justify-content: space-between; font-weight: bold;"><span>${institution}</span><span>${duration}</span></div>` +
             `<div style="font-style: italic;">${degree}${gpaStr}</div></div>`;
    } else if (templateId === "minimal") {
      const gpaStr = gpa ? `<span style="font-size: 10px; font-weight: 600; color: #94a3b8; display: block;">GPA: ${gpa}</span>` : "";
      return `<div style="display: flex; justify-content: space-between; gap: 16px;">` +
             `<div><span style="font-weight: bold;">${institution}</span><span style="color: #4b5563;"> — ${degree}</span></div>` +
             `<div style="text-align: right;"><span style="color: #64748b; font-weight: 500; display: block;">${duration}</span>${gpaStr}</div></div>`;
    } else if (templateId === "executive") {
      const gpaStr = gpa ? ` | GPA: ${gpa}` : "";
      return `<div><div style="display: flex; justify-content: space-between; font-weight: bold;"><span>${institution}</span><span>${duration}</span></div>` +
             `<div style="color: #4338ca; font-style: italic;">${degree}${gpaStr}</div></div>`;
    } else if (templateId === "harvard") {
      const gpaStr = gpa ? ` (GPA: ${gpa})` : "";
      return `<div><div style="display: flex; justify-content: space-between; font-weight: bold;"><span>${institution}</span><span>${duration}</span></div>` +
             `<div style="font-style: italic;">${degree}${gpaStr}</div></div>`;
    } else if (templateId === "tech") {
      const gpaStr = gpa ? ` (GPA: ${gpa})` : "";
      return `<div><div style="display: flex; justify-content: space-between; font-weight: bold;"><span>${institution}</span><span style="color: #64748b;">${duration}</span></div>` +
             `<div style="font-style: italic; color: #6366f1;">${degree}${gpaStr}</div></div>`;
    } else if (templateId === "latex") {
      const gpaStr = gpa ? `; GPA: ${gpa}` : "";
      return `<div style="font-family: Georgia, serif; color: #000;"><div style="display: flex; justify-content: space-between; font-weight: bold;"><span style="font-size: 12px;">${institution}</span><span style="font-size: 12px;">${item.location || ""}</span></div>` +
             `<div style="display: flex; justify-content: space-between; font-style: italic;"><span style="font-size: 11px;">${degree}${gpaStr}</span><span style="font-size: 11px;">${duration}</span></div></div>`;
    } else {
      // Modern fallback (LaTeX inspired)
      const gpaStr = gpa ? `; CGPA: ${gpa}` : "";
      return `<div style="font-family: Georgia, serif;"><div style="display: flex; justify-content: space-between; font-weight: bold;"><span style="color: #0000FF; font-size: 12px;">${institution}</span><span style="font-size: 12px;">${item.location || "India"}</span></div>` +
             `<div style="display: flex; justify-content: space-between; font-style: italic;"><span style="font-size: 11px;">${degree}${gpaStr}</span><span style="font-size: 11px;">${duration}</span></div></div>`;
    }
  }

  if (type === "project") {
    const title = item.title || "Project Title";
    const description = item.description || "";
    const technologies = item.technologies || [];
    const highlights = item.highlights || [];

    const techBadgeStr = technologies.length > 0
      ? " " + technologies.map((t: string) => `<span style="background-color: #f1f5f9; color: #475569; font-family: monospace; font-size: 10px; padding: 2px 6px; margin-left: 4px; border-radius: 4px;">${t}</span>`).join("")
      : "";

    let headerStr = "";
    if (templateId === "ats") {
      const techStr = technologies.length > 0 ? ` (${technologies.join(", ")})` : "";
      headerStr = `<div style="font-weight: bold;">${title}${techStr}</div>`;
    } else if (templateId === "minimal") {
      headerStr = `<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">` +
                  `<span style="font-weight: bold;">${title}</span>` +
                  `<div>${techBadgeStr}</div></div>`;
    } else if (templateId === "latex") {
      const techStr = technologies.length > 0 ? ` (${technologies.join(", ")})` : "";
      headerStr = `<div style="font-family: Georgia, serif; color: #000; font-weight: bold; font-size: 12px;"><span>${title}</span>` +
                  `<span style="font-style: italic; font-size: 11px; font-weight: normal; margin-left: 6px;">${techStr}</span></div>`;
    } else {
      // Standard/fallback (LaTeX inspired)
      const techStr = technologies.length > 0 ? ` - Tech: ${technologies.join(", ")}` : "";
      headerStr = `<div style="font-family: Georgia, serif;"><span style="color: #0000FF; font-weight: bold; font-size: 12px;">${title}</span>` +
                  `<span style="font-style: italic; font-size: 11px; color: #475569; margin-left: 8px;">${techStr}</span></div>`;
    }

    const descStr = description ? `<p style="font-style: italic; color: #475569; font-size: 11px; margin-top: 2px; margin-bottom: 4px;">${description}</p>` : "";

    let bulletList = "";
    if (highlights && highlights.length > 0) {
      bulletList = `<ul style="list-style-type: disc; padding-left: 20px; margin-top: 4px;">` +
                   highlights.map((hl: string) => `<li>${hl}</li>`).join("") +
                   `</ul>`;
    } else {
      bulletList = `<ul style="list-style-type: disc; padding-left: 20px; margin-top: 4px;"><li>Key feature or implementation detail</li></ul>`;
    }

    return `<div>${headerStr}${descStr}${bulletList}</div>`;
  }

  return "";
}

export default function ResumeRenderer({
  data,
  onSelectSection,
  selectedSection,
  heatmap = false,
  workMode = "edit",
  onUpdateResume,
  onImproveAiSelection,
}: ResumeRendererProps) {
  if (!data) return <div className="text-slate-500 text-sm text-center py-20">No resume data loaded.</div>;

  const { 
    personalInfo = {}, 
    skills = [], 
    experience = [], 
    projects = [], 
    education = [], 
    formatting = {}, 
    templateId = "minimal" 
  } = data;

  const fontFamily = formatting.fontFamily || "Inter";
  const fontSize = `${formatting.fontSize || 11}px`;
  const lineHeight = formatting.lineHeight || 1.3;
  const margins = `${(formatting.margins || 0.75) * 96}px`;

  const colorScheme = formatting.colorScheme || "classic";
  
  const colors: Record<string, { primary: string; text: string; bg: string }> = {
    classic: { primary: "#000000", text: "#1e293b", bg: "#ffffff" },
    indigo: { primary: "#4f46e5", text: "#334155", bg: "#f8fafc" },
    emerald: { primary: "#059669", text: "#334155", bg: "#f0fdf4" },
    navy: { primary: "#1e3a8a", text: "#334155", bg: "#f0f4f8" }
  };

  const currentColors = colors[colorScheme] || colors.classic;

  const inlineStyles: React.CSSProperties = {
    fontFamily,
    fontSize,
    lineHeight,
    padding: margins,
    color: currentColors.text
  };

  const getArrayName = (type: string) => {
    if (type === "project") return "projects";
    return type as "experience" | "education";
  };

  const moveItem = (type: string, index: number, direction: number) => {
    if (!onUpdateResume) return;
    const arrayName = getArrayName(type);
    const array = [...(data[arrayName] || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= array.length) return;
    
    const temp = array[index];
    array[index] = array[targetIdx];
    array[targetIdx] = temp;
    
    onUpdateResume({
      ...data,
      [arrayName]: array
    });
  };

  const deleteItem = (type: string, index: number) => {
    if (!onUpdateResume) return;
    const arrayName = getArrayName(type);
    const array = [...(data[arrayName] || [])];
    array.splice(index, 1);
    
    onUpdateResume({
      ...data,
      [arrayName]: array
    });
  };

  const improveBlock = (type: "experience" | "project" | "education", index: number) => {
    if (!onImproveAiSelection || !onUpdateResume) return;
    const arrayName = getArrayName(type);
    const item = data[arrayName]?.[index];
    if (!item) return;

    const currentHtml = item.contentHtml || getInitialContentHtml(item, type, templateId);
    const rawText = currentHtml
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n\s*\n+/g, "\n")
      .trim();

    onImproveAiSelection(rawText, (newText) => {
      const newHtml = textToHtml(newText);
      const next = { ...data };
      next[arrayName][index].contentHtml = newHtml;
      onUpdateResume(next);
    });
  };

  const isFieldHighlighted = (type: string, index: number, hlIdx?: number, field?: string) => {
    if (workMode === "preview") return false;
    if (!selectedSection) return false;
    if (selectedSection.type !== type || selectedSection.index !== index) return false;
    if (hlIdx !== undefined && selectedSection.highlightIndex !== hlIdx) return false;
    if (field !== undefined && (selectedSection as any).field !== field) return false;
    return true;
  };

  const fieldHighlightClass = (type: string, index: number, hlIdx?: number, field?: string) => {
    if (workMode === "preview") return "";
    const isSel = isFieldHighlighted(type, index, hlIdx, field);
    const displayStyle = (field === "contentHtml" || type === "summary") ? "block w-full" : "inline-block";
    return isSel
      ? `ring-2 ring-indigo-500 bg-indigo-500/10 rounded px-1 transition-all cursor-pointer ${displayStyle}`
      : `hover:bg-slate-100 dark:hover:bg-slate-900/30 rounded px-1 transition-all cursor-pointer ${displayStyle}`;
  };

  const highlightClass = (type: string, index: number, hlIdx?: number) => {
    return fieldHighlightClass(type, index, hlIdx);
  };

  const renderEditableText = (
    text: string,
    type: string,
    index: number,
    hlIdx?: number,
    field?: string
  ) => {
    const isEditing = workMode === "edit" && isFieldHighlighted(type, index, hlIdx, field);
    if (isEditing && onUpdateResume) {
      return (
        <InlineTipTapEditor
          content={text}
          onChange={(newText) => {
            const next = { ...data };
            
            const clean = (val: string) => {
              if (!val) return "";
              const cleaned = val.replace(/<[^>]*>/g, "").trim();
              return cleaned
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
            };

            if (type === "summary") {
              next.personalInfo.summary = newText;
            } else if (type === "personalInfo" && field) {
              next.personalInfo[field] = clean(newText);
            } else if (type === "experience") {
              if (hlIdx !== undefined) {
                next.experience[index].highlights[hlIdx] = newText;
              } else if (field) {
                next.experience[index][field] = field === "contentHtml" ? newText : clean(newText);
              }
            } else if (type === "project") {
              if (hlIdx !== undefined) {
                next.projects[index].highlights[hlIdx] = newText;
              } else if (field) {
                next.projects[index][field] = field === "contentHtml" ? newText : clean(newText);
              }
            } else if (type === "education") {
              if (field) {
                next.education[index][field] = field === "contentHtml" ? newText : clean(newText);
              }
            }
            onUpdateResume(next);
          }}
          onImproveAi={onImproveAiSelection}
          displayMode={field === "contentHtml" ? "block" : "inline"}
        />
      );
    }

    const Component = (field === "contentHtml" || type === "summary") ? "div" : "span";

    if (workMode === "edit") {
      return (
        <Component
          className={fieldHighlightClass(type, index, hlIdx, field)}
          onClick={(e) => {
            e.stopPropagation();
            onSelectSection?.({ type, index, highlightIndex: hlIdx, field } as any);
          }}
          dangerouslySetInnerHTML={{ __html: text || "✏️ Edit" }}
        />
      );
    }

    return <Component dangerouslySetInnerHTML={{ __html: text || "" }} />;
  };

  // Helper for heatmap scoring & color borders
  const getHeatmapBorder = (section: string) => {
    if (!heatmap) return "";
    
    switch (section) {
      case "summary":
        const summaryText = personalInfo.summary || "";
        if (!summaryText) return "border-2 border-dashed border-red-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(239,68,68,0.4)]";
        if (summaryText.length < 100) return "border-2 border-dashed border-yellow-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(234,179,8,0.4)]";
        return "border-2 border-dashed border-emerald-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.4)]";
      
      case "experience":
        if (experience.length === 0) return "border-2 border-dashed border-red-500 p-2 m-1 rounded";
        // Check if bullets have metrics (digits, %, $)
        let hasMetrics = false;
        experience.forEach((exp: any) => {
          (exp.highlights || []).forEach((hl: string) => {
            if (/\d+/.test(hl) || hl.includes("%") || hl.includes("$")) hasMetrics = true;
          });
        });
        return hasMetrics 
          ? "border-2 border-dashed border-emerald-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          : "border-2 border-dashed border-yellow-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(234,179,8,0.4)]";
      
      case "skills":
        return skills.length > 5 
          ? "border-2 border-dashed border-emerald-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          : skills.length > 0 
            ? "border-2 border-dashed border-yellow-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(234,179,8,0.4)]"
            : "border-2 border-dashed border-red-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(239,68,68,0.4)]";
      
      case "projects":
        return projects.length >= 2 
          ? "border-2 border-dashed border-emerald-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          : projects.length > 0 
            ? "border-2 border-dashed border-yellow-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(234,179,8,0.4)]"
            : "border-2 border-dashed border-red-500 p-2 m-1 rounded shadow-[0_0_8px_rgba(239,68,68,0.4)]";
      
      default:
        return "";
    }
  };

  // Render Template A: Minimal (Classic Black and White)
  if (templateId === "minimal") {
    return (
      <div 
        style={inlineStyles}
        className="w-full min-h-[1050px] bg-white text-slate-800 border border-slate-200 shadow-lg mx-auto print:border-0 print:shadow-none"
      >
        {/* Personal Details Header */}
        <div className="text-center flex flex-col gap-2 mb-6 border-b border-slate-300 pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{personalInfo.fullName || "Your Full Name"}</h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            {personalInfo.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{personalInfo.email}</span>}
            {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{personalInfo.phone}</span>}
            {personalInfo.location && <span>{personalInfo.location}</span>}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-indigo-600 font-medium">
            {personalInfo.linkedin && <a href={personalInfo.linkedin} target="_blank" className="flex items-center gap-0.5 hover:underline"><Link className="h-3 w-3" />LinkedIn</a>}
            {personalInfo.github && <a href={personalInfo.github} target="_blank" className="flex items-center gap-0.5 hover:underline"><Link2 className="h-3 w-3" />GitHub</a>}
            {personalInfo.website && <a href={personalInfo.website} target="_blank" className="flex items-center gap-0.5 hover:underline"><Globe className="h-3 w-3" />Website</a>}
          </div>
        </div>

        {/* Summary */}
        <div className={getHeatmapBorder("summary")}>
          {personalInfo.summary && (
            <div className="mb-6 text-xs italic leading-relaxed text-slate-600">
              {renderEditableText(personalInfo.summary, "summary", 0)}
            </div>
          )}
        </div>

        {/* Work Experience */}
        <div className={getHeatmapBorder("experience")}>
          {experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">Work Experience</h2>
              <div className="flex flex-col gap-4">
                {experience.map((exp: any, expIdx: number) => (
                  <BlockWrapper
                    key={expIdx}
                    type="experience"
                    index={expIdx}
                    workMode={workMode}
                    isFirst={expIdx === 0}
                    isLast={expIdx === experience.length - 1}
                    onMoveUp={() => moveItem("experience", expIdx, -1)}
                    onMoveDown={() => moveItem("experience", expIdx, 1)}
                    onDelete={() => deleteItem("experience", expIdx)}
                    onImprove={() => improveBlock("experience", expIdx)}
                  >
                    <div className="animate-fade-in text-xs w-full">
                      {renderEditableText(
                        exp.contentHtml || getInitialContentHtml(exp, "experience", templateId),
                        "experience",
                        expIdx,
                        undefined,
                        "contentHtml"
                      )}
                    </div>
                  </BlockWrapper>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Projects */}
        <div className={getHeatmapBorder("projects")}>
          {projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">Projects</h2>
              <div className="flex flex-col gap-4">
                {projects.map((proj: any, projIdx: number) => (
                  <BlockWrapper
                    key={projIdx}
                    type="project"
                    index={projIdx}
                    workMode={workMode}
                    isFirst={projIdx === 0}
                    isLast={projIdx === projects.length - 1}
                    onMoveUp={() => moveItem("project", projIdx, -1)}
                    onMoveDown={() => moveItem("project", projIdx, 1)}
                    onDelete={() => deleteItem("project", projIdx)}
                    onImprove={() => improveBlock("project", projIdx)}
                  >
                    <div className="animate-fade-in text-xs w-full">
                      {renderEditableText(
                        proj.contentHtml || getInitialContentHtml(proj, "project", templateId),
                        "project",
                        projIdx,
                        undefined,
                        "contentHtml"
                      )}
                    </div>
                  </BlockWrapper>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">Education</h2>
            <div className="flex flex-col gap-3">
              {education.map((edu: any, eduIdx: number) => (
                <BlockWrapper
                  key={eduIdx}
                  type="education"
                  index={eduIdx}
                  workMode={workMode}
                  isFirst={eduIdx === 0}
                  isLast={eduIdx === education.length - 1}
                  onMoveUp={() => moveItem("education", eduIdx, -1)}
                  onMoveDown={() => moveItem("education", eduIdx, 1)}
                  onDelete={() => deleteItem("education", eduIdx)}
                  onImprove={() => improveBlock("education", eduIdx)}
                >
                  <div className="animate-fade-in text-xs w-full">
                    {renderEditableText(
                      edu.contentHtml || getInitialContentHtml(edu, "education", templateId),
                      "education",
                      eduIdx,
                      undefined,
                      "contentHtml"
                    )}
                  </div>
                </BlockWrapper>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        <div className={getHeatmapBorder("skills")}>
          {skills.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">Technical Skills</h2>
              <div className="flex flex-col gap-2 pt-1">
                {(() => {
                  const normalized = (() => {
                    if (!skills) return [];
                    if (!Array.isArray(skills)) return [];
                    if (skills.length > 0 && typeof skills[0] === "object" && skills[0] !== null && "category" in skills[0]) {
                      return skills as Array<{ category: string; items: string[] }>;
                    }
                    const stringItems = skills.filter((item) => typeof item === "string");
                    return [{ category: "Skills", items: stringItems }];
                  })();
                  
                  return normalized.map((cat, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">{cat.category}:</span>
                      {cat.items.map((item: string, sIdx: number) => (
                        <span 
                          key={sIdx} 
                          className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Template B: ATS (Extremely Plain, Clean, One-Column, High-Contrast for Parser rates)
  if (templateId === "ats") {
    return (
      <div 
        style={{ ...inlineStyles, fontFamily: "Arial", fontSize: "11px", color: "#000" }}
        className="w-full min-h-[1050px] bg-white text-black p-10 border border-slate-200 shadow-lg mx-auto print:border-0 print:shadow-none"
      >
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase">{personalInfo.fullName || "Your Full Name"}</h1>
          <div className="text-xs mt-1">
            {personalInfo.location} | {personalInfo.phone} | {personalInfo.email}
          </div>
          <div className="text-xs text-blue-800">
            {personalInfo.linkedin} | {personalInfo.github}
          </div>
        </div>

        <div className={getHeatmapBorder("summary")}>
          {personalInfo.summary && (
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1.5">Professional Summary</h2>
              <div className="text-xs leading-normal">
                {renderEditableText(personalInfo.summary, "summary", 0)}
              </div>
            </div>
          )}
        </div>

        <div className={getHeatmapBorder("skills")}>
          {skills.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1.5">Core Technical Skills</h2>
              <div className="text-xs leading-normal">
                {(() => {
                  const normalized = (() => {
                    if (!skills) return [];
                    if (!Array.isArray(skills)) return [];
                    if (skills.length > 0 && typeof skills[0] === "object" && skills[0] !== null && "category" in skills[0]) {
                      return skills as Array<{ category: string; items: string[] }>;
                    }
                    const stringItems = skills.filter((item) => typeof item === "string");
                    return [{ category: "Skills", items: stringItems }];
                  })();

                  return normalized.map(cat => `${cat.category}: ${cat.items.join(", ")}`).join(" | ");
                })()}
              </div>
            </div>
          )}
        </div>

        <div className={getHeatmapBorder("experience")}>
          {experience.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1.5">Work History</h2>
              <div className="flex flex-col gap-3">
                {experience.map((exp: any, expIdx: number) => (
                  <BlockWrapper
                    key={expIdx}
                    type="experience"
                    index={expIdx}
                    workMode={workMode}
                    isFirst={expIdx === 0}
                    isLast={expIdx === experience.length - 1}
                    onMoveUp={() => moveItem("experience", expIdx, -1)}
                    onMoveDown={() => moveItem("experience", expIdx, 1)}
                    onDelete={() => deleteItem("experience", expIdx)}
                    onImprove={() => improveBlock("experience", expIdx)}
                  >
                    <div className="animate-fade-in text-xs w-full">
                      {renderEditableText(
                        exp.contentHtml || getInitialContentHtml(exp, "experience", templateId),
                        "experience",
                        expIdx,
                        undefined,
                        "contentHtml"
                      )}
                    </div>
                  </BlockWrapper>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={getHeatmapBorder("projects")}>
          {projects.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase border-b border-black pb-0.5 mb-1.5">Key Projects</h2>
              <div className="flex flex-col gap-3">
                {projects.map((proj: any, projIdx: number) => (
                  <BlockWrapper
                    key={projIdx}
                    type="project"
                    index={projIdx}
                    workMode={workMode}
                    isFirst={projIdx === 0}
                    isLast={projIdx === projects.length - 1}
                    onMoveUp={() => moveItem("project", projIdx, -1)}
                    onMoveDown={() => moveItem("project", projIdx, 1)}
                    onDelete={() => deleteItem("project", projIdx)}
                    onImprove={() => improveBlock("project", projIdx)}
                  >
                    <div className="animate-fade-in text-xs w-full">
                      {renderEditableText(
                        proj.contentHtml || getInitialContentHtml(proj, "project", templateId),
                        "project",
                        projIdx,
                        undefined,
                        "contentHtml"
                      )}
                    </div>
                  </BlockWrapper>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Template C: Executive (Sleek layout, emphasis on leadership and career progression)
  if (templateId === "executive") {
    return (
      <div 
        style={inlineStyles}
        className="w-full min-h-[1050px] bg-slate-50 text-slate-800 border-t-8 border-indigo-900 shadow-2xl p-10 mx-auto print:border-0 print:shadow-none"
      >
        <div className="flex justify-between items-end border-b border-slate-200 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">{personalInfo.fullName || "Your Name"}</h1>
            <p className="text-xs uppercase tracking-widest text-indigo-700 font-semibold mt-1">{data.targetRole || "Executive Leader"}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>{personalInfo.email} | {personalInfo.phone}</div>
            <div>{personalInfo.location} | {personalInfo.linkedin}</div>
          </div>
        </div>

        <div className={getHeatmapBorder("summary")}>
          {personalInfo.summary && (
            <div className="mb-6 bg-slate-100 p-4 rounded-xl border-l-4 border-indigo-900">
              <h2 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1.5">Executive Statement</h2>
              <div className="text-xs italic leading-relaxed text-slate-700">
                {renderEditableText(personalInfo.summary, "summary", 0)}
              </div>
            </div>
          )}
        </div>

        <div className={getHeatmapBorder("experience")}>
          {experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase text-indigo-900 tracking-widest mb-4">Leadership Chronology</h2>
              <div className="space-y-5">
                {experience.map((exp: any, expIdx: number) => (
                  <BlockWrapper
                    key={expIdx}
                    type="experience"
                    index={expIdx}
                    workMode={workMode}
                    isFirst={expIdx === 0}
                    isLast={expIdx === experience.length - 1}
                    onMoveUp={() => moveItem("experience", expIdx, -1)}
                    onMoveDown={() => moveItem("experience", expIdx, 1)}
                    onDelete={() => deleteItem("experience", expIdx)}
                    onImprove={() => improveBlock("experience", expIdx)}
                  >
                    <div className="animate-fade-in text-xs w-full">
                      {renderEditableText(
                        exp.contentHtml || getInitialContentHtml(exp, "experience", templateId),
                        "experience",
                        expIdx,
                        undefined,
                        "contentHtml"
                      )}
                    </div>
                  </BlockWrapper>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Template D: Harvard (Academic & Formal template)
  if (templateId === "harvard") {
    return (
      <div 
        style={{ ...inlineStyles, fontFamily: "Times New Roman" }}
        className="w-full min-h-[1050px] bg-white text-slate-900 p-12 border border-slate-200 shadow-lg mx-auto print:border-0 print:shadow-none"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif uppercase tracking-wider">{personalInfo.fullName || "Your Full Name"}</h1>
          <div className="text-xs text-slate-600 mt-1 italic">
            {personalInfo.location} | {personalInfo.phone} | {personalInfo.email}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {personalInfo.linkedin} | {personalInfo.github}
          </div>
        </div>

        <div className="border-t border-slate-800 my-4" />

        <div className={getHeatmapBorder("summary")}>
          {personalInfo.summary && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-center mb-2">Qualifications Profile</h2>
              <div className="text-xs text-justify leading-relaxed">
                {renderEditableText(personalInfo.summary, "summary", 0)}
              </div>
            </div>
          )}
        </div>

        <div className={getHeatmapBorder("experience")}>
          {experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-center mb-3">Professional Experience</h2>
              <div className="space-y-4">
                {experience.map((exp: any, expIdx: number) => (
                  <BlockWrapper
                    key={expIdx}
                    type="experience"
                    index={expIdx}
                    workMode={workMode}
                    isFirst={expIdx === 0}
                    isLast={expIdx === experience.length - 1}
                    onMoveUp={() => moveItem("experience", expIdx, -1)}
                    onMoveDown={() => moveItem("experience", expIdx, 1)}
                    onDelete={() => deleteItem("experience", expIdx)}
                    onImprove={() => improveBlock("experience", expIdx)}
                  >
                    <div className="animate-fade-in text-xs w-full">
                      {renderEditableText(
                        exp.contentHtml || getInitialContentHtml(exp, "experience", templateId),
                        "experience",
                        expIdx,
                        undefined,
                        "contentHtml"
                      )}
                    </div>
                  </BlockWrapper>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Template E: Tech (Tailored for Engineers, showing key stacks prominent)
  if (templateId === "tech") {
    return (
      <div 
        style={inlineStyles}
        className="w-full min-h-[1050px] bg-slate-950 text-slate-350 p-8 border border-slate-800 shadow-2xl mx-auto print:border-0 print:shadow-none"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{personalInfo.fullName || "Your Full Name"}</h1>
            <p className="text-sm text-indigo-400 font-semibold mt-1 font-mono">{data.targetRole || "Systems Architect"}</p>
          </div>
          <div className="text-xs text-slate-500 font-mono flex flex-col gap-1">
            <div>Email: <span className="text-slate-300">{personalInfo.email}</span></div>
            <div>Phone: <span className="text-slate-300">{personalInfo.phone}</span></div>
            <div>Github: <span className="text-indigo-400">{personalInfo.github}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1 flex flex-col gap-6">
            <div className={getHeatmapBorder("skills")}>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold text-white uppercase font-mono mb-1">Languages & APIs</h3>
                {(() => {
                  const normalized = (() => {
                    if (!skills) return [];
                    if (!Array.isArray(skills)) return [];
                    if (skills.length > 0 && typeof skills[0] === "object" && skills[0] !== null && "category" in skills[0]) {
                      return skills as Array<{ category: string; items: string[] }>;
                    }
                    const stringItems = skills.filter((item) => typeof item === "string");
                    return [{ category: "Skills", items: stringItems }];
                  })();

                  return normalized.map((cat, idx) => (
                    <div key={idx} className="flex flex-col gap-1 text-[11px] font-mono">
                      <span className="text-indigo-400 font-bold">{cat.category}:</span>
                      <div className="flex flex-wrap gap-1 pl-1">
                        {cat.items.map((item: string, sIdx: number) => (
                          <span key={sIdx} className="bg-slate-950 border border-slate-800 text-[9px] text-slate-350 px-1.5 py-0.5 rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          <div className="col-span-3 flex flex-col gap-6">
            <div className={getHeatmapBorder("summary")}>
              {personalInfo.summary && (
                <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-xl">
                  <div className="text-xs leading-relaxed">
                    {renderEditableText(personalInfo.summary, "summary", 0)}
                  </div>
                </div>
              )}
            </div>

            <div className={getHeatmapBorder("experience")}>
              {experience.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-white uppercase font-mono mb-4 border-b border-slate-800 pb-2">Employment Record</h3>
                  <div className="space-y-4">
                    {experience.map((exp: any, expIdx: number) => (
                      <BlockWrapper
                        key={expIdx}
                        type="experience"
                        index={expIdx}
                        workMode={workMode}
                        isFirst={expIdx === 0}
                        isLast={expIdx === experience.length - 1}
                        onMoveUp={() => moveItem("experience", expIdx, -1)}
                        onMoveDown={() => moveItem("experience", expIdx, 1)}
                        onDelete={() => deleteItem("experience", expIdx)}
                        onImprove={() => improveBlock("experience", expIdx)}
                      >
                        <div className="animate-fade-in text-xs w-full">
                          {renderEditableText(
                            exp.contentHtml || getInitialContentHtml(exp, "experience", templateId),
                            "experience",
                            expIdx,
                            undefined,
                            "contentHtml"
                          )}
                        </div>
                      </BlockWrapper>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Template G: LaTeX (Strict Black-and-White Corporate/Academic layout)
  if (templateId === "latex") {
    const achievements = data.achievements || [];
    const certifications = data.certifications || [];
    
    return (
      <div 
        style={{
          ...inlineStyles,
          fontFamily: "Georgia, serif",
          color: "#000000",
          backgroundColor: "#ffffff",
          padding: "45px"
        }}
        className="w-full min-h-[1050px] border border-slate-200 shadow-lg mx-auto print:border-0 print:shadow-none"
      >
        {/* Name and Header Info */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif font-bold uppercase tracking-wide text-black">
            {renderEditableText(personalInfo.fullName || "Your Full Name", "personalInfo", 0, undefined, "fullName")}
          </h1>
          <div className="text-[10.5px] mt-1.5 text-slate-850 font-serif flex justify-center flex-wrap gap-x-2 gap-y-1.5">
            {personalInfo.email && <span>{renderEditableText(personalInfo.email, "personalInfo", 0, undefined, "email")}</span>}
            {personalInfo.email && (personalInfo.phone || personalInfo.location || personalInfo.linkedin || personalInfo.github) && <span>|</span>}
            {personalInfo.phone && <span>{renderEditableText(personalInfo.phone, "personalInfo", 0, undefined, "phone")}</span>}
            {personalInfo.phone && (personalInfo.location || personalInfo.linkedin || personalInfo.github) && <span>|</span>}
            {personalInfo.location && <span>{renderEditableText(personalInfo.location, "personalInfo", 0, undefined, "location")}</span>}
            {personalInfo.location && (personalInfo.linkedin || personalInfo.github) && <span>|</span>}
            {personalInfo.linkedin && <span>LinkedIn: {renderEditableText(personalInfo.linkedin, "personalInfo", 0, undefined, "linkedin")}</span>}
            {personalInfo.linkedin && personalInfo.github && <span>|</span>}
            {personalInfo.github && <span>GitHub: {renderEditableText(personalInfo.github, "personalInfo", 0, undefined, "github")}</span>}
          </div>
        </div>

        {/* Summary */}
        {personalInfo.summary && (
          <div className="mb-4">
            <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-black mb-1">
              About Me
            </h2>
            <div className="border-t border-black my-1" />
            <div className="text-[11px] leading-relaxed text-slate-900 font-serif whitespace-pre-wrap">
              {renderEditableText(personalInfo.summary, "summary", 0)}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-black mb-1">
              Experience
            </h2>
            <div className="border-t border-black my-1" />
            <div className="flex flex-col gap-4 mt-2">
              {experience.map((exp: any, expIdx: number) => (
                <BlockWrapper
                  key={expIdx}
                  type="experience"
                  index={expIdx}
                  workMode={workMode}
                  isFirst={expIdx === 0}
                  isLast={expIdx === experience.length - 1}
                  onMoveUp={() => moveItem("experience", expIdx, -1)}
                  onMoveDown={() => moveItem("experience", expIdx, 1)}
                  onDelete={() => deleteItem("experience", expIdx)}
                  onImprove={() => improveBlock("experience", expIdx)}
                >
                  <div className="animate-fade-in text-[11px] w-full text-left font-serif leading-relaxed text-black">
                    {renderEditableText(
                      exp.contentHtml || getInitialContentHtml(exp, "experience", templateId),
                      "experience",
                      expIdx,
                      undefined,
                      "contentHtml"
                    )}
                  </div>
                </BlockWrapper>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-black mb-1">
              Education
            </h2>
            <div className="border-t border-black my-1" />
            <div className="flex flex-col gap-4 mt-2">
              {education.map((edu: any, eduIdx: number) => (
                <BlockWrapper
                  key={eduIdx}
                  type="education"
                  index={eduIdx}
                  workMode={workMode}
                  isFirst={eduIdx === 0}
                  isLast={eduIdx === education.length - 1}
                  onMoveUp={() => moveItem("education", eduIdx, -1)}
                  onMoveDown={() => moveItem("education", eduIdx, 1)}
                  onDelete={() => deleteItem("education", eduIdx)}
                  onImprove={() => improveBlock("education", eduIdx)}
                >
                  <div className="animate-fade-in text-[11px] w-full text-left font-serif leading-relaxed text-black">
                    {renderEditableText(
                      edu.contentHtml || getInitialContentHtml(edu, "education", templateId),
                      "education",
                      eduIdx,
                      undefined,
                      "contentHtml"
                    )}
                  </div>
                </BlockWrapper>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-black mb-1">
              Projects
            </h2>
            <div className="border-t border-black my-1" />
            <div className="flex flex-col gap-4 mt-2">
              {projects.map((proj: any, projIdx: number) => (
                <BlockWrapper
                  key={projIdx}
                  type="project"
                  index={projIdx}
                  workMode={workMode}
                  isFirst={projIdx === 0}
                  isLast={projIdx === projects.length - 1}
                  onMoveUp={() => moveItem("project", projIdx, -1)}
                  onMoveDown={() => moveItem("project", projIdx, 1)}
                  onDelete={() => deleteItem("project", projIdx)}
                  onImprove={() => improveBlock("project", projIdx)}
                >
                  <div className="animate-fade-in text-[11px] w-full text-left font-serif leading-relaxed text-black">
                    {renderEditableText(
                      proj.contentHtml || getInitialContentHtml(proj, "project", templateId),
                      "project",
                      projIdx,
                      undefined,
                      "contentHtml"
                    )}
                  </div>
                </BlockWrapper>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-black mb-1">
              Skills
            </h2>
            <div className="border-t border-black my-1" />
            <div className="flex flex-col gap-1.5 mt-2 font-serif text-[11px] text-slate-800">
              {(() => {
                const normalized = (() => {
                  if (skills.length > 0 && typeof skills[0] === "object" && skills[0] !== null && "category" in skills[0]) {
                    return skills as Array<{ category: string; items: string[] }>;
                  }
                  const stringItems = skills.filter((item: any) => typeof item === "string");
                  if (stringItems.length === 0) return [];
                  return [{ category: "Skills", items: stringItems }];
                })();

                return normalized.map((cat, cIdx) => (
                  <div key={cIdx} className="flex items-start gap-1">
                    <span className="font-bold text-black shrink-0">{cat.category}:</span>
                    <span className="ml-1 text-slate-800">{cat.items.join(", ")}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-black mb-1">
              Achievements
            </h2>
            <div className="border-t border-black my-1" />
            <ul className="list-disc pl-5 text-[11px] text-slate-800 flex flex-col gap-1 mt-2 font-serif">
              {achievements.map((ach: string, idx: number) => (
                <li key={idx}>{ach}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-serif font-bold uppercase tracking-wider text-black mb-1">
              Certifications
            </h2>
            <div className="border-t border-black my-1" />
            <ul className="list-disc pl-5 text-[11px] text-slate-800 flex flex-col gap-1 mt-2 font-serif">
              {certifications.map((cert: string, idx: number) => (
                <li key={idx}>{cert}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Fallback layout (LaTeX inspired single-column)
  const achievements = data.achievements || [];
  const certifications = data.certifications || [];

  return (
    <div 
      style={{
        ...inlineStyles,
        fontFamily: "Georgia, serif",
        color: "#000000",
        backgroundColor: "#ffffff",
        padding: "40px"
      }}
      className="w-full min-h-[1050px] border border-slate-200 shadow-lg mx-auto print:border-0 print:shadow-none"
    >
      {/* ---------- HEADING ----------------- */}
      <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-350">
        <div>
          <h1 style={{ color: "#0000FF" }} className="text-3xl font-serif font-extrabold tracking-wide uppercase">
            {renderEditableText(personalInfo.fullName || "Your Full Name", "personalInfo", 0, undefined, "fullName")}
          </h1>
          <div className="flex flex-col gap-1 text-[11px] mt-2 text-slate-700 font-serif">
            {personalInfo.linkedin && (
              <span className="flex items-center gap-1">
                Linkedin: {renderEditableText(personalInfo.linkedin, "personalInfo", 0, undefined, "linkedin")}
              </span>
            )}
            {personalInfo.github && (
              <span className="flex items-center gap-1">
                Github: {renderEditableText(personalInfo.github, "personalInfo", 0, undefined, "github")}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex flex-col gap-1 text-[11px] text-slate-700 mt-2 font-serif font-medium">
          {personalInfo.email && (
            <span>
              Email: {renderEditableText(personalInfo.email, "personalInfo", 0, undefined, "email")}
            </span>
          )}
          {personalInfo.phone && (
            <span>
              Mobile: {renderEditableText(personalInfo.phone, "personalInfo", 0, undefined, "phone")}
            </span>
          )}
          {personalInfo.location && (
            <span>
              Location: {renderEditableText(personalInfo.location, "personalInfo", 0, undefined, "location")}
            </span>
          )}
        </div>
      </div>

      {/* ----------- SUMMARY (About Me) ----------------- */}
      {personalInfo.summary && (
        <div className="mb-4">
          <h2 style={{ color: "#8A2BE2" }} className="text-sm font-bold uppercase tracking-wide">
            About Me
          </h2>
          <div className="border-t border-black my-1" />
          <div className="text-xs leading-relaxed text-slate-800 mt-2 font-serif">
            {renderEditableText(personalInfo.summary, "summary", 0)}
          </div>
        </div>
      )}

      {/* ----------- SKILLS SUMMARY ----------------- */}
      {skills.length > 0 && (
        <div className="mb-4">
          <h2 style={{ color: "#8A2BE2" }} className="text-sm font-bold uppercase tracking-wide">
            Skills Summary
          </h2>
          <div className="border-t border-black my-1" />
          <div className="flex flex-col gap-2 mt-2 font-serif">
            {(() => {
              const normalized = (() => {
                if (skills.length > 0 && typeof skills[0] === "object" && skills[0] !== null && "category" in skills[0]) {
                  return skills as Array<{ category: string; items: string[] }>;
                }
                const stringItems = skills.filter((item: any) => typeof item === "string");
                if (stringItems.length === 0) return [];
                return [{ category: "Skills", items: stringItems }];
              })();

              return normalized.map((cat, cIdx) => (
                <div key={cIdx} className="text-xs flex items-start gap-1">
                  <span style={{ color: "#0000FF" }} className="font-bold shrink-0">
                    {cat.category}:
                  </span>
                  <span className="text-slate-800 ml-1">
                    {cat.items.join(", ")}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ----------- EDUCATION ----------------- */}
      {education.length > 0 && (
        <div className="mb-4">
          <h2 style={{ color: "#8A2BE2" }} className="text-sm font-bold uppercase tracking-wide">
            Education
          </h2>
          <div className="border-t border-black my-1" />
          <div className="flex flex-col gap-4 mt-2 font-serif">
            {education.map((edu: any, eduIdx: number) => (
              <BlockWrapper
                key={eduIdx}
                type="education"
                index={eduIdx}
                workMode={workMode}
                isFirst={eduIdx === 0}
                isLast={eduIdx === education.length - 1}
                onMoveUp={() => moveItem("education", eduIdx, -1)}
                onMoveDown={() => moveItem("education", eduIdx, 1)}
                onDelete={() => deleteItem("education", eduIdx)}
                onImprove={() => improveBlock("education", eduIdx)}
              >
                <div className="animate-fade-in text-xs w-full">
                  {renderEditableText(
                    edu.contentHtml || getInitialContentHtml(edu, "education", templateId),
                    "education",
                    eduIdx,
                    undefined,
                    "contentHtml"
                  )}
                </div>
              </BlockWrapper>
            ))}
          </div>
        </div>
      )}

      {/* ----------- EXPERIENCE ----------------- */}
      {experience.length > 0 && (
        <div className="mb-4">
          <h2 style={{ color: "#8A2BE2" }} className="text-sm font-bold uppercase tracking-wide">
            Experience
          </h2>
          <div className="border-t border-black my-1" />
          <div className="flex flex-col gap-4 mt-2 font-serif">
            {experience.map((exp: any, expIdx: number) => (
              <BlockWrapper
                key={expIdx}
                type="experience"
                index={expIdx}
                workMode={workMode}
                isFirst={expIdx === 0}
                isLast={expIdx === experience.length - 1}
                onMoveUp={() => moveItem("experience", expIdx, -1)}
                onMoveDown={() => moveItem("experience", expIdx, 1)}
                onDelete={() => deleteItem("experience", expIdx)}
                onImprove={() => improveBlock("experience", expIdx)}
              >
                <div className="animate-fade-in text-xs w-full">
                  {renderEditableText(
                    exp.contentHtml || getInitialContentHtml(exp, "experience", templateId),
                    "experience",
                    expIdx,
                    undefined,
                    "contentHtml"
                  )}
                </div>
              </BlockWrapper>
            ))}
          </div>
        </div>
      )}

      {/* ----------- PROJECTS ----------------- */}
      {projects.length > 0 && (
        <div className="mb-4">
          <h2 style={{ color: "#8A2BE2" }} className="text-sm font-bold uppercase tracking-wide">
            Projects
          </h2>
          <div className="border-t border-black my-1" />
          <div className="flex flex-col gap-4 mt-2 font-serif">
            {projects.map((proj: any, projIdx: number) => (
              <BlockWrapper
                key={projIdx}
                type="project"
                index={projIdx}
                workMode={workMode}
                isFirst={projIdx === 0}
                isLast={projIdx === projects.length - 1}
                onMoveUp={() => moveItem("project", projIdx, -1)}
                onMoveDown={() => moveItem("project", projIdx, 1)}
                onDelete={() => deleteItem("project", projIdx)}
                onImprove={() => improveBlock("project", projIdx)}
              >
                <div className="animate-fade-in text-xs w-full">
                  {renderEditableText(
                    proj.contentHtml || getInitialContentHtml(proj, "project", templateId),
                    "project",
                    projIdx,
                    undefined,
                    "contentHtml"
                  )}
                </div>
              </BlockWrapper>
            ))}
          </div>
        </div>
      )}

      {/* ----------- ACHIEVEMENTS ----------------- */}
      {achievements.length > 0 && (
        <div className="mb-4">
          <h2 style={{ color: "#8A2BE2" }} className="text-sm font-bold uppercase tracking-wide">
            Achievements
          </h2>
          <div className="border-t border-black my-1" />
          <ul className="list-disc pl-5 text-xs text-slate-800 flex flex-col gap-1.5 mt-2 font-serif">
            {achievements.map((ach: string, idx: number) => (
              <li key={idx}>
                {ach}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ----------- CERTIFICATIONS ----------------- */}
      {certifications.length > 0 && (
        <div className="mb-4 font-serif">
          <h2 style={{ color: "#8A2BE2" }} className="text-sm font-bold uppercase tracking-wide">
            Certifications
          </h2>
          <div className="border-t border-black my-1" />
          <ul className="list-disc pl-5 text-xs text-slate-800 flex flex-col gap-1.5 mt-2">
            {certifications.map((cert: string, idx: number) => (
              <li key={idx}>
                {cert}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
