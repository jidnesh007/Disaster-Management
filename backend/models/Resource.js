import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "food",
        "water",
        "clothing",
        "medicine",
        "shelter",
        "medical_equipment",
        "other",
      ],
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "liters", "pieces", "boxes", "bottles", "packets", "units"],
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minimumThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    location: {
      facilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
        required: true,
      },
      facilityName: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["available", "low_stock", "out_of_stock", "expired"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update status based on stock levels
resourceSchema.pre("save", function (next) {
  if (this.currentStock === 0) {
    this.status = "out_of_stock";
    this.isUrgent = true;
  } else if (this.currentStock <= this.minimumThreshold) {
    this.status = "low_stock";
    this.isUrgent = true;
  } else {
    this.status = "available";
    this.isUrgent = false;
  }

  // Check expiry
  if (this.expiryDate && this.expiryDate <= new Date()) {
    this.status = "expired";
  }

  next();
});

// Index for efficient queries
resourceSchema.index({ category: 1, status: 1 });
resourceSchema.index({ "location.facilityId": 1 });
resourceSchema.index({ isUrgent: 1 });

export default mongoose.model("Resource", resourceSchema);
