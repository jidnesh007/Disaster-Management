import express from "express";
import DonationRequest from "../models/DonationRequest.js";
import Donation from "../models/Donation.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all donation requests with filtering
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      status,
      urgencyLevel,
      category,
      facilityId,
      disasterType,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (urgencyLevel) filter.urgencyLevel = urgencyLevel;
    if (facilityId) filter.facilityId = facilityId;
    if (disasterType) filter["disaster.type"] = disasterType;
    if (category) filter["items.category"] = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [requests, total] = await Promise.all([
      DonationRequest.find(filter)
        .populate("requestedBy", "name email")
        .populate("facilityId", "name type contactInfo")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      DonationRequest.countDocuments(filter),
    ]);

    // Update fulfillment percentages
    for (const request of requests) {
      request.calculateFulfillment();
      await request.save();
    }

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching donation requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation requests",
    });
  }
});

// Create new donation request
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      facilityId,
      facilityInfo,
      title,
      description,
      items,
      urgencyLevel,
      targetDate,
      beneficiaries,
      disaster,
      visibility,
      tags,
      images,
    } = req.body;

    // Validate required fields
    if (
      !facilityId ||
      !title ||
      !description ||
      !items ||
      items.length === 0 ||
      !targetDate ||
      !beneficiaries
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate target date is in the future
    if (new Date(targetDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Target date must be in the future",
      });
    }

    const donationRequest = new DonationRequest({
      requestedBy: req.user.id,
      facilityId,
      facilityInfo,
      title,
      description,
      items,
      urgencyLevel: urgencyLevel || "medium",
      targetDate: new Date(targetDate),
      beneficiaries,
      disaster,
      visibility: visibility || "public",
      tags: tags || [],
      images: images || [],
    });

    await donationRequest.save();

    // Broadcast new request to WebSocket clients
    if (req.app.locals.wss) {
      const message = {
        type: "NEW_DONATION_REQUEST",
        data: {
          requestId: donationRequest._id,
          title: donationRequest.title,
          urgencyLevel: donationRequest.urgencyLevel,
          facilityName: donationRequest.facilityInfo.name,
          beneficiariesCount: donationRequest.beneficiaries.count,
          targetDate: donationRequest.targetDate,
          itemsNeeded: donationRequest.items.length,
          timestamp: new Date().toISOString(),
        },
      };

      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }

    res.status(201).json({
      success: true,
      data: donationRequest,
      message: "Donation request created successfully",
    });
  } catch (error) {
    console.error("Error creating donation request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create donation request",
    });
  }
});

// Get donation request by ID
router.get("/:id", async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id)
      .populate("requestedBy", "name email")
      .populate("facilityId", "name type contactInfo")
      .populate("donationsMade.donationId", "donorInfo status")
      .populate("updates.updatedBy", "name");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Donation request not found",
      });
    }

    // Increment view count
    request.metrics.totalViews += 1;
    await request.save();

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Error fetching donation request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation request",
    });
  }
});

// Update donation request
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Donation request not found",
      });
    }

    // Check if user is authorized to update
    if (
      request.requestedBy.toString() !== req.user.id &&
      req.user.role !== "coordinator"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this request",
      });
    }

    const allowedUpdates = [
      "title",
      "description",
      "items",
      "urgencyLevel",
      "targetDate",
      "tags",
      "images",
    ];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Validate target date if being updated
    if (updates.targetDate && new Date(updates.targetDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Target date must be in the future",
      });
    }

    Object.assign(request, updates);
    await request.save();

    res.json({
      success: true,
      data: request,
      message: "Donation request updated successfully",
    });
  } catch (error) {
    console.error("Error updating donation request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update donation request",
    });
  }
});

// Add update to donation request
router.post("/:id/updates", authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Update message is required",
      });
    }

    const request = await DonationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Donation request not found",
      });
    }

    request.updates.push({
      message,
      timestamp: new Date(),
      updatedBy: req.user.id,
    });

    await request.save();

    // Broadcast update to WebSocket clients
    if (req.app.locals.wss) {
      const updateMessage = {
        type: "DONATION_REQUEST_UPDATE",
        data: {
          requestId: request._id,
          title: request.title,
          updateMessage: message,
          updatedBy: req.user.name,
          timestamp: new Date().toISOString(),
        },
      };

      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(updateMessage));
        }
      });
    }

    res.json({
      success: true,
      data: request,
      message: "Update added successfully",
    });
  } catch (error) {
    console.error("Error adding update:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add update",
    });
  }
});

// Fulfill donation request items
router.post("/:id/fulfill", authenticateToken, async (req, res) => {
  try {
    const { donationId, items } = req.body;

    if (!donationId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Donation ID and items are required",
      });
    }

    const [request, donation] = await Promise.all([
      DonationRequest.findById(req.params.id),
      Donation.findById(donationId),
    ]);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Donation request not found",
      });
    }

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // Update request fulfillment
    items.forEach((item) => {
      const requestItem = request.items.find(
        (ri) =>
          ri.resourceName === item.resourceName && ri.category === item.category
      );

      if (requestItem) {
        requestItem.quantityFulfilled = Math.min(
          requestItem.quantityNeeded,
          requestItem.quantityFulfilled + item.quantity
        );
      }
    });

    // Add to donations made
    request.donationsMade.push({
      donationId: donation._id,
      donorName: donation.donorInfo.isAnonymous
        ? "Anonymous"
        : donation.donorInfo.name,
      items: items,
      receivedDate: new Date(),
    });

    // Update metrics
    request.metrics.totalDonors += 1;
    request.metrics.totalDonationsReceived += 1;
    request.calculateFulfillment();

    await request.save();

    res.json({
      success: true,
      data: request,
      message: "Donation request fulfilled successfully",
    });
  } catch (error) {
    console.error("Error fulfilling donation request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fulfill donation request",
    });
  }
});

// Get urgent donation requests
router.get("/urgent/active", async (req, res) => {
  try {
    const urgentRequests = await DonationRequest.find({
      status: { $in: ["active", "partially_fulfilled"] },
      urgencyLevel: { $in: ["high", "critical"] },
      targetDate: { $gte: new Date() },
    })
      .populate("facilityId", "name type")
      .sort({ urgencyLevel: -1, targetDate: 1 })
      .limit(20);

    res.json({
      success: true,
      data: urgentRequests,
      count: urgentRequests.length,
    });
  } catch (error) {
    console.error("Error fetching urgent requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch urgent requests",
    });
  }
});

// Get donation request statistics
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    const { facilityId, startDate, endDate } = req.query;

    const matchFilter = {};
    if (facilityId) matchFilter.facilityId = facilityId;
    if (startDate && endDate) {
      matchFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const [overallStats, urgencyStats, categoryStats] = await Promise.all([
      // Overall statistics
      DonationRequest.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            activeRequests: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
            fulfilledRequests: {
              $sum: { $cond: [{ $eq: ["$status", "fulfilled"] }, 1, 0] },
            },
            totalBeneficiaries: { $sum: "$beneficiaries.count" },
            averageFulfillment: { $avg: "$metrics.fulfillmentPercentage" },
          },
        },
      ]),

      // Urgency level breakdown
      DonationRequest.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: "$urgencyLevel",
            count: { $sum: 1 },
            averageFulfillment: { $avg: "$metrics.fulfillmentPercentage" },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Category breakdown
      DonationRequest.aggregate([
        { $match: matchFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.category",
            totalRequests: { $sum: 1 },
            totalQuantityNeeded: { $sum: "$items.quantityNeeded" },
            totalQuantityFulfilled: { $sum: "$items.quantityFulfilled" },
          },
        },
        {
          $project: {
            category: "$_id",
            totalRequests: 1,
            totalQuantityNeeded: 1,
            totalQuantityFulfilled: 1,
            fulfillmentRate: {
              $multiply: [
                {
                  $divide: ["$totalQuantityFulfilled", "$totalQuantityNeeded"],
                },
                100,
              ],
            },
          },
        },
        { $sort: { totalRequests: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        overview: overallStats[0] || {
          totalRequests: 0,
          activeRequests: 0,
          fulfilledRequests: 0,
          totalBeneficiaries: 0,
          averageFulfillment: 0,
        },
        urgencyBreakdown: urgencyStats,
        categoryBreakdown: categoryStats,
      },
    });
  } catch (error) {
    console.error("Error fetching donation request statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

// Delete donation request
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Donation request not found",
      });
    }

    // Check authorization
    if (
      request.requestedBy.toString() !== req.user.id &&
      req.user.role !== "coordinator"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this request",
      });
    }

    // Only allow deletion if no donations have been made
    if (request.donationsMade.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete request with existing donations",
      });
    }

    await DonationRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Donation request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting donation request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete donation request",
    });
  }
});

export default router;
