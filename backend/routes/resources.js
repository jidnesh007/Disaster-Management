import express from "express";
import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// List resources
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      category,
      status,
      facilityId,
      isUrgent,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (facilityId) filter["location.facilityId"] = facilityId;
    if (isUrgent !== undefined) filter.isUrgent = isUrgent === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("location.facilityId", "name type address coordinates", {
          strictPopulate: false,
        }), // Added strictPopulate
      Resource.countDocuments(filter),
    ]);

    const categoryStats = await Resource.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          totalItems: { $sum: 1 },
          totalStock: { $sum: "$currentStock" },
          urgentItems: {
            $sum: { $cond: [{ $eq: ["$isUrgent", true] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
        statistics: {
          categoryBreakdown: categoryStats,
          totalResources: total,
          urgentItems: resources.filter((r) => r.isUrgent).length,
        },
      },
    });
  } catch (error) {
    console.error("Error listing resources:", {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      message: "Failed to list resources",
      error: error.message,
    });
  }
});

// Create resource
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      unit,
      currentStock,
      minimumThreshold,
      location,
      expiryDate,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !category ||
      !unit ||
      !location ||
      !location.facilityName ||
      !location.address
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, category, unit, location.facilityName, location.address",
      });
    }

    // Validate location.coordinates
    if (
      !location.coordinates ||
      typeof location.coordinates.lat !== "number" ||
      typeof location.coordinates.lng !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid location.coordinates: lat and lng must be numbers",
      });
    }

    // Validate location.facilityId
    if (
      !location.facilityId ||
      !mongoose.isValidObjectId(location.facilityId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or missing location.facilityId: must be a valid ObjectId",
      });
    }

    const resource = new Resource({
      name,
      category,
      description,
      unit,
      currentStock: currentStock || 0,
      minimumThreshold: minimumThreshold || 10,
      location,
      expiryDate,
    });

    await resource.save();

    // Broadcast to WebSocket clients if stock is low
    if (resource.isUrgent && req.app.locals.wss) {
      const message = {
        type: "RESOURCE_ALERT",
        data: {
          resourceId: resource._id,
          name: resource.name,
          category: resource.category,
          status: resource.status,
          currentStock: resource.currentStock,
          location: resource.location,
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
      data: resource,
      message: "Resource created successfully",
    });
  } catch (error) {
    console.error("Error creating resource:", {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.status(500).json({
      success: false,
      message: "Failed to create resource",
      error: error.message,
    });
  }
});

// Get resource by ID
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate(
      "location.facilityId",
      "name type contactInfo",
      { strictPopulate: false }
    );

    if (!resource) {
      return res.status(400).json({
        success: false,
        message: "Resource not found",
      });
    }

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch resource",
    });
  }
});

// Update resource stock
router.patch("/:id/stock", authenticateToken, async (req, res) => {
  try {
    const { quantity, operation = "add" } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(400).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Update stock based on operation
    if (operation === "add") {
      resource.currentStock += quantity;
    } else if (operation === "subtract") {
      resource.currentStock = Math.max(0, resource.currentStock - quantity);
    } else if (operation === "set") {
      resource.currentStock = quantity;
    }

    await resource.save();

    // Broadcast stock update
    if (req.app.locals.wss) {
      const message = {
        type: "STOCK_UPDATE",
        data: {
          resourceId: resource._id,
          name: resource.name,
          currentStock: resource.currentStock,
          status: resource.status,
          isUrgent: resource.isUrgent,
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
      data: resource,
      message: "Stock updated successfully",
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock",
    });
  }
});

// Get low stock alerts
router.get("/alerts/low-stock", authenticateToken, async (req, res) => {
  try {
    const lowStockResources = await Resource.find({
      $or: [
        { isUrgent: true },
        { status: { $in: ["low_stock", "out_of_stock"] } },
      ],
    })
      .populate("location.facilityId", "name type", { strictPopulate: false })
      .sort({ currentStock: 1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        alerts: lowStockResources,
        count: lowStockResources.length,
        summary: {
          outOfStock: lowStockResources.filter(
            (r) => r.status === "out_of_stock"
          ).length,
          lowStock: lowStockResources.filter((r) => r.status === "low_stock")
            .length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching low stock alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch low stock alerts",
    });
  }
});

// Get resource statistics
router.get("/stats-overview", async (req, res) => {
  try {
    const { facilityId, category } = req.query;

    const matchFilter = {};
    if (facilityId) matchFilter["location.facilityId"] = facilityId;
    if (category) matchFilter.category = category;

    const stats = await Resource.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalResources: { $sum: 1 },
          totalStock: { $sum: "$currentStock" },
          categoriesCount: { $addToSet: "$category" },
          urgentItems: {
            $sum: { $cond: [{ $eq: ["$isUrgent", true] }, 1, 0] },
          },
          outOfStockItems: {
            $sum: { $cond: [{ $eq: ["$status", "out_of_stock"] }, 1, 0] },
          },
          lowStockItems: {
            $sum: { $cond: [{ $eq: ["$status", "low_stock"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalResources: 1,
          totalStock: 1,
          totalCategories: { $size: "$categoriesCount" },
          urgentItems: 1,
          outOfStockItems: 1,
          lowStockItems: 1,
          healthyStockItems: {
            $subtract: [
              "$totalResources",
              { $add: ["$urgentItems", "$outOfStockItems", "$lowStockItems"] },
            ],
          },
        },
      },
    ]);

    const categoryBreakdown = await Resource.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalStock: { $sum: "$currentStock" },
          urgentCount: {
            $sum: { $cond: [{ $eq: ["$isUrgent", true] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalResources: 0,
          totalStock: 0,
          totalCategories: 0,
          urgentItems: 0,
          outOfStockItems: 0,
          lowStockItems: 0,
          healthyStockItems: 0,
        },
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error("Error fetching resource statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch resource statistics",
    });
  }
});

// Delete resource
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(400).json({
        success: false,
        message: "Resource not found",
      });
    }

    res.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete resource",
    });
  }
});

export default router;
