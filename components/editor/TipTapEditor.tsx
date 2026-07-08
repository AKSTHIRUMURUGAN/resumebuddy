"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect } from "react";

interface TipTapEditorProps {
  content: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function TipTapEditor({ content, onChange, placeholder }: TipTapEditorProps) {
  const editor = useEditor({
    // This component is always rendered client-side only ("use client" + inside dynamic panels)
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[120px] text-sm leading-relaxed p-4 bg-slate-950 border border-slate-800 rounded-xl text-white w-full",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getText() && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return <EditorContent editor={editor} />;
}
