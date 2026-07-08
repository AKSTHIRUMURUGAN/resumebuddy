import { Schema, model, models } from "mongoose";

const ATSReportSchema = new Schema({
  resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
  jobDescriptionId: { type: Schema.Types.ObjectId, ref: "JobDescription" }, 
  jobDescriptionText: { type: String },
  overallScore: { type: Number, required: true },
  breakdown: {
    atsScore: { type: Number },
    recruiterScore: { type: Number },
    contentScore: { type: Number },
    impactScore: { type: Number },
    keywordScore: { type: Number },
    readabilityScore: { type: Number },
    grammarScore: { type: Number }
  },
  missingKeywords: [{ type: String }],
  matchedKeywords: [{ type: String }],
  recruiterRedFlags: [{ type: String }],
  improvements: [{
    section: { type: String },
    issue: { type: String },
    suggestion: { type: String },
    autofixText: { type: String }
  }],
  recruiterSimulation: {
    atsScanner: { score: Number, feedback: [String], recommendation: String },
    hrRecruiter: { score: Number, feedback: [String], recommendation: String },
    hiringManager: { score: Number, feedback: [String], recommendation: String }
  },
  coverLetter: {
    coverLetter: { type: String },
    coldEmail: { type: String },
    linkedinMessage: { type: String }
  },
  interviewQuestions: {
    hr: [{ question: String, hint: String }],
    technical: [{ question: String, hint: String }],
    behavioral: [{ question: String, hint: String }]
  },
  linkedinOptimization: {
    score: { type: Number },
    critique: [{ type: String }],
    headlineOptions: [{ type: String }],
    aboutOptions: [{ type: String }]
  },
  createdAt: { type: Date, default: Date.now }
});

export const ATSReport = models.ATSReport || model("ATSReport", ATSReportSchema);
export default ATSReport;
