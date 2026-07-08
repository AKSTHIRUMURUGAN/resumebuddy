import { Schema, model, models } from "mongoose";

const ResumeVersionSchema = new Schema({
  resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
  versionNumber: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true }, // Complete snapshot of Resume model content
  changesSummary: { type: String }, // e.g., "Updated experience metrics, added Redis"
  createdAt: { type: Date, default: Date.now }
});

export const ResumeVersion = models.ResumeVersion || model("ResumeVersion", ResumeVersionSchema);
