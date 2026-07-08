"use client";

import React, { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Mock message dispatched successfully!");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-850 rounded-3xl p-6 flex flex-col gap-4 text-left shadow-xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Your Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500" 
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500" 
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Subject</label>
        <input 
          type="text" 
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500" 
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Message</label>
        <textarea 
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white min-h-[80px] focus:outline-none focus:border-indigo-500" 
        />
      </div>
      <button 
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-xs transition-colors cursor-pointer"
      >
        Send Message
      </button>
    </form>
  );
}
