import mongoose from "mongoose";

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["warehouse", "hospital", "shelter", "distribution_center", "other"],
      default: "warehouse",
    },
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    contactInfo: {
      phone: String,
      email: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Facility", facilitySchema);