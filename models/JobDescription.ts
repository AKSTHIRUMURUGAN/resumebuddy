import { Schema, model, models } from "mongoose";

const JobDescriptionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String },
  company: { type: String },
  rawText: { type: String, required: true },
  extractedKeywords: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export const JobDescription = models.JobDescription || model("JobDescription", JobDescriptionSchema);
