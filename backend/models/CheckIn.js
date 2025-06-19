import mongoose from "mongoose";

const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["SAFE", "NEEDS_HELP", "INJURED", "MISSING"],
    required: true,
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  message: String,
  notifiedContacts: [
    {
      contactId: String,
      name: String,
      phone: String,
      email: String,
      notifiedAt: { type: Date, default: Date.now },
    },
  ],
  isPublic: { type: Boolean, default: false }, // For community check-ins
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("CheckIn", checkInSchema);
