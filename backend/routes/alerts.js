// routes/alerts.js
import express from "express";
import reliefWebService from "../services/reliefWebService.js";
import {
  authenticateToken,
  authorize,
  optionalAuth,
} from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/alerts - Get latest disaster alerts for India
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { limit = 20, type, severity } = req.query;

    let alerts;
    if (type) {
      alerts = await reliefWebService.getAlertsByType(type, parseInt(limit));
    } else {
      alerts = await reliefWebService.getIndiaAlerts({
        limit: parseInt(limit),
      });
    }

    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(
        (alert) => alert.severity.toLowerCase() === severity.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch disaster alerts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/alerts/reports - Get latest disaster reports for India
 */
router.get("/reports", optionalAuth, async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const reports = await reliefWebService.getIndiaReports(parseInt(limit));

    res.json({
      success: true,
      data: reports,
      count: reports.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch disaster reports",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/alerts/search - Search disasters by keyword
 */
router.get("/search", optionalAuth, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const results = await reliefWebService.searchDisasters(q, parseInt(limit));

    res.json({
      success: true,
      data: results,
      count: results.length,
      query: q,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error searching disasters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search disasters",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/alerts/stats - Get disaster statistics for India
 */
router.get(
  "/stats",
  authenticateToken,
  authorize("admin", "user"),
  async (req, res) => {
    try {
      const stats = await reliefWebService.getDisasterStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching disaster stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch disaster statistics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * GET /api/alerts/live - Get live alerts with WebSocket broadcast
 * This endpoint also broadcasts new alerts to connected clients
 */
router.get("/live", optionalAuth, async (req, res) => {
  try {
    const alerts = await reliefWebService.getIndiaAlerts({ limit: 10 });

    // Broadcast high severity alerts to connected WebSocket clients
    const highSeverityAlerts = alerts.filter(
      (alert) => alert.severity === "HIGH"
    );

    if (highSeverityAlerts.length > 0 && req.app.locals.wss) {
      const wss = req.app.locals.wss;

      highSeverityAlerts.forEach((alert) => {
        const alertMessage = {
          type: "DISASTER_ALERT",
          alert: {
            id: alert.id,
            title: alert.title,
            type: alert.type,
            severity: alert.severity,
            location: alert.location,
            date: alert.date,
            url: alert.url,
          },
          timestamp: new Date().toISOString(),
        };

        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(alertMessage));
          }
        });
      });
    }

    res.json({
      success: true,
      data: alerts,
      highSeverityCount: highSeverityAlerts.length,
      broadcastSent: highSeverityAlerts.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching live alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch live alerts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * GET /api/alerts/types - Get available disaster types
 */
router.get("/types", (req, res) => {
  const disasterTypes = [
    "Earthquake",
    "Flood",
    "Cyclone",
    "Tsunami",
    "Landslide",
    "Storm",
    "Drought",
    "Fire",
    "Industrial Accident",
    "Epidemic",
    "Other",
  ];

  res.json({
    success: true,
    data: disasterTypes,
    count: disasterTypes.length,
  });
});

export default router;
