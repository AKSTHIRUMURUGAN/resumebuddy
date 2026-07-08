"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";

import React, { useEffect, useState } from "react";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Sparkles,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Link2Off,
  MoreHorizontal
} from "lucide-react";

interface InlineTipTapEditorProps {
  content: string;
  onChange: (text: string) => void;
  onImproveAi?: (selectedText: string, replaceText: (newText: string) => void) => void;
  displayMode?: "inline" | "block";
}

export default function InlineTipTapEditor({ content, onChange, onImproveAi, displayMode = "inline" }: InlineTipTapEditorProps) {
  const [improving, setImproving] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ x: number; y: number } | null>(null);
  const [showMore, setShowMore] = useState(false);

  const isBlock = displayMode === "block";

  const editor = useEditor({
    immediatelyRender: true,
    autofocus: "end",
    extensions: [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph", "listItem"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-400 underline hover:text-indigo-300",
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML()); // Support storing HTML formatting tags
    },
    editorProps: {
      attributes: {
        class: isBlock
          ? "focus:outline-none bg-transparent text-inherit font-inherit w-full block outline-none"
          : "focus:outline-none bg-transparent text-inherit font-inherit min-w-[50px] inline outline-none border-b border-dashed border-indigo-400 dark:border-indigo-800 focus:border-indigo-600",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getText() && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Floating focus-based bubble menu positioning
  useEffect(() => {
    if (!editor) return;

    const handlePositionUpdate = () => {
      if (!editor.isFocused) {
        setMenuCoords(null);
        return;
      }

      const { from, to } = editor.state.selection;
      
      // If user has highlighted text, position menu relative to selection rect
      if (from !== to) {
        const domSel = window.getSelection();
        if (domSel && domSel.rangeCount > 0) {
          try {
            const range = domSel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
              const offset = showMore ? 85 : 45;
              setMenuCoords({
                x: rect.left + rect.width / 2 + window.scrollX,
                y: rect.top - offset + window.scrollY,
              });
              return;
            }
          } catch {}
        }
      }

      // Default: position menu centered above the focused editor DOM element itself
      const editorEl = editor.view.dom;
      if (editorEl) {
        const rect = editorEl.getBoundingClientRect();
        const offset = showMore ? 85 : 45;
        setMenuCoords({
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top - offset + window.scrollY,
        });
      }
    };

    editor.on("selectionUpdate", handlePositionUpdate);
    editor.on("focus", handlePositionUpdate);
    
    const handleBlur = () => {
      // Small timeout to allow buttons in the toolbar to be clicked before menu disappears
      setTimeout(() => {
        if (!editor.isFocused) {
          setMenuCoords(null);
        }
      }, 200);
    };
    editor.on("blur", handleBlur);

    return () => {
      editor.off("selectionUpdate", handlePositionUpdate);
      editor.off("focus", handlePositionUpdate);
      editor.off("blur", handleBlur);
    };
  }, [editor, showMore]);

  if (!editor) return null;

  const handleImproveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onImproveAi) return;

    const { from, to } = editor.state.selection;
    let selectedText = "";
    let isRangeSelection = false;

    if (from !== to) {
      selectedText = editor.state.doc.textBetween(from, to, " ");
      isRangeSelection = true;
    } else {
      selectedText = editor.getText();
    }

    if (!selectedText) return;

    setImproving(true);
    onImproveAi(selectedText, (newText) => {
      if (isRangeSelection) {
        editor.chain().focus().insertContentAt({ from, to }, newText).run();
      } else {
        editor.chain().focus().setContent(newText).run();
      }
      setImproving(false);
      setMenuCoords(null);
    });
  };

  // Formatting actions
  const toggleBold = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); };
  const toggleItalic = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); };
  const toggleUnderline = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); };
  const toggleBullet = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); };
  const toggleOrdered = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); };
  
  const setAlign = (e: React.MouseEvent, align: "left" | "center" | "right" | "justify") => {
    e.preventDefault();
    editor.chain().focus().setTextAlign(align).run();
  };

  const toggleSubscript = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleSubscript().run(); };
  const toggleSuperscript = (e: React.MouseEvent) => { e.preventDefault(); editor.chain().focus().toggleSuperscript().run(); };

  const handleLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = prompt("Enter hyperlink URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={isBlock ? "w-full block" : "relative inline-block text-inherit font-inherit inline-editor-container"}>
      {/* Floating Selection Formatting Bar */}
      {menuCoords && (
        <div
          className="fixed flex flex-col gap-1.5 bg-[#0d1117]/95 backdrop-blur border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 pointer-events-auto transition-all"
          style={{
            left: `${menuCoords.x}px`,
            top: `${menuCoords.y}px`,
            transform: "translateX(-50%)",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Main Formatting Row */}
          <div className="flex items-center gap-1">
            {onImproveAi && (
              <button
                onClick={handleImproveClick}
                disabled={improving}
                className="flex items-center gap-1 text-[10px] bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 text-white font-bold px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                {improving ? "Improving..." : "Improve with AI"}
              </button>
            )}

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* B I U */}
            <button onClick={toggleBold} className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive("bold") ? "text-violet-400 bg-slate-800/80" : "text-slate-400"}`}>
              <BoldIcon className="h-3.5 w-3.5" />
            </button>
            <button onClick={toggleItalic} className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive("italic") ? "text-violet-400 bg-slate-800/80" : "text-slate-400"}`}>
              <ItalicIcon className="h-3.5 w-3.5" />
            </button>
            <button onClick={toggleUnderline} className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive("underline") ? "text-violet-400 bg-slate-800/80" : "text-slate-400"}`}>
              <UnderlineIcon className="h-3.5 w-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Lists */}
            <button onClick={toggleBullet} className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive("bulletList") ? "text-violet-400 bg-slate-800/80" : "text-slate-400"}`}>
              <List className="h-3.5 w-3.5" />
            </button>
            <button onClick={toggleOrdered} className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive("orderedList") ? "text-violet-400 bg-slate-800/80" : "text-slate-400"}`}>
              <ListOrdered className="h-3.5 w-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            {/* Alignments */}
            <button onClick={(e) => setAlign(e, "left")} className={`p-1 rounded transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive({ textAlign: "left" }) ? "text-violet-400" : "text-slate-500"}`}><AlignLeft className="h-3.5 w-3.5" /></button>
            <button onClick={(e) => setAlign(e, "center")} className={`p-1 rounded transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive({ textAlign: "center" }) ? "text-violet-400" : "text-slate-500"}`}><AlignCenter className="h-3.5 w-3.5" /></button>
            <button onClick={(e) => setAlign(e, "right")} className={`p-1 rounded transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive({ textAlign: "right" }) ? "text-violet-400" : "text-slate-500"}`}><AlignRight className="h-3.5 w-3.5" /></button>
            <button onClick={(e) => setAlign(e, "justify")} className={`p-1 rounded transition-colors hover:bg-slate-800 cursor-pointer ${editor.isActive({ textAlign: "justify" }) ? "text-violet-400" : "text-slate-500"}`}><AlignJustify className="h-3.5 w-3.5" /></button>

            {/* More / Extends */}
            <button onClick={(e) => { e.preventDefault(); setShowMore(!showMore); }} className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 cursor-pointer ${showMore ? "text-violet-400 bg-slate-800/80" : "text-slate-450"}`}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Subscript / Superscript / Link secondary row */}
          {showMore && (
            <div className="flex items-center gap-2 border-t border-slate-800/50 pt-1.5 px-0.5 justify-start">
              <button onClick={toggleSubscript} className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer hover:bg-slate-800 ${editor.isActive("subscript") ? "text-violet-400 font-black" : "text-slate-400"}`}>
                x<sub>2</sub>
              </button>
              <button onClick={toggleSuperscript} className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer hover:bg-slate-800 ${editor.isActive("superscript") ? "text-violet-400 font-black" : "text-slate-400"}`}>
                x<sup>2</sup>
              </button>
              
              <div className="h-3.5 w-px bg-slate-800 mx-1" />
              
              <button onClick={handleLink} className={`p-1 rounded transition-colors hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-[10px] ${editor.isActive("link") ? "text-violet-400" : "text-slate-400"}`}>
                <Link2 className="h-3 w-3" />
                {editor.isActive("link") ? "Remove Link" : "Link"}
              </button>
            </div>
          )}
        </div>
      )}

      <EditorContent editor={editor} className={isBlock ? "w-full block text-inherit font-inherit" : "inline-block text-inherit font-inherit"} />
    </div>
  );
}
