import { Schema, model, models } from "mongoose";

const CareerVaultSchema = new Schema({
  userId: { type: String, required: true, index: true },
  skills: [{
    name: { type: String, required: true },
    category: { type: String }, // e.g., Frontend, Cloud, Soft Skill
    proficiency: { type: String, enum: ["beginner", "intermediate", "expert"] }
  }],
  experience: [{
    company: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: String },
    endDate: { type: String },
    current: { type: Boolean, default: false },
    highlights: [{ type: String }], // Array of bullet points
    location: { type: String },
    tags: [{ type: String }]
  }],
  projects: [{
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String },
    technologies: [{ type: String }],
    highlights: [{ type: String }],
    startDate: { type: String },
    endDate: { type: String }
  }],
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    gpa: { type: String }
  }],
  certifications: [{
    name: { type: String, required: true },
    issuer: { type: String },
    issueDate: { type: String },
    expiryDate: { type: String },
    credentialUrl: { type: String }
  }],
  achievements: [{
    title: { type: String, required: true },
    description: { type: String },
    date: { type: String }
  }],
  languages: [{
    name: { type: String },
    proficiency: { type: String } // e.g., Native, Fluent, Conversational, Basic
  }],
  hackathons: [{
    name: { type: String },
    organizer: { type: String },
    year: { type: String },
    award: { type: String },
    role: { type: String },
    description: { type: String }
  }],
  leadership: [{
    role: { type: String },
    organization: { type: String },
    duration: { type: String },
    description: { type: String },
    impact: { type: String }
  }],
  publications: [{
    title: { type: String },
    publisher: { type: String },
    year: { type: String },
    url: { type: String },
    description: { type: String }
  }],
  volunteering: [{
    organization: { type: String },
    role: { type: String },
    duration: { type: String },
    description: { type: String }
  }],
  updatedAt: { type: Date, default: Date.now }
});

export const CareerVault = models.CareerVault || model("CareerVault", CareerVaultSchema);
