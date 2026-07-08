import { Schema, model, models } from "mongoose";

const ResumeSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true }, // e.g., "Software Engineer - Backend"
  templateId: { type: String, default: "minimal" }, // minimal, modern, corporate, creative, tech, executive
  targetRole: { type: String },
  personalInfo: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    website: { type: String },
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    summary: { type: String }
  },
  skills: { type: Schema.Types.Mixed, default: [] },
  experience: [{
    company: { type: String },
    position: { type: String },
    duration: { type: String },
    location: { type: String },
    highlights: [{ type: String }], // custom edited TipTap bullets
    contentHtml: { type: String }
  }],
  projects: [{
    title: { type: String },
    technologies: [{ type: String }],
    highlights: [{ type: String }],
    url: { type: String },
    contentHtml: { type: String }
  }],
  education: [{
    institution: { type: String },
    degree: { type: String },
    duration: { type: String },
    gpa: { type: String },
    contentHtml: { type: String }
  }],
  certifications: [{ type: String }],
  achievements: [{ type: String }],
  languages: [{ type: String }],
  formatting: {
    fontFamily: { type: String, default: "Inter" },
    fontSize: { type: Number, default: 11 },
    lineHeight: { type: Number, default: 1.2 },
    margins: { type: Number, default: 0.75 }, // in inches
    colorScheme: { type: String, default: "classic" },
    sectionVisibility: { type: Map, of: Boolean, default: {} }
  },
  customSections: [{
    heading: { type: String },
    items: [{ type: String }]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Resume = models.Resume || model("Resume", ResumeSchema);
