import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  uid: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photoURL: { type: String },
  provider: { type: String, default: "google" },
  subscription: {
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    status: { type: String, enum: ["active", "inactive", "paused"], default: "inactive" },
    razorpaySubscriptionId: { type: String },
    expiryDate: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = models.User || model("User", UserSchema);
