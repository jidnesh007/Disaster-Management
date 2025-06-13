import mongoose from "mongoose";

const rescueOperationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "search-and-rescue",
        "medical-emergency",
        "fire-rescue",
        "water-rescue",
        "mountain-rescue",
        "urban-rescue",
        "disaster-response",
        "evacuation",
        "other",
      ],
    },
    category: {
      type: String,
      required: true,
      enum: [
        "emergency",
        "disaster",
        "medical",
        "fire",
        "water",
        "mountain",
        "urban",
        "training",
      ],
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "active",
        "in-progress",
        "completed",
        "cancelled",
        "suspended",
      ],
      default: "pending",
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
      area: {
        type: String, // e.g., "downtown", "residential area"
      },
      landmarks: [String],
      accessDetails: {
        type: String, // How to access the location
      },
    },
    requester: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: String,
      relationship: {
        type: String, // e.g., "victim", "witness", "family member"
      },
    },
    victims: [
      {
        name: String,
        age: Number,
        gender: {
          type: String,
          enum: ["male", "female", "other", "unknown"],
        },
        condition: {
          type: String,
          enum: ["stable", "injured", "critical", "unknown", "deceased"],
        },
        medicalInfo: String,
        location: String, // Specific location within the operation area
      },
    ],
    assignedVolunteers: [
      {
        volunteerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["leader", "member", "specialist", "support"],
          default: "member",
        },
        status: {
          type: String,
          enum: [
            "assigned",
            "en-route",
            "on-scene",
            "completed",
            "unavailable",
          ],
          default: "assigned",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        respondedAt: Date,
        completedAt: Date,
      },
    ],
    equipment: [
      {
        type: String,
        required: true,
      },
    ],
    requiredSkills: [
      {
        type: String,
        required: true,
      },
    ],
    estimatedDuration: {
      type: Number, // in minutes
    },
    actualDuration: {
      type: Number, // in minutes
    },
    weather: {
      conditions: String,
      temperature: Number,
      visibility: String,
      windSpeed: Number,
      warnings: [String],
    },
    hazards: [
      {
        type: String,
        description: String,
        severity: {
          type: String,
          enum: ["low", "medium", "high", "extreme"],
        },
      },
    ],
    updates: [
      {
        message: {
          type: String,
          required: true,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        type: {
          type: String,
          enum: [
            "status",
            "location",
            "personnel",
            "equipment",
            "communication",
            "other",
          ],
          default: "other",
        },
        date: {
          type: Date,
          default: Date.now,
        },
        attachments: [
          {
            filename: String,
            path: String,
            mimetype: String,
          },
        ],
      },
    ],
    timeline: [
      {
        event: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: String,
        recordedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    metrics: {
      responseTime: {
        type: Number, // minutes from creation to first responder
      },
      completionTime: {
        type: Number, // total minutes from start to completion
      },
      volunteersDeployed: {
        type: Number,
        default: 0,
      },
      equipmentUsed: [
        {
          item: String,
          quantity: Number,
        },
      ],
      successRate: {
        type: Number, // 0-100 percentage
      },
    },
    outcome: {
      status: {
        type: String,
        enum: ["successful", "partially-successful", "failed", "cancelled"],
      },
      victimsRescued: {
        type: Number,
        default: 0,
      },
      casualties: {
        type: Number,
        default: 0,
      },
      damageAssessment: String,
      lessonsLearned: String,
      recommendationsForFuture: String,
    },
    documents: [
      {
        name: String,
        type: {
          type: String,
          enum: ["report", "photo", "video", "map", "other"],
        },
        url: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coordinatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isTraining: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
rescueOperationSchema.index({ status: 1, priority: 1 });
rescueOperationSchema.index({ "location.coordinates": "2dsphere" });
rescueOperationSchema.index({ createdAt: -1 });
rescueOperationSchema.index({ type: 1, category: 1 });
rescueOperationSchema.index({ "assignedVolunteers.volunteerId": 1 });
rescueOperationSchema.index({ isActive: 1, status: 1 });

// Virtual for operation age
rescueOperationSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is overdue
rescueOperationSchema.virtual("isOverdue").get(function () {
  if (!this.estimatedDuration) return false;
  const estimatedEndTime =
    this.createdAt.getTime() + this.estimatedDuration * 60 * 1000;
  return Date.now() > estimatedEndTime && this.status !== "completed";
});

// Method to add timeline event
rescueOperationSchema.methods.addTimelineEvent = function (
  event,
  details,
  recordedBy
) {
  this.timeline.push({
    event,
    timestamp: new Date(),
    details,
    recordedBy,
  });
  return this.save();
};

// Method to update volunteer status
rescueOperationSchema.methods.updateVolunteerStatus = function (
  volunteerId,
  status
) {
  const volunteer = this.assignedVolunteers.find(
    (v) => v.volunteerId.toString() === volunteerId.toString()
  );

  if (volunteer) {
    volunteer.status = status;

    if (status === "en-route" && !volunteer.respondedAt) {
      volunteer.respondedAt = new Date();
    } else if (status === "completed" && !volunteer.completedAt) {
      volunteer.completedAt = new Date();
    }

    return this.save();
  }

  return Promise.reject(new Error("Volunteer not found in operation"));
};

// Method to calculate metrics
rescueOperationSchema.methods.calculateMetrics = function () {
  const now = new Date();
  const createdAt = this.createdAt;

  // Calculate response time (time to first volunteer responding)
  const firstResponse = this.assignedVolunteers
    .filter((v) => v.respondedAt)
    .sort((a, b) => a.respondedAt - b.respondedAt)[0];

  if (firstResponse) {
    this.metrics.responseTime = Math.round(
      (firstResponse.respondedAt - createdAt) / (1000 * 60)
    );
  }

  // Calculate completion time if operation is completed
  if (this.status === "completed") {
    this.metrics.completionTime = Math.round((now - createdAt) / (1000 * 60));
  }

  // Update volunteers deployed count
  this.metrics.volunteersDeployed = this.assignedVolunteers.length;

  return this.save();
};

// Static method to find nearby operations
rescueOperationSchema.statics.findNearby = function (
  latitude,
  longitude,
  maxDistance = 10000
) {
  return this.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance, // in meters
      },
    },
    isActive: true,
    status: { $in: ["pending", "active", "in-progress"] },
  });
};

// Static method to get operations by priority
rescueOperationSchema.statics.getByPriority = function (priority) {
  return this.find({
    priority,
    isActive: true,
    status: { $in: ["pending", "active", "in-progress"] },
  }).sort({ createdAt: -1 });
};

// Static method to get operations requiring skills
rescueOperationSchema.statics.getRequiringSkills = function (skills) {
  return this.find({
    requiredSkills: { $in: skills },
    isActive: true,
    status: { $in: ["pending", "active"] },
  }).sort({ priority: 1, createdAt: -1 });
};

// Pre-save middleware
rescueOperationSchema.pre("save", function (next) {
  // Add timeline event for status changes
  if (this.isModified("status") && !this.isNew) {
    this.timeline.push({
      event: `Status changed to ${this.status}`,
      timestamp: new Date(),
      details: `Operation status updated to ${this.status}`,
    });
  }

  // Calculate actual duration when completed
  if (this.status === "completed" && !this.actualDuration) {
    this.actualDuration = Math.round(
      (Date.now() - this.createdAt.getTime()) / (1000 * 60)
    );
  }

  next();
});

const RescueOperation = mongoose.model(
  "RescueOperation",
  rescueOperationSchema
);

export default RescueOperation;
