import mongoose from "mongoose";

console.log("Communication.js is being loaded");

const communicationSchema = new mongoose.Schema(
  {
    operationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RescueOperation",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["update", "alert", "instruction", "notification"],
      default: "update",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
      },
    ],
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
    metadata: {
      channel: {
        type: String,
        enum: ["system", "email", "sms", "push"],
        default: "system",
      },
      deliveryAttempts: {
        type: Number,
        default: 0,
      },
      lastDeliveryAttempt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes and methods remain the same as in your original code
communicationSchema.index({ operationId: 1, createdAt: -1 });
communicationSchema.index({ sentBy: 1, createdAt: -1 });
communicationSchema.index({ recipients: 1, createdAt: -1 });
communicationSchema.index({ priority: 1, status: 1 });

communicationSchema.virtual("unreadCount").get(function () {
  return this.recipients.length - this.readBy.length;
});

communicationSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some(
    (read) => read.userId.toString() === userId.toString()
  );
  if (!alreadyRead) {
    this.readBy.push({
      userId: userId,
      readAt: new Date(),
    });
  }
  return this.save();
};

communicationSchema.statics.getUnreadForUser = function (userId) {
  return this.find({
    recipients: userId,
    "readBy.userId": { $ne: userId },
  })
    .populate("operationId", "title priority")
    .populate("sentBy", "name")
    .sort({ createdAt: -1 });
};

communicationSchema.statics.getForOperation = function (operationId) {
  return this.find({ operationId })
    .populate("sentBy", "name role")
    .populate("recipients", "name")
    .sort({ createdAt: -1 });
};

// Export as a factory function to avoid circular dependencies
export default () => mongoose.model("Communication", communicationSchema);
