import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "operations-summary",
        "volunteer-performance",
        "resource-utilization",
        "response-time",
        "incident-analysis",
        "financial-summary",
        "equipment-maintenance",
        "training-completion",
        "custom",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    operationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RescueOperation",
      default: null,
    },
    dateRange: {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
    },
    status: {
      type: String,
      enum: ["generating", "completed", "failed", "archived"],
      default: "completed",
    },
    format: {
      type: String,
      enum: ["json", "pdf", "excel", "csv"],
      default: "json",
    },
    fileUrl: {
      type: String, // For generated file downloads
    },
    metadata: {
      generationTime: {
        type: Number, // Time taken to generate in milliseconds
      },
      recordCount: {
        type: Number,
      },
      filters: {
        type: mongoose.Schema.Types.Mixed,
      },
      parameters: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    visibility: {
      type: String,
      enum: ["private", "team", "organization", "public"],
      default: "team",
    },
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permission: {
          type: String,
          enum: ["view", "edit", "admin"],
          default: "view",
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    scheduledRegeneration: {
      enabled: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly"],
      },
      nextRun: Date,
      lastRun: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
reportSchema.index({ type: 1, createdAt: -1 });
reportSchema.index({ createdBy: 1, createdAt: -1 });
reportSchema.index({ operationId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ "dateRange.startDate": 1, "dateRange.endDate": 1 });

// Virtual for age of report
reportSchema.virtual("age").get(function () {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for formatted date range
reportSchema.virtual("formattedDateRange").get(function () {
  if (!this.dateRange?.startDate) return "All time";

  const start = this.dateRange.startDate.toLocaleDateString();
  const end = this.dateRange.endDate
    ? this.dateRange.endDate.toLocaleDateString()
    : "Present";

  return `${start} - ${end}`;
});

// Method to check if user has access to report
reportSchema.methods.hasAccess = function (
  userId,
  requiredPermission = "view"
) {
  // Report creator always has access
  if (this.createdBy.toString() === userId.toString()) {
    return true;
  }

  // Check visibility
  if (this.visibility === "public") {
    return true;
  }

  // Check if explicitly shared
  const sharedEntry = this.sharedWith.find(
    (entry) => entry.userId.toString() === userId.toString()
  );

  if (sharedEntry) {
    const permissions = ["view", "edit", "admin"];
    const userPermissionLevel = permissions.indexOf(sharedEntry.permission);
    const requiredPermissionLevel = permissions.indexOf(requiredPermission);

    return userPermissionLevel >= requiredPermissionLevel;
  }

  return false;
};

// Method to share report with user
reportSchema.methods.shareWith = function (userId, permission = "view") {
  const existingShare = this.sharedWith.find(
    (entry) => entry.userId.toString() === userId.toString()
  );

  if (existingShare) {
    existingShare.permission = permission;
    existingShare.sharedAt = new Date();
  } else {
    this.sharedWith.push({
      userId,
      permission,
      sharedAt: new Date(),
    });
  }

  return this.save();
};

// Static method to get reports accessible by user
reportSchema.statics.getAccessibleReports = function (userId, options = {}) {
  const query = {
    $or: [
      { createdBy: userId },
      { visibility: "public" },
      { "sharedWith.userId": userId },
    ],
    isArchived: { $ne: true },
  };

  if (options.type) {
    query.type = options.type;
  }

  if (options.operationId) {
    query.operationId = options.operationId;
  }

  return this.find(query)
    .populate("createdBy", "name")
    .populate("operationId", "title")
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get report statistics
reportSchema.statics.getStatistics = async function (userId) {
  const [totalReports, reportsByType, recentReports] = await Promise.all([
    this.countDocuments({ createdBy: userId, isArchived: { $ne: true } }),
    this.aggregate([
      {
        $match: {
          createdBy: mongoose.Types.ObjectId(userId),
          isArchived: { $ne: true },
        },
      },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.find({ createdBy: userId, isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title type createdAt"),
  ]);

  return {
    totalReports,
    reportsByType,
    recentReports,
  };
};

// Pre-save middleware
reportSchema.pre("save", function (next) {
  if (this.isNew) {
    // Set default date range if not provided
    if (!this.dateRange?.startDate) {
      this.dateRange = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(),
      };
    }
  }

  // Archive old reports automatically
  if (this.isModified("isArchived") && this.isArchived) {
    this.archivedAt = new Date();
  }

  next();
});

const Report = mongoose.model("Report", reportSchema);

export default Report;
