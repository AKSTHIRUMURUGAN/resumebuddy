"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layout, Type, AlignLeft, ChevronDown, ChevronUp,
  Minus, Plus, Palette, LayoutGrid
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CustomizeSidebarProps {
  formatting: any;
  onUpdate: (updates: Partial<any>) => void;
  resumeData: any; // full resume for mini previews
}

// ─── Layout Presets ────────────────────────────────────────────────────────────
const LAYOUT_PRESETS = [
  { name: "Compact",     fontSize: 10, sectionGap: 6,  itemSpacing: 4,  padding: 12 },
  { name: "Snug",        fontSize: 10, sectionGap: 7,  itemSpacing: 5,  padding: 14 },
  { name: "Tight",       fontSize: 11, sectionGap: 8,  itemSpacing: 5,  padding: 16 },
  { name: "Balanced",    fontSize: 11, sectionGap: 9,  itemSpacing: 6,  padding: 18 },
  { name: "Comfortable", fontSize: 12, sectionGap: 10, itemSpacing: 7,  padding: 20 },
  { name: "Airy",        fontSize: 12, sectionGap: 12, itemSpacing: 8,  padding: 22 },
  { name: "Open",        fontSize: 13, sectionGap: 14, itemSpacing: 9,  padding: 24 },
  { name: "Loose",       fontSize: 13, sectionGap: 16, itemSpacing: 10, padding: 26 },
  { name: "Spacious",    fontSize: 14, sectionGap: 18, itemSpacing: 11, padding: 28 },
];

const FONT_FAMILIES = [
  "Arial",
  "Calibri",
  "Georgia",
  "Times New Roman",
  "Helvetica",
];

const TEMPLATES = [
  { id: "minimal",   label: "Minimal",   density: "Low" },
  { id: "classic",   label: "Classic",   density: "Medium" },
  { id: "modern",    label: "Modern",    density: "Balanced" },
  { id: "compact",   label: "Compact",   density: "Bulky" },
  { id: "executive", label: "Executive", density: "Executive" },
];

// ─── Shared Slider + Stepper ───────────────────────────────────────────────────
function SliderStepper({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "px",
  onChange,
  showDots = false,
  dotCount,
}: {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  showDots?: boolean;
  dotCount?: number;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const dots = dotCount ?? Math.round((max - min) / step) + 1;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</span>}

      {/* Track + thumb */}
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-0 flex items-center">
          <div className="relative w-full h-1.5 rounded-full bg-slate-700/80">
            {/* filled portion */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
          style={{ zIndex: 2 }}
        />
        {/* thumb visual */}
        <div
          className="absolute w-4 h-4 rounded-full bg-violet-500 border-2 border-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.7)] pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>

      {/* Dots */}
      {showDots && (
        <div className="flex items-center justify-between px-0.5">
          {Array.from({ length: dots }).map((_, i) => {
            const dotVal = min + i * step;
            const active = Math.abs(value - dotVal) < step / 2;
            return (
              <button
                key={i}
                onClick={() => onChange(dotVal)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  active ? "bg-violet-400 scale-125" : "bg-slate-600 hover:bg-slate-400"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Stepper row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(clamp(value - step))}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-white transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="flex-1 text-center text-xs font-mono font-bold text-white bg-slate-800/60 border border-slate-700 rounded-lg py-1.5">
          {value}{unit}
        </span>
        <button
          onClick={() => onChange(clamp(value + step))}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-white transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Section Accordion Wrapper ─────────────────────────────────────────────────
function CustomizeSection({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-[#0d1117]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/30 transition-colors"
      >
        <span className="flex items-center gap-2.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
          <Icon className="h-3.5 w-3.5 text-violet-400" />
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 flex flex-col gap-5 border-t border-slate-800/60">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Visual Mini Preview for Spacing Diagram ───────────────────────────────────
function SpacingDiagram({ type }: { type: "section-gap" | "item-spacing" | "padding" }) {
  if (type === "section-gap") {
    return (
      <div className="w-20 h-16 rounded-lg bg-slate-800/60 border border-slate-700/50 flex flex-col justify-center px-2 gap-0.5 shrink-0">
        <div className="h-1 bg-slate-500 rounded" />
        <div className="h-0.5 bg-slate-600 rounded w-3/4" />
        <div className="h-0.5 bg-slate-600 rounded w-2/4" />
        <div className="flex items-center justify-center py-0.5">
          <div className="flex flex-col items-center gap-px">
            <div className="w-px h-1.5 bg-violet-400" />
            <div className="text-violet-400" style={{ fontSize: 6 }}>↕</div>
            <div className="w-px h-1.5 bg-violet-400" />
          </div>
        </div>
        <div className="h-1 bg-slate-500 rounded" />
        <div className="h-0.5 bg-slate-600 rounded w-3/4" />
      </div>
    );
  }
  if (type === "item-spacing") {
    return (
      <div className="w-20 h-16 rounded-lg bg-slate-800/60 border border-slate-700/50 flex flex-col justify-center px-2 gap-0.5 shrink-0">
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div className="h-0.5 bg-slate-600 rounded" style={{ width: `${90 - i * 10}%` }} />
            {i < 3 && (
              <div className="flex items-center pl-1 py-px">
                <div className="w-px h-1 bg-violet-400/60" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
  // Padding
  return (
    <div className="w-20 h-20 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center p-1 shrink-0 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-orange-500/30 border-r border-orange-500/60"
        style={{ backgroundImage: "repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(249,115,22,0.15) 2px,rgba(249,115,22,0.15) 4px)" }}
      />
      <div className="w-full h-full ml-2 rounded bg-slate-700/60 border border-slate-600/50 flex items-center justify-center">
        <span className="text-[9px] text-slate-400 font-semibold">Content</span>
      </div>
    </div>
  );
}

// ─── Typography Sub-panel ──────────────────────────────────────────────────────
function TypoElement({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { fontFamily: string; fontSize: number; lineHeight: number; color: string };
  onChange: (v: any) => void;
}) {
  return (
    <div className="flex flex-col gap-3 bg-slate-900/40 border border-slate-800/60 rounded-xl p-3">
      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{label}</span>

      {/* Font Style */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-slate-500 font-bold uppercase">Font Style</label>
        <select
          value={value.fontFamily}
          onChange={(e) => onChange({ ...value, fontFamily: e.target.value })}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-violet-500"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <SliderStepper
        label="Font Size"
        value={value.fontSize}
        min={8}
        max={24}
        step={0.5}
        onChange={(v) => onChange({ ...value, fontSize: v })}
      />

      {/* Line Height */}
      <SliderStepper
        label="Line Height"
        value={value.lineHeight}
        min={1.0}
        max={2.0}
        step={0.05}
        unit=""
        onChange={(v) => onChange({ ...value, lineHeight: Math.round(v * 100) / 100 })}
      />

      {/* Font Color */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-slate-500 font-bold uppercase">Font Color</label>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2">
          <input
            type="color"
            value={value.color}
            onChange={(e) => onChange({ ...value, color: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
          />
          <span className="text-[11px] text-slate-300 font-mono">{value.color.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomizeSidebar({ formatting, onUpdate }: CustomizeSidebarProps) {
  // Derive safe formatting values with defaults
  const layoutStep = formatting.layoutPreset ?? 5; // default: Comfortable
  const currentPreset = LAYOUT_PRESETS[layoutStep - 1] ?? LAYOUT_PRESETS[4];

  const fontSize    = formatting.fontSize    ?? currentPreset.fontSize;
  const sectionGap  = formatting.sectionGap  ?? currentPreset.sectionGap;
  const itemSpacing = formatting.itemSpacing ?? currentPreset.itemSpacing;
  const paddingLeft   = formatting.paddingLeft   ?? currentPreset.padding;
  const paddingRight  = formatting.paddingRight  ?? currentPreset.padding;
  const paddingTop    = formatting.paddingTop    ?? currentPreset.padding;
  const paddingBottom = formatting.paddingBottom ?? currentPreset.padding;

  const typography = formatting.typography ?? {
    name:          { fontFamily: "Arial", fontSize: 22, lineHeight: 1.2, color: "#334155" },
    sectionHeader: { fontFamily: "Arial", fontSize: 11, lineHeight: 1.3, color: "#334155" },
    subheading:    { fontFamily: "Arial", fontSize: 12, lineHeight: 1.25, color: "#334155" },
    body:          { fontFamily: "Arial", fontSize: 11, lineHeight: 1.3, color: "#1e293b" },
  };


  const currentTemplateId = formatting.templateId ?? "minimal";

  // Apply a full layout preset
  const applyPreset = useCallback((step: number) => {
    const p = LAYOUT_PRESETS[step - 1];
    if (!p) return;
    onUpdate({
      layoutPreset:  step,
      fontSize:      p.fontSize,
      sectionGap:    p.sectionGap,
      itemSpacing:   p.itemSpacing,
      paddingLeft:   p.padding,
      paddingRight:  p.padding,
      paddingTop:    p.padding,
      paddingBottom: p.padding,
    });
  }, [onUpdate]);

  return (
    <div className="flex flex-col gap-3">

      {/* ─── 1. Template Picker ─────────────────────────────────────────────── */}
      <CustomizeSection icon={LayoutGrid} title="Choose a Template" defaultOpen>
        <p className="text-[10px] text-slate-500 -mt-2">Get started with a template and customize it easily.</p>

        {/* Scrollable card row */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {TEMPLATES.map((tpl) => {
            const selected = currentTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => onUpdate({ templateId: tpl.id })}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 group`}
              >
                {/* Mini preview container */}
                <div className={`w-[80px] h-[106px] rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  selected ? "border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]" : "border-slate-700 hover:border-slate-500"
                } bg-white relative`}>
                  {/* Static paper preview using CSS */}
                  <div className="absolute inset-0 flex flex-col" style={{ padding: 4 }}>
                    <div className="h-2 bg-slate-800 rounded-sm mb-1" />
                    <div className="h-px bg-slate-300 mb-1" />
                    {[85, 70, 90, 60, 75].map((w, i) => (
                      <div key={i} className="h-px bg-slate-200 mb-0.5" style={{ width: `${w}%` }} />
                    ))}
                    <div className="h-1.5 bg-slate-400 rounded-sm mt-1 mb-0.5 w-20" />
                    {[95, 80, 65, 85].map((w, i) => (
                      <div key={i} className="h-px bg-slate-200 mb-0.5" style={{ width: `${w}%` }} />
                    ))}
                    <div className="h-1.5 bg-slate-400 rounded-sm mt-1 mb-0.5 w-16" />
                    {[75, 90, 70].map((w, i) => (
                      <div key={i} className="h-px bg-slate-200 mb-0.5" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  {/* Selected overlay label */}
                  {selected && (
                    <div className="absolute inset-x-0 bottom-0 bg-violet-600/90 text-white text-[9px] font-bold text-center py-1">
                      ✓ Selected
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-semibold ${selected ? "text-violet-400" : "text-slate-400 group-hover:text-slate-300"}`}>
                  {tpl.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom buttons */}
        <div className="flex gap-2 -mt-1">
          <button className="flex-1 text-[10px] text-slate-400 border border-slate-700 hover:border-slate-500 rounded-lg py-1.5 flex items-center justify-center gap-1 hover:text-slate-200 transition-colors">
            View all ↗
          </button>
          <button className="flex-1 text-[10px] text-slate-400 border border-slate-700 hover:border-slate-500 rounded-lg py-1.5 flex items-center justify-center gap-1 hover:text-slate-200 transition-colors">
            Request template
          </button>
        </div>
      </CustomizeSection>

      {/* ─── 2. Pre-built Layouts (dot-step slider) ─────────────────────────── */}
      <CustomizeSection icon={Layout} title="Pre-built Layouts" defaultOpen>
        <p className="text-[10px] text-slate-500 -mt-2">Quick spacing presets from compact to spacious.</p>

        {/* Current preset name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-violet-400 font-bold">✓</span>
            <span className="text-xs font-bold text-white">{currentPreset.name}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{layoutStep} / 9</span>
        </div>

        {/* Custom dot-step slider */}
        <div className="flex flex-col gap-2">
          <div className="relative h-5 flex items-center">
            <div className="absolute inset-0 flex items-center">
              <div className="relative w-full h-1.5 rounded-full bg-slate-700/80">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${((layoutStep - 1) / 8) * 100}%` }}
                />
              </div>
            </div>
            <input
              type="range" min={1} max={9} step={1}
              value={layoutStep}
              onChange={(e) => applyPreset(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
              style={{ zIndex: 2 }}
            />
            <div
              className="absolute w-4 h-4 rounded-full bg-violet-500 border-2 border-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.7)] pointer-events-none transition-all"
              style={{ left: `calc(${((layoutStep - 1) / 8) * 100}% - 8px)` }}
            />
          </div>

          {/* 9 dots */}
          <div className="flex items-center justify-between px-0.5">
            {LAYOUT_PRESETS.map((_, i) => {
              const step = i + 1;
              const active = layoutStep === step;
              return (
                <button
                  key={i}
                  onClick={() => applyPreset(step)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    active ? "bg-violet-400 scale-150" : "bg-slate-600 hover:bg-slate-400"
                  }`}
                />
              );
            })}
          </div>

          {/* Labels */}
          <div className="flex justify-between text-[9px] text-slate-500 px-0.5">
            <span>Compact</span>
            <span>Balanced</span>
            <span>Spacious</span>
          </div>
        </div>

        {/* 2×2 values grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Font Size",     value: `${fontSize}px` },
            { label: "Section Gap",   value: `${sectionGap}px` },
            { label: "Item Spacing",  value: `${itemSpacing}px` },
            { label: "Padding",       value: `${paddingTop}px` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
              <p className="text-[9px] text-slate-500 font-semibold uppercase mb-0.5">{label}</p>
              <p className="text-sm font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </CustomizeSection>

      {/* ─── 3. Typography ──────────────────────────────────────────────────── */}
      <CustomizeSection icon={Type} title="Typography">
        <TypoElement
          label="Name / Title"
          value={typography.name}
          onChange={(v) => onUpdate({ typography: { ...typography, name: v } })}
        />
        <TypoElement
          label="Heading"
          value={typography.sectionHeader}
          onChange={(v) => onUpdate({ typography: { ...typography, sectionHeader: v } })}
        />
        <TypoElement
          label="Subheading"
          value={typography.subheading || { fontFamily: "Arial", fontSize: 12, lineHeight: 1.25, color: "#334155" }}
          onChange={(v) => onUpdate({ typography: { ...typography, subheading: v } })}
        />
        <TypoElement
          label="Description"
          value={typography.body}
          onChange={(v) => onUpdate({ typography: { ...typography, body: v } })}
        />
      </CustomizeSection>


      {/* ─── 4. Padding & Spacing ───────────────────────────────────────────── */}
      <CustomizeSection icon={AlignLeft} title="Padding & Spacing">

        {/* Section Gaps */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-300">Section Gaps (Between sections)</span>
          <div className="flex items-center gap-3">
            <SpacingDiagram type="section-gap" />
            <div className="flex-1">
              <SliderStepper
                value={sectionGap}
                min={4}
                max={32}
                onChange={(v) => onUpdate({ sectionGap: v })}
              />
            </div>
          </div>
        </div>

        {/* Item Spacing */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-300">Item Spacing</span>
          <div className="flex items-center gap-3">
            <SpacingDiagram type="item-spacing" />
            <div className="flex-1">
              <SliderStepper
                value={itemSpacing}
                min={2}
                max={20}
                onChange={(v) => onUpdate({ itemSpacing: v })}
              />
            </div>
          </div>
        </div>

        {/* Padding on the sides */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-300">Padding on the side</span>
          <div className="flex items-start gap-3">
            <SpacingDiagram type="padding" />
            <div className="flex-1 flex flex-col gap-2">
              {/* Left padding */}
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-1.5">
                <span className="text-slate-400" title="Left">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="2" height="12" rx="1" fill="#a78bfa"/><line x1="4" y1="7" x2="13" y2="7" stroke="#64748b" strokeWidth="1.5"/></svg>
                </span>
                <span className="text-xs font-mono text-white w-6 text-center">{paddingLeft}</span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={() => onUpdate({ paddingLeft: Math.max(0, paddingLeft - 1) })} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center"><Minus className="h-2.5 w-2.5" /></button>
                  <button onClick={() => onUpdate({ paddingLeft: paddingLeft + 1 })} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center"><Plus className="h-2.5 w-2.5" /></button>
                </div>
              </div>
              {/* Right padding */}
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-1.5">
                <span className="text-slate-400" title="Right">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="11" y="1" width="2" height="12" rx="1" fill="#a78bfa"/><line x1="0" y1="7" x2="10" y2="7" stroke="#64748b" strokeWidth="1.5"/></svg>
                </span>
                <span className="text-xs font-mono text-white w-6 text-center">{paddingRight}</span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={() => onUpdate({ paddingRight: Math.max(0, paddingRight - 1) })} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center"><Minus className="h-2.5 w-2.5" /></button>
                  <button onClick={() => onUpdate({ paddingRight: paddingRight + 1 })} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center"><Plus className="h-2.5 w-2.5" /></button>
                </div>
              </div>
              {/* Top padding */}
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-1.5">
                <span className="text-slate-400" title="Top">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="2" rx="1" fill="#a78bfa"/><line x1="7" y1="4" x2="7" y2="13" stroke="#64748b" strokeWidth="1.5"/></svg>
                </span>
                <span className="text-xs font-mono text-white w-6 text-center">{paddingTop}</span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={() => onUpdate({ paddingTop: Math.max(0, paddingTop - 1) })} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center"><Minus className="h-2.5 w-2.5" /></button>
                  <button onClick={() => onUpdate({ paddingTop: paddingTop + 1 })} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center"><Plus className="h-2.5 w-2.5" /></button>
                </div>
              </div>
              {/* Bottom padding */}
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-lg px-2 py-1.5">
                <span className="text-slate-400" title="Bottom">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="11" width="12" height="2" rx="1" fill="#a78bfa"/><line x1="7" y1="1" x2="7" y2="10" stroke="#64748b" strokeWidth="1.5"/></svg>
                </span>
                <span className="text-xs font-mono text-white w-6 text-center">{paddingBottom}</span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={() => onUpdate({ paddingBottom: Math.max(0, paddingBottom - 1) })} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center"><Minus className="h-2.5 w-2.5" /></button>
                  <button onClick={() => onUpdate({ paddingBottom: paddingBottom + 1 })} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs flex items-center justify-center"><Plus className="h-2.5 w-2.5" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </CustomizeSection>

    </div>
  );
}
