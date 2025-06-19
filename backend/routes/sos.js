import express from "express";
import SOSAlert from "../models/SOSAlert.js";
import CheckIn from "../models/CheckIn.js";
import EmergencyContact from "../models/EmergencyContact.js";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Send SOS Alert
router.post("/alert", authenticateToken, async (req, res) => {
  try {
    const { location, message, urgencyLevel } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required",
      });
    }

    // Create SOS Alert
    const sosAlert = new SOSAlert({
      userId: req.user.userId,
      location,
      message: message || "Emergency assistance needed",
      urgencyLevel: urgencyLevel || "HIGH",
    });

    await sosAlert.save();

    // Populate user data
    await sosAlert.populate("userId", "name phone email");

    // Get user's emergency contacts
    const emergencyContacts = await EmergencyContact.find({
      userId: req.user.userId,
    });

    // Notify emergency contacts
    const notifications = emergencyContacts.map((contact) => ({
      recipientPhone: contact.phone,
      recipientEmail: contact.email,
      senderId: req.user.userId,
      type: "SOS",
      message: `EMERGENCY ALERT: ${sosAlert.userId.name} has sent an SOS from ${
        location.address || `${location.latitude}, ${location.longitude}`
      }. Message: ${message || "Emergency assistance needed"}`,
      relatedAlert: sosAlert._id,
    }));

    // Here you would integrate with SMS/Email service
    console.log("Emergency notifications to send:", notifications);

    // Broadcast to rescue teams via WebSocket
    const alertData = {
      type: "NEW_SOS_ALERT",
      alert: {
        _id: sosAlert._id,
        user: sosAlert.userId,
        location: sosAlert.location,
        message: sosAlert.message,
        urgencyLevel: sosAlert.urgencyLevel,
        createdAt: sosAlert.createdAt,
      },
    };

    // Send to WebSocket clients (rescue teams)
    if (req.app.locals.wss) {
      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(JSON.stringify(alertData));
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "SOS alert sent successfully",
      alert: sosAlert,
      contactsNotified: emergencyContacts.length,
    });
  } catch (error) {
    console.error("SOS Alert Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send SOS alert",
      error: error.message,
    });
  }
});

// Get user's SOS alerts
router.get("/alerts", authenticateToken, async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ userId: req.user.userId })
      .populate("rescueTeamAssigned", "name phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      error: error.message,
    });
  }
});

// Send Check-in Status
router.post("/checkin", authenticateToken, async (req, res) => {
  try {
    const { status, location, message, notifyContacts = true } = req.body;

    if (!["SAFE", "NEEDS_HELP", "INJURED", "MISSING"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const checkIn = new CheckIn({
      userId: req.user.userId,
      status,
      location,
      message,
    });

    // Get user data
    const user = await User.findById(req.user.userId);

    if (notifyContacts) {
      // Get emergency contacts
      const emergencyContacts = await EmergencyContact.find({
        userId: req.user.userId,
      });

      // Add contacts to check-in record
      checkIn.notifiedContacts = emergencyContacts.map((contact) => ({
        contactId: contact._id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
      }));

      // Create notification messages
      const statusMessages = {
        SAFE: `Good news! ${user.name} has checked in as SAFE.`,
        NEEDS_HELP: `${user.name} needs help. Please check on them.`,
        INJURED: `URGENT: ${user.name} is injured and needs assistance.`,
        MISSING: `ALERT: ${user.name} is missing. Please contact authorities.`,
      };

      const notifications = emergencyContacts.map((contact) => ({
        recipientPhone: contact.phone,
        recipientEmail: contact.email,
        senderId: req.user.userId,
        type: "CHECK_IN",
        message: `${statusMessages[status]} ${
          message ? `Message: ${message}` : ""
        } ${
          location && location.address ? `Location: ${location.address}` : ""
        }`,
        relatedCheckIn: checkIn._id,
      }));

      console.log("Check-in notifications to send:", notifications);
    }

    await checkIn.save();
    await checkIn.populate("userId", "name phone email");

    // Broadcast check-in to relevant parties
    if (req.app.locals.wss) {
      const checkInData = {
        type: "USER_CHECK_IN",
        checkIn: {
          _id: checkIn._id,
          user: checkIn.userId,
          status: checkIn.status,
          location: checkIn.location,
          message: checkIn.message,
          createdAt: checkIn.createdAt,
        },
      };

      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(checkInData));
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Check-in recorded successfully",
      checkIn,
      contactsNotified: checkIn.notifiedContacts.length,
    });
  } catch (error) {
    console.error("Check-in Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record check-in",
      error: error.message,
    });
  }
});

// Get user's check-ins
router.get("/checkins", authenticateToken, async (req, res) => {
  try {
    const checkIns = await CheckIn.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      checkIns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch check-ins",
      error: error.message,
    });
  }
});

// Emergency Contacts Management
router.post("/emergency-contacts", authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, relationship, isPrimary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await EmergencyContact.updateMany(
        { userId: req.user.userId },
        { isPrimary: false }
      );
    }

    const contact = new EmergencyContact({
      userId: req.user.userId,
      name,
      phone,
      email,
      relationship,
      isPrimary,
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: "Emergency contact added successfully",
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add emergency contact",
      error: error.message,
    });
  }
});

router.get("/emergency-contacts", authenticateToken, async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({
      userId: req.user.userId,
    }).sort({ isPrimary: -1, createdAt: -1 });

    res.json({
      success: true,
      contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch emergency contacts",
      error: error.message,
    });
  }
});

router.delete(
  "/emergency-contacts/:id",
  authenticateToken,
  async (req, res) => {
    try {
      await EmergencyContact.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.userId,
      });

      res.json({
        success: true,
        message: "Emergency contact deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete emergency contact",
        error: error.message,
      });
    }
  }
);

// For rescue teams - Get all active SOS alerts
router.get("/rescue/alerts", authenticateToken, async (req, res) => {
  try {
    const alerts = await SOSAlert.find({
      status: { $in: ["ACTIVE", "ACKNOWLEDGED", "IN_PROGRESS"] },
    })
      .populate("userId", "name phone email")
      .populate("rescueTeamAssigned", "name phone")
      .sort({ urgencyLevel: -1, createdAt: -1 });

    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch rescue alerts",
      error: error.message,
    });
  }
});

// Acknowledge/Update SOS Alert (for rescue teams)
router.patch("/rescue/alerts/:id", authenticateToken, async (req, res) => {
  try {
    const { status, notes, estimatedArrival } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (estimatedArrival)
      updateData.estimatedArrival = new Date(estimatedArrival);

    if (status === "ACKNOWLEDGED") {
      updateData.acknowledgedAt = new Date();
      updateData.rescueTeamAssigned = req.user.userId;
    }

    if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
    }

    const alert = await SOSAlert.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("userId", "name phone email");

    // Broadcast update
    if (req.app.locals.wss) {
      const updateData = {
        type: "SOS_ALERT_UPDATE",
        alert,
      };

      req.app.locals.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(updateData));
        }
      });
    }

    res.json({
      success: true,
      message: "Alert updated successfully",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update alert",
      error: error.message,
    });
  }
});

export default router;
