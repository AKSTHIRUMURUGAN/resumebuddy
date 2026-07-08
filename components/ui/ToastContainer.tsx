"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useToastStore } from "@/store/toastStore";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    info: <Info className="h-5 w-5 text-indigo-400" />
  };

  const borders = {
    success: "border-emerald-500/20 bg-slate-900/95 shadow-emerald-500/5",
    error: "border-rose-500/20 bg-slate-900/95 shadow-rose-500/5",
    warning: "border-amber-500/20 bg-slate-900/95 shadow-amber-500/5",
    info: "border-indigo-500/20 bg-slate-900/95 shadow-indigo-500/5"
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className={`pointer-events-auto border rounded-2xl p-4 shadow-xl backdrop-blur-md flex gap-3 items-start justify-between ${borders[toast.type]}`}
          >
            <div className="flex gap-3 items-start">
              <div className="mt-0.5">{icons[toast.type]}</div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-bold text-white leading-tight">{toast.title}</span>
                <span className="text-slate-400 leading-normal text-[11px] whitespace-pre-wrap">{toast.message}</span>
              </div>
            </div>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white p-0.5 rounded-lg transition-colors cursor-pointer focus:outline-none"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
