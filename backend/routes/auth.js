import express from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increase to 50 requests for development
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Comment out authLimiter for testing
// router.post("/register", /* authLimiter, */ async (req, res) => {
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || "citizen",
      phone,
      location,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

// router.post("/login", /* authLimiter, */ async (req, res) => {
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    user.password = undefined;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

router.post("/logout", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, phone, location },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during profile update",
    });
  }
});

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "your-secret-key-here",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export default router;
