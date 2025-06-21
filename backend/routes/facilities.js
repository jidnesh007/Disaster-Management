import express from "express";
import Facility from "../models/Facility.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  try {
    const facilities = await Facility.find().select(
      "_id name type address coordinates"
    );
    console.log("Facilities fetched:", facilities); // Debug log
    res.json({
      success: true,
      data: facilities,
    });
  } catch (error) {
    console.error("Error fetching facilities:", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch facilities",
      error: error.message,
    });
  }
});

export default router;
