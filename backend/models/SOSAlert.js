import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
  },
  message: String,
  urgencyLevel: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "HIGH",
  },
  status: {
    type: String,
    enum: ["ACTIVE", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"],
    default: "ACTIVE",
  },
  rescueTeamAssigned: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  estimatedArrival: Date,
  createdAt: { type: Date, default: Date.now },
  acknowledgedAt: Date,
  resolvedAt: Date,
  notes: String,
});

export default mongoose.model("SOSAlert", sosAlertSchema);
