import express from "express";
import { authenticateToken, authorize } from "../middleware/auth.js";
import User from "../models/User.js";
import RescueOperation from "../models/RescueOperation.js";

const router = express.Router();

// Update volunteer availability
router.patch(
  "/availability",
  authenticateToken,
  authorize("volunteer"),
  async (req, res) => {
    try {
      const { isAvailable } = req.body;
      if (typeof isAvailable !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isAvailable must be a boolean",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          isAvailable,
          lastAvailabilityUpdate: new Date(),
        },
        { new: true }
      );

      res.json({
        success: true,
        message: `You are now ${
          isAvailable ? "available" : "unavailable"
        } for rescue operations`,
        data: { isAvailable: user.isAvailable },
      });
    } catch (error) {
      console.error("Availability update error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Get volunteer's assigned operations with enhanced details
router.get(
  "/my-operations",
  authenticateToken,
  authorize("volunteer"),
  async (req, res) => {
    try {
      const { status, priority, limit = 10, page = 1 } = req.query;

      let query = { "assignedVolunteers.volunteerId": req.user._id };

      if (status) {
        query.status = status;
      }
      if (priority) {
        query.priority = priority;
      }

      const operations = await RescueOperation.find(query)
        .select(
          "title description location status priority category createdAt assignedVolunteers updates estimatedDuration equipment contactInfo weatherConditions teamSize"
        )
        .populate("createdBy", "name email")
        .sort({ priority: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      // Add volunteer-specific info
      const enhancedOperations = operations.map((op) => {
        const volunteerAssignment = op.assignedVolunteers.find(
          (v) => v.volunteerId.toString() === req.user._id.toString()
        );

        return {
          ...op.toObject(),
          volunteerRole: volunteerAssignment?.role || "Member",
          volunteerStatus: volunteerAssignment?.status || "assigned",
          assignedAt: volunteerAssignment?.assignedAt || new Date(),
          weatherConditions: op.weatherConditions || "Clear, 45°F", // Mock if not available
          equipment: op.equipment || ["GPS", "Radio"], // Mock
          teamSize: op.teamSize || 8, // Mock
          contactInfo: op.contactInfo || {
            primary: { name: "Coordinator", phone: "+1-555-0000" },
          }, // Mock
          updates: op.updates.length,
        };
      });

      res.json({
        success: true,
        data: enhancedOperations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: await RescueOperation.countDocuments(query),
        },
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

// Get volunteer statistics
router.get(
  "/my-stats",
  authenticateToken,
  authorize("volunteer"),
  async (req, res) => {
    try {
      const volunteerId = req.user._id;

      const stats = await RescueOperation.aggregate([
        { $match: { "assignedVolunteers.volunteerId": volunteerId } },
        {
          $group: {
            _id: null,
            totalOperations: { $sum: 1 },
            completedOperations: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            activeOperations: {
              $sum: {
                $cond: [{ $in: ["$status", ["active", "in-progress"]] }, 1, 0],
              },
            },
            totalHours: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "completed"] },
                  { $divide: ["$metrics.completionTime", 60] },
                  0,
                ],
              },
            },
            averageResponseTime: { $avg: "$metrics.responseTime" },
            highPriorityOperations: {
              $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
            },
          },
        },
      ]);

      const result = stats[0] || {
        totalOperations: 0,
        completedOperations: 0,
        activeOperations: 0,
        totalHours: 0,
        averageResponseTime: 0,
        highPriorityOperations: 0,
      };

      res.json({
        success: true,
        data: {
          ...result,
          hoursVolunteered: Math.round(result.totalHours || 0),
          completionRate:
            result.totalOperations > 0
              ? Math.round(
                  (result.completedOperations / result.totalOperations) * 100
                )
              : 0,
          livesImpacted: result.completedOperations * 5, // Mock
          badgesEarned: req.user.badges?.length || 0, // From user
          rating: req.user.rating || 4.8, // From user
        },
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

// Update operation status by volunteer
router.patch(
  "/operations/:id/status",
  authenticateToken,
  authorize("volunteer"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, message } = req.body;

      const validStatuses = [
        "acknowledged",
        "en-route",
        "on-scene",
        "completed",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const operation = await RescueOperation.findOne({
        _id: id,
        "assignedVolunteers.volunteerId": req.user._id,
      });

      if (!operation) {
        return res.status(404).json({
          success: false,
          message: "Operation not found or not assigned to you",
        });
      }

      // Update volunteer status in the operation
      const volunteerIndex = operation.assignedVolunteers.findIndex(
        (v) => v.volunteerId.toString() === req.user._id.toString()
      );

      operation.assignedVolunteers[volunteerIndex].status = status;

      // Add update log
      operation.updates.push({
        message:
          message || `Volunteer ${req.user.name} updated status to ${status}`,
        updatedBy: req.user._id,
        type: "status",
      });

      await operation.save();

      res.json({
        success: true,
        message: "Status updated successfully",
        data: operation.assignedVolunteers[volunteerIndex],
      });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Get nearby operations (for map view)
router.get(
  "/nearby",
  authenticateToken,
  authorize("volunteer"),
  async (req, res) => {
    try {
      const { lat, lng, radius = 50 } = req.query; // radius in km

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude are required",
        });
      }

      const operations = await RescueOperation.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: radius * 1000, // convert to meters
          },
        },
        status: { $in: ["pending", "active"] },
      })
        .select("title location status priority category")
        .limit(20);

      res.json({
        success: true,
        data: operations,
      });
    } catch (error) {
      console.error("Fetch nearby operations error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

// Admin: Create operation with enhanced details
router.post(
  "/operations",
  authenticateToken,
  authorize("admin"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        location,
        priority,
        category,
        assignedVolunteerIds,
        estimatedDuration,
        requiredSkills,
        contactInfo,
        equipment,
        teamSize,
        weatherConditions,
      } = req.body;

      if (!title || !location || !location.name || !location.coordinates) {
        return res.status(400).json({
          success: false,
          message: "Title and location details are required",
        });
      }

      const operation = new RescueOperation({
        title,
        description,
        priority: priority || "medium",
        category: category || "other",
        location: {
          type: "Point",
          coordinates: location.coordinates,
          name: location.name,
          address: location.address,
        },
        assignedVolunteers:
          assignedVolunteerIds?.map((id) => ({
            volunteerId: id,
            role: "member",
            status: "assigned",
          })) || [],
        createdBy: req.user._id,
        estimatedDuration: estimatedDuration || 480,
        requiredSkills: requiredSkills || [],
        contactInfo,
        equipment: equipment || [],
        teamSize: teamSize || 8,
        weatherConditions: weatherConditions || "Clear, 45°F",
      });

      await operation.save();

      // Calculate initial response time metric
      if (assignedVolunteerIds?.length > 0) {
        operation.metrics.responseTime = 0; // Immediate assignment
        await operation.save();
      }

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

// Admin: Get available volunteers with skills
router.get(
  "/available-volunteers",
  authenticateToken,
  authorize("admin"),
  async (req, res) => {
    try {
      const { skills, location, radius = 50 } = req.query;

      let query = {
        role: "volunteer",
        isAvailable: true,
      };

      // Filter by skills if provided
      if (skills) {
        const skillsArray = skills.split(",");
        query.skills = { $in: skillsArray };
      }

      let volunteers = await User.find(query)
        .select("name email phone skills location lastSeen")
        .sort({ lastSeen: -1 });

      // If location is provided, sort by distance
      if (location && location.coordinates) {
        volunteers = await User.aggregate([
          { $match: query },
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: location.coordinates,
              },
              distanceField: "distance",
              maxDistance: radius * 1000,
              spherical: true,
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              phone: 1,
              skills: 1,
              distance: { $round: [{ $divide: ["$distance", 1000] }, 2] },
            },
          },
        ]);
      }

      res.json({
        success: true,
        data: volunteers,
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

export default router;
