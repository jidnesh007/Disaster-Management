import mongoose from "mongoose";

const donationItemSchema = new mongoose.Schema({
  resourceName: {
    type: String,
    required: true,
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
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
    required: true,
    enum: ["kg", "liters", "pieces", "boxes", "bottles", "packets", "units"],
  },
  condition: {
    type: String,
    enum: ["new", "good", "fair", "poor"],
    default: "good",
  },
  expiryDate: {
    type: Date,
  },
});

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    donorInfo: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      isAnonymous: {
        type: Boolean,
        default: false,
      },
    },
    donationType: {
      type: String,
      enum: ["resource", "monetary"],
      required: true,
    },
    // For resource donations
    items: [donationItemSchema],
    // For monetary donations
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    targetFacility: {
      facilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
      },
      facilityName: String,
      address: String,
    },
    pickupLocation: {
      address: {
        type: String,
        required: function () {
          return this.donationType === "resource";
        },
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
      contactPerson: String,
      contactPhone: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "collected",
        "in_transit",
        "delivered",
        "rejected",
        "cancelled",
      ],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    scheduledPickup: {
      date: Date,
      timeSlot: String,
      assignedVolunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    delivery: {
      deliveredDate: Date,
      receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      deliveryNotes: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    images: [
      {
        url: String,
        description: String,
      },
    ],
    tracking: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
      },
    ],
    receipt: {
      receiptNumber: {
        type: String,
        unique: true,
      },
      issuedDate: Date,
      taxDeductible: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Generate receipt number
donationSchema.pre("save", function (next) {
  if (!this.receipt.receiptNumber && this.status === "delivered") {
    this.receipt.receiptNumber = `DON-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;
    this.receipt.issuedDate = new Date();
  }
  next();
});

// Add tracking entry when status changes
donationSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.tracking.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

// Indexes for efficient queries
donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ status: 1, priority: -1 });
donationSchema.index({ "targetFacility.facilityId": 1 });
donationSchema.index({ donationType: 1 });

export default mongoose.model("Donation", donationSchema);
