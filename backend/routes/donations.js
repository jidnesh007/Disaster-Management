// routes/donations.js
import express from "express";
import Donation from "../models/Donation.js";
import DonationRequest from "../models/DonationRequest.js";
import Resource from "../models/Resource.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all donations with filtering
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      donorId,
      status,
      donationType,
      facilityId,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (donorId) filter.donorId = donorId;
    if (status) filter.status = status;
    if (donationType) filter.donationType = donationType;
    if (facilityId) filter["targetFacility.facilityId"] = facilityId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [donations, total] = await Promise.all([
      Donation.find(filter)
        .populate("donorId", "name email")
        .populate("targetFacility.facilityId", "name type")
        .populate("scheduledPickup.assignedVolunteer", "name phone")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit)),
      Donation.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        donations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donations",
    });
  }
});

// Create new donation
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      donationType,
      items,
      amount,
      targetFacility,
      pickupLocation,
      notes,
      images,
    } = req.body;

    // Validate required fields
    if (!donationType) {
      return res.status(400).json({
        success: false,
        message: "Donation type is required",
      });
    }

    if (donationType === "resource" && (!items || items.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Items are required for resource donations",
      });
    }

    if (donationType === "monetary" && (!amount || amount <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required for monetary donations",
      });
    }

    const donation = new Donation({
      donorId: req.user.id,
      donorInfo: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        isAnonymous: req.body.isAnonymous || false,
      },
      donationType,
      items: donationType === "resource" ? items : undefined,
      amount: donationType === "monetary" ? amount : undefined,
      currency:
        donationType === "monetary" ? req.body.currency || "INR" : undefined,
      targetFacility,
      pickupLocation: donationType === "resource" ? pickupLocation : undefined,
      notes,
      images,
      priority: req.body.priority || "medium",
    });

    await donation.save();

    // Broadcast new donation to WebSocket clients
    if (req.app.locals.wss) {
      const message = {
        type: "NEW_DONATION",
        data: {
          donationId: donation._id,
          donorName: donation.donorInfo.isAnonymous
            ? "Anonymous"
            : donation.donorInfo.name,
          donationType: donation.donationType,
          itemCount: donation.items ? donation.items.length : 0,
          amount: donation.amount,
          targetFacility: donation.targetFacility,
          timestamp: new Date().toISOString(),
        },
      };

      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN && client.isRescueTeam) {
          client.send(JSON.stringify(message));
        }
      });
    }

    res.status(201).json({
      success: true,
      data: donation,
      message: "Donation created successfully",
    });
  } catch (error) {
    console.error("Error creating donation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create donation",
    });
  }
});

// Get donation by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("donorId", "name email")
      .populate("targetFacility.facilityId", "name type contactInfo")
      .populate("scheduledPickup.assignedVolunteer", "name phone email")
      .populate("delivery.receivedBy", "name email")
      .populate("tracking.updatedBy", "name");

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    res.json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error("Error fetching donation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation",
    });
  }
});

// Update donation status
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status, notes, scheduledPickup, delivery } = req.body;

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // Update status
    donation.status = status;

    // Add to tracking
    donation.tracking.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes,
    });

    // Update scheduled pickup if provided
    if (scheduledPickup) {
      donation.scheduledPickup = {
        ...donation.scheduledPickup,
        ...scheduledPickup,
      };
    }

    // Update delivery info if provided
    if (delivery) {
      donation.delivery = {
        ...donation.delivery,
        ...delivery,
      };
    }

    await donation.save();

    // If donation is delivered, update resource inventory
    if (status === "delivered" && donation.donationType === "resource") {
      for (const item of donation.items) {
        try {
          const resource = await Resource.findOne({
            name: item.resourceName,
            category: item.category,
            "location.facilityId": donation.targetFacility.facilityId,
          });

          if (resource) {
            resource.currentStock += item.quantity;
            await resource.save();
          } else {
            // Create new resource entry
            const newResource = new Resource({
              name: item.resourceName,
              category: item.category,
              unit: item.unit,
              currentStock: item.quantity,
              location: {
                facilityId: donation.targetFacility.facilityId,
                facilityName: donation.targetFacility.facilityName,
                address: donation.targetFacility.address,
                coordinates: donation.targetFacility.coordinates || {
                  lat: 0,
                  lng: 0,
                },
              },
              expiryDate: item.expiryDate,
            });
            await newResource.save();
          }
        } catch (error) {
          console.error(
            `Error updating resource inventory for ${item.resourceName}:`,
            error
          );
        }
      }
    }

    // Broadcast status update
    if (req.app.locals.wss) {
      const message = {
        type: "DONATION_STATUS_UPDATE",
        data: {
          donationId: donation._id,
          status: donation.status,
          donorName: donation.donorInfo.isAnonymous
            ? "Anonymous"
            : donation.donorInfo.name,
          timestamp: new Date().toISOString(),
        },
      };

      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }

    res.json({
      success: true,
      data: donation,
      message: "Donation status updated successfully",
    });
  } catch (error) {
    console.error("Error updating donation status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update donation status",
    });
  }
});

// Get donor's donation history
router.get("/donor/:donorId", authenticateToken, async (req, res) => {
  try {
    const { donorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [donations, total] = await Promise.all([
      Donation.find({ donorId })
        .populate("targetFacility.facilityId", "name type")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Donation.countDocuments({ donorId }),
    ]);

    // Calculate donor statistics
    const stats = await Donation.aggregate([
      { $match: { donorId: donorId } },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalMonetaryAmount: {
            $sum: {
              $cond: [{ $eq: ["$donationType", "monetary"] }, "$amount", 0],
            },
          },
          totalResourceDonations: {
            $sum: { $cond: [{ $eq: ["$donationType", "resource"] }, 1, 0] },
          },
          deliveredDonations: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        donations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
        statistics: stats[0] || {
          totalDonations: 0,
          totalMonetaryAmount: 0,
          totalResourceDonations: 0,
          deliveredDonations: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching donor history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donor history",
    });
  }
});

// Get donation statistics
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    const { facilityId, startDate, endDate } = req.query;

    const matchFilter = {};
    if (facilityId) matchFilter["targetFacility.facilityId"] = facilityId;
    if (startDate && endDate) {
      matchFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const [overallStats, categoryStats, statusStats] = await Promise.all([
      // Overall statistics
      Donation.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            totalMonetaryAmount: {
              $sum: {
                $cond: [{ $eq: ["$donationType", "monetary"] }, "$amount", 0],
              },
            },
            totalResourceDonations: {
              $sum: { $cond: [{ $eq: ["$donationType", "resource"] }, 1, 0] },
            },
            totalMonetaryDonations: {
              $sum: { $cond: [{ $eq: ["$donationType", "monetary"] }, 1, 0] },
            },
            uniqueDonors: { $addToSet: "$donorId" },
          },
        },
        {
          $project: {
            _id: 0,
            totalDonations: 1,
            totalMonetaryAmount: 1,
            totalResourceDonations: 1,
            totalMonetaryDonations: 1,
            uniqueDonorsCount: { $size: "$uniqueDonors" },
          },
        },
      ]),

      // Category breakdown for resource donations
      Donation.aggregate([
        { $match: { ...matchFilter, donationType: "resource" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.category",
            totalItems: { $sum: 1 },
            totalQuantity: { $sum: "$items.quantity" },
            donationCount: { $addToSet: "$_id" },
          },
        },
        {
          $project: {
            category: "$_id",
            totalItems: 1,
            totalQuantity: 1,
            donationCount: { $size: "$donationCount" },
          },
        },
        { $sort: { totalQuantity: -1 } },
      ]),

      // Status breakdown
      Donation.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        overview: overallStats[0] || {
          totalDonations: 0,
          totalMonetaryAmount: 0,
          totalResourceDonations: 0,
          totalMonetaryDonations: 0,
          uniqueDonorsCount: 0,
        },
        categoryBreakdown: categoryStats,
        statusBreakdown: statusStats,
      },
    });
  } catch (error) {
    console.error("Error fetching donation statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation statistics",
    });
  }
});

// Schedule pickup for donation
router.patch("/:id/schedule-pickup", authenticateToken, async (req, res) => {
  try {
    const { date, timeSlot, assignedVolunteer } = req.body;

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    donation.scheduledPickup = {
      date: new Date(date),
      timeSlot,
      assignedVolunteer,
    };

    donation.status = "approved";
    donation.tracking.push({
      status: "approved",
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes: `Pickup scheduled for ${date} at ${timeSlot}`,
    });

    await donation.save();

    res.json({
      success: true,
      data: donation,
      message: "Pickup scheduled successfully",
    });
  } catch (error) {
    console.error("Error scheduling pickup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule pickup",
    });
  }
});

export default router;
