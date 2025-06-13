import express from "express";
import { authenticateToken, authorize } from "../middleware/auth.js";
import RescueOperation from "../models/RescueOperation.js";
import User from "../models/User.js";
import Communication from "../models/Communication.js";
import Report from "../models/Report.js";

// Debug log to confirm Communication model import
console.log("Imported Communication model:", Communication);

const router = express.Router();

// Get all operations
router.get(
  "/operations",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const operations = await RescueOperation.find()
        .populate("assignedVolunteers.volunteerId", "name email")
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: operations,
      });
    } catch (error) {
      console.error("Fetch operations error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Create new operation
router.post(
  "/operations",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        location,
        priority,
        estimatedDuration,
        teamSize,
        requiredSkills,
        equipment,
        weatherConditions,
        riskLevel,
      } = req.body;

      if (!title || !description || !location?.name) {
        return res.status(400).json({
          success: false,
          message: "Title, description, and location are required",
        });
      }

      const operation = new RescueOperation({
        title,
        description,
        location,
        priority: priority || "medium",
        estimatedDuration: estimatedDuration || 60,
        teamSize: teamSize || 1,
        requiredSkills: requiredSkills || [],
        equipment: equipment || [],
        weatherConditions: weatherConditions || "",
        riskLevel: riskLevel || "low",
        createdBy: req.user._id,
        updates: [
          {
            message: "Operation created",
            updatedBy: req.user._id,
            type: "creation",
            date: new Date(),
          },
        ],
      });

      await operation.save();

      res.status(201).json({
        success: true,
        message: "Operation created successfully",
        data: operation,
      });
    } catch (error) {
      console.error("Create operation error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Get notifications (communications for the coordinator)
router.get(
  "/notifications",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const notifications = await Communication.find({
        recipients: req.user._id,
      })
        .populate("operationId", "title")
        .populate("sentBy", "name")
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("Fetch notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Get all volunteers with enhanced details
router.get(
  "/volunteers",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const volunteers = await User.find({
        role: "volunteer",
        isActive: true,
      })
        .select(
          "name email phone skills location isAvailable status lastSeen badges rating"
        )
        .sort({ lastSeen: -1 });

      const enhancedVolunteers = await Promise.all(
        volunteers.map(async (volunteer) => {
          const stats = await RescueOperation.aggregate([
            { $match: { "assignedVolunteers.volunteerId": volunteer._id } },
            {
              $group: {
                _id: null,
                totalOperations: { $sum: 1 },
                completedOperations: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                avgResponseTime: { $avg: "$metrics.responseTime" },
              },
            },
          ]);

          return {
            ...volunteer.toObject(),
            stats: stats[0] || {
              totalOperations: 0,
              completedOperations: 0,
              avgResponseTime: 0,
            },
          };
        })
      );

      res.json({
        success: true,
        data: enhancedVolunteers,
      });
    } catch (error) {
      console.error("Fetch volunteers error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Get coordinator statistics
router.get(
  "/stats",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const [operationStats, volunteerStats] = await Promise.all([
        RescueOperation.aggregate([
          {
            $group: {
              _id: null,
              totalOperations: { $sum: 1 },
              activeOperations: {
                $sum: {
                  $cond: [
                    { $in: ["$status", ["active", "in-progress"]] },
                    1,
                    0,
                  ],
                },
              },
              completedOperations: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
              avgResponseTime: { $avg: "$metrics.responseTime" },
            },
          },
        ]),
        User.aggregate([
          { $match: { role: "volunteer", isActive: true } },
          {
            $group: {
              _id: null,
              totalVolunteers: { $sum: 1 },
              availableVolunteers: {
                $sum: { $cond: [{ $eq: ["$isAvailable", true] }, 1, 0] },
              },
            },
          },
        ]),
      ]);

      const stats = {
        ...operationStats[0],
        ...volunteerStats[0],
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Fetch stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Update operation status
router.put(
  "/operations/:id/status",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = [
        "pending",
        "active",
        "in-progress",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const operation = await RescueOperation.findByIdAndUpdate(
        id,
        {
          status,
          $push: {
            updates: {
              message: `Operation status changed to ${status}`,
              updatedBy: req.user._id,
              type: "status",
              date: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!operation) {
        return res.status(404).json({
          success: false,
          message: "Operation not found",
        });
      }

      res.json({
        success: true,
        message: "Operation status updated successfully",
        data: operation,
      });
    } catch (error) {
      console.error("Update operation status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Communication routes
router.get(
  "/communications",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      // Debug log to confirm Communication is available in the route
      console.log(
        "Using Communication model in /communications route:",
        Communication
      );
      if (!Communication) {
        throw new Error("Communication model is undefined");
      }

      const communications = await Communication.find()
        .populate("operationId", "title")
        .populate("sentBy", "name")
        .sort({ createdAt: -1 })
        .limit(50);

      const formattedCommunications = communications.map((comm) => ({
        ...comm.toObject(),
        operationTitle: comm.operationId?.title || "Unknown Operation",
      }));

      res.json({
        success: true,
        data: formattedCommunications,
      });
    } catch (error) {
      console.error("Fetch communications error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.post(
  "/communications",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const { operationId, message, type, priority } = req.body;

      if (!operationId || !message) {
        return res.status(400).json({
          success: false,
          message: "Operation ID and message are required",
        });
      }

      const operation = await RescueOperation.findById(operationId);
      if (!operation) {
        return res.status(404).json({
          success: false,
          message: "Operation not found",
        });
      }

      const communication = new Communication({
        operationId,
        message,
        type: type || "update",
        priority: priority || "normal",
        sentBy: req.user._id,
        recipients: operation.assignedVolunteers.map((v) => v.volunteerId),
      });

      await communication.save();

      operation.updates.push({
        message: `Message sent: ${message}`,
        updatedBy: req.user._id,
        type: "communication",
        date: new Date(),
      });
      await operation.save();

      const populatedComm = await Communication.findById(communication._id)
        .populate("operationId", "title")
        .populate("sentBy", "name");

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: {
          ...populatedComm.toObject(),
          operationTitle: populatedComm.operationId.title,
        },
      });
    } catch (error) {
      console.error("Send communication error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Reports routes
router.get(
  "/reports",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const reports = await Report.find()
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error("Fetch reports error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.post(
  "/reports/generate",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const { operationId, reportType } = req.body;

      let reportData = {};
      let title = "";

      switch (reportType) {
        case "operations-summary":
          title = "Operations Summary Report";
          reportData = await generateOperationsSummary();
          break;
        case "volunteer-performance":
          title = "Volunteer Performance Report";
          reportData = await generateVolunteerPerformance();
          break;
        case "resource-utilization":
          title = "Resource Utilization Report";
          reportData = await generateResourceUtilization();
          break;
        case "monthly-analytics":
          title = "Monthly Analytics Report";
          reportData = await generateMonthlyAnalytics();
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid report type",
          });
      }

      const report = new Report({
        title,
        type: reportType,
        data: reportData,
        createdBy: req.user._id,
        operationId: operationId || null,
      });

      await report.save();

      res.status(201).json({
        success: true,
        message: "Report generated successfully",
        data: report,
      });
    } catch (error) {
      console.error("Generate report error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Helper functions for report generation
async function generateOperationsSummary() {
  const summary = await RescueOperation.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgDuration: { $avg: "$metrics.completionTime" },
        totalVolunteers: { $sum: { $size: "$assignedVolunteers" } },
      },
    },
  ]);

  const totalOps = await RescueOperation.countDocuments();
  const recentOps = await RescueOperation.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("title status priority createdAt");

  return {
    summary,
    totalOperations: totalOps,
    recentOperations: recentOps,
    generatedAt: new Date(),
  };
}

async function generateVolunteerPerformance() {
  const performance = await User.aggregate([
    { $match: { role: "volunteer" } },
    {
      $lookup: {
        from: "rescueoperations",
        localField: "_id",
        foreignField: "assignedVolunteers.volunteerId",
        as: "operations",
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        totalOperations: { $size: "$operations" },
        completedOperations: {
          $size: {
            $filter: {
              input: "$operations",
              cond: { $eq: ["$$this.status", "completed"] },
            },
          },
        },
        rating: { $ifNull: ["$rating", 0] },
        badges: { $size: { $ifNull: ["$badges", []] } },
      },
    },
    { $sort: { totalOperations: -1 } },
    { $limit: 50 },
  ]);

  return {
    volunteers: performance,
    topPerformers: performance.slice(0, 10),
    generatedAt: new Date(),
  };
}

async function generateResourceUtilization() {
  const utilization = await RescueOperation.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        avgVolunteers: { $avg: { $size: "$assignedVolunteers" } },
        avgDuration: { $avg: "$metrics.completionTime" },
      },
    },
  ]);

  const equipmentUsage = await RescueOperation.aggregate([
    { $unwind: "$equipment" },
    { $group: { _id: "$equipment", usage: { $sum: 1 } } },
    { $sort: { usage: -1 } },
  ]);

  return {
    categoryUtilization: utilization,
    equipmentUsage,
    generatedAt: new Date(),
  };
}

async function generateMonthlyAnalytics() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const analytics = await RescueOperation.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
        avgDuration: { $avg: "$metrics.completionTime" },
        totalVolunteers: { $sum: { $size: "$assignedVolunteers" } },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
    },
  ]);

  const topVolunteers = await User.aggregate([
    {
      $lookup: {
        from: "rescueoperations",
        localField: "_id",
        foreignField: "assignedVolunteers.volunteerId",
        as: "operations",
      },
    },
    {
      $match: {
        "operations.createdAt": { $gte: thirtyDaysAgo },
      },
    },
    {
      $project: {
        name: 1,
        totalOperations: { $size: "$operations" },
      },
    },
    { $sort: { totalOperations: -1 } },
    { $limit: 5 },
  ]);

  return {
    dailyAnalytics: analytics,
    topVolunteers,
    generatedAt: new Date(),
  };
}

// Assign volunteers to operation
router.post(
  "/operations/:id/assign",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { volunteerIds, roles } = req.body;

      if (!volunteerIds || !Array.isArray(volunteerIds)) {
        return res.status(400).json({
          success: false,
          message: "Volunteer IDs array is required",
        });
      }

      const operation = await RescueOperation.findById(id);
      if (!operation) {
        return res.status(404).json({
          success: false,
          message: "Operation not found",
        });
      }

      const volunteers = await User.find({
        _id: { $in: volunteerIds },
        role: "volunteer",
        isAvailable: true,
      });

      if (volunteers.length !== volunteerIds.length) {
        return res.status(400).json({
          success: false,
          message: "Some volunteers are not available or don't exist",
        });
      }

      const newAssignments = volunteerIds.map((volunteerId, index) => ({
        volunteerId,
        role: roles?.[index] || "member",
        status: "assigned",
        assignedAt: new Date(),
      }));

      operation.assignedVolunteers.push(...newAssignments);

      operation.updates.push({
        message: `${volunteers.length} volunteers assigned to operation`,
        updatedBy: req.user._id,
        type: "assignment",
        date: new Date(),
      });

      await operation.save();

      res.json({
        success: true,
        message: "Volunteers assigned successfully",
        data: operation,
      });
    } catch (error) {
      console.error("Assign volunteers error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Remove volunteer from operation
router.delete(
  "/operations/:id/volunteers/:volunteerId",
  authenticateToken,
  authorize("coordinator"),
  async (req, res) => {
    try {
      const { id, volunteerId } = req.params;

      const operation = await RescueOperation.findById(id);
      if (!operation) {
        return res.status(404).json({
          success: false,
          message: "Operation not found",
        });
      }

      const volunteerIndex = operation.assignedVolunteers.findIndex(
        (v) => v.volunteerId.toString() === volunteerId
      );

      if (volunteerIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Volunteer not assigned to this operation",
        });
      }

      operation.assignedVolunteers.splice(volunteerIndex, 1);

      operation.updates.push({
        message: "Volunteer removed from operation",
        updatedBy: req.user._id,
        type: "unassignment",
        date: new Date(),
      });

      await operation.save();

      res.json({
        success: true,
        message: "Volunteer removed successfully",
        data: operation,
      });
    } catch (error) {
      console.error("Remove volunteer error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

export default router;
