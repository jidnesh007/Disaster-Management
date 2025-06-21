import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import http from "http";
import authRouter from "./routes/auth.js";
import rescueRouter from "./routes/rescue.js";
import coordinatorRoutes from "./routes/coordinator.js";
import sosRouter from "./routes/sos.js";
import mapRouter from "./routes/map.js";
import alertsRouter from "./routes/alerts.js";
import donationRequestRouter from "./routes/donation-requests.js";
import donationRouter from "./routes/donations.js";
import resourceRouter from "./routes/resources.js";
import alertScheduler from "./services/alertScheduler.js";
import facilitiesRouter from "./routes/facilities.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  verifyClient: (info, cb) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.CLIENT_URL,
    ].filter(Boolean);
    const origin = info.origin;
    if (!allowedOrigins.includes(origin)) {
      console.warn(`WebSocket connection rejected from origin: ${origin}`);
      return cb(false, 403, "Invalid origin");
    }
    console.log(`WebSocket connection accepted from origin: ${origin}`);
    cb(true);
  },
});

// Environment validation
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Make WebSocket server accessible to routes
app.locals.wss = wss;

// Initialize alert scheduler with WebSocket server
alertScheduler.init(wss);

// Enhanced WebSocket handling
wss.on("connection", (ws, req) => {
  console.log(`WebSocket client connected from ${req.headers.origin}`);
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("Received WebSocket message:", data);

      switch (data.type) {
        case "JOIN_RESCUE_TEAM":
          if (!data.userId) {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: "userId is required",
              })
            );
            break;
          }
          ws.isRescueTeam = true;
          ws.userId = data.userId;
          console.log(`Rescue team member ${data.userId} joined`);
          ws.send(
            JSON.stringify({
              type: "JOIN_SUCCESS",
              message: "Successfully joined rescue team",
            })
          );
          break;

        case "JOIN_COORDINATOR":
          if (!data.userId) {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: "userId is required",
              })
            );
            break;
          }
          ws.isCoordinator = true;
          ws.userId = data.userId;
          console.log(`Coordinator ${data.userId} joined`);
          ws.send(
            JSON.stringify({
              type: "COORDINATOR_JOIN_SUCCESS",
              message: "Successfully joined as coordinator",
            })
          );
          break;

        case "JOIN_MAP_UPDATES":
          ws.isMapSubscriber = true;
          ws.userLocation = data.location;
          console.log(`User subscribed to map updates`);
          ws.send(
            JSON.stringify({
              type: "MAP_SUBSCRIPTION_SUCCESS",
              message: "Subscribed to map updates",
            })
          );
          break;

        case "JOIN_ALERT_UPDATES":
          ws.isAlertSubscriber = true;
          console.log(`User subscribed to disaster alert updates`);
          ws.send(
            JSON.stringify({
              type: "ALERT_SUBSCRIPTION_SUCCESS",
              message: "Subscribed to disaster alerts",
            })
          );
          break;

        case "JOIN_DONATION_UPDATES":
          ws.isDonationSubscriber = true;
          console.log(`User subscribed to donation updates`);
          ws.send(
            JSON.stringify({
              type: "DONATION_SUBSCRIPTION_SUCCESS",
              message: "Subscribed to donation updates",
            })
          );
          break;

        case "LOCATION_UPDATE":
          if (data.coordinates) {
            ws.userLocation = data.coordinates;
            // Broadcast location to rescue teams if this is an SOS
            if (data.isSOS) {
              wss.clients.forEach((client) => {
                if (
                  client !== ws &&
                  client.readyState === client.OPEN &&
                  client.isRescueTeam
                ) {
                  client.send(
                    JSON.stringify({
                      type: "SOS_LOCATION_UPDATE",
                      ...data,
                    })
                  );
                }
              });
            }
          }
          break;

        case "SOS_LOCATION_UPDATE":
          if (!ws.isRescueTeam || !data.coordinates) {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: "Unauthorized or invalid location data",
              })
            );
            break;
          }
          wss.clients.forEach((client) => {
            if (
              client !== ws &&
              client.readyState === client.OPEN &&
              client.isRescueTeam
            ) {
              client.send(JSON.stringify(data));
            }
          });
          break;

        case "FACILITY_CAPACITY_UPDATE":
          wss.clients.forEach((client) => {
            if (
              client !== ws &&
              client.readyState === client.OPEN &&
              client.isMapSubscriber
            ) {
              client.send(
                JSON.stringify({
                  type: "FACILITY_UPDATE",
                  ...data,
                })
              );
            }
          });
          break;

        case "REQUEST_ALERT_STATUS":
          const status = alertScheduler.getStatus();
          ws.send(
            JSON.stringify({
              type: "ALERT_STATUS",
              status,
              timestamp: new Date().toISOString(),
            })
          );
          break;

        case "FORCE_ALERT_CHECK":
          if (ws.isRescueTeam || ws.isCoordinator) {
            alertScheduler.forceCheck();
            ws.send(
              JSON.stringify({
                type: "ALERT_CHECK_TRIGGERED",
                message: "Manual alert check initiated",
                timestamp: new Date().toISOString(),
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "ERROR",
                message: "Unauthorized to trigger alert check",
              })
            );
          }
          break;

        case "PING":
          ws.send(JSON.stringify({ type: "PONG" }));
          break;

        default:
          // Broadcast general messages to all connected clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === client.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Invalid message format",
        })
      );
    }
  });

  ws.on("close", (code, reason) => {
    console.log(
      `WebSocket client disconnected. Code: ${code}, Reason: ${reason.toString()}`
    );
  });

  ws.on("error", (error) => {
    console.error("WebSocket client error:", error);
  });
});

// Enhanced ping interval with alert subscriber tracking
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log("Terminating inactive WebSocket client");
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("error", (error) => {
  console.error("WebSocket server error:", error);
});

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("Mumbai disaster management system ready");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRouter);
app.use("/api/rescue", rescueRouter);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/sos", sosRouter);
app.use("/api/map", mapRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/donation-requests", donationRequestRouter);
app.use("/api/donations", donationRouter);
app.use("/api/resources", resourceRouter);
app.use("/api/facilities", facilitiesRouter);

// Development route logging
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    const routes = app._router?.stack
      ?.filter((layer) => layer.route)
      .map((layer) => ({
        method: Object.keys(layer.route.methods)[0]?.toUpperCase(),
        path: layer.route.path,
      }));
    if (routes?.length && !app.locals.routesLogged) {
      console.log("Registered routes:");
      routes.forEach((r) => console.log(`${r.method} ${r.path}`));
      app.locals.routesLogged = true;
    }
  }
  next();
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mumbai Disaster Management API is running",
    version: "2.0.0",
    features: [
      "Real-time location tracking",
      "Shelter and hospital mapping",
      "SOS emergency services",
      "Rescue team coordination",
      "Live disaster alerts from ReliefWeb",
      "Automated alert monitoring",
      "WebSocket real-time updates",
      "Donation management system",
      "Resource inventory tracking",
      "Multi-role user system",
    ],
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      rescue: "/api/rescue",
      coordinator: "/api/coordinator",
      sos: "/api/sos",
      map: "/api/map",
      alerts: "/api/alerts",
      donationRequests: "/api/donation-requests",
      donations: "/api/donations",
      resources: "/api/resources",
    },
  });
});

// Enhanced health check endpoint
app.get("/api/health", (req, res) => {
  const alertStatus = alertScheduler.getStatus();

  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
    },
    database: {
      status:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      name: mongoose.connection.name,
    },
    websocket: {
      connected: wss.clients.size,
      rescueTeams: Array.from(wss.clients).filter((ws) => ws.isRescueTeam)
        .length,
      coordinators: Array.from(wss.clients).filter((ws) => ws.isCoordinator)
        .length,
      mapSubscribers: Array.from(wss.clients).filter((ws) => ws.isMapSubscriber)
        .length,
      alertSubscribers: Array.from(wss.clients).filter(
        (ws) => ws.isAlertSubscriber
      ).length,
      donationSubscribers: Array.from(wss.clients).filter(
        (ws) => ws.isDonationSubscriber
      ).length,
    },
    alertSystem: {
      isRunning: alertStatus.isRunning,
      trackedAlerts: alertStatus.trackedAlerts,
      lastCheck: alertStatus.lastCheck,
    },
  });
});

// Alert system management endpoints
app.get("/api/admin/alerts/status", (req, res) => {
  const status = alertScheduler.getStatus();
  res.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/admin/alerts/force-check", (req, res) => {
  try {
    alertScheduler.forceCheck();
    res.json({
      success: true,
      message: "Manual alert check initiated",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to initiate alert check",
      error: error.message,
    });
  }
});

app.post("/api/admin/alerts/reset", (req, res) => {
  try {
    alertScheduler.reset();
    res.json({
      success: true,
      message: "Alert tracker reset successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset alert tracker",
      error: error.message,
    });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Mumbai Disaster Management Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`WebSocket server ready for real-time updates`);
  console.log(`🔔 Alert system initialized and monitoring ReliefWeb`);
  console.log(`💰 Donation management system active`);
  console.log(`📦 Resource tracking system ready`);
  console.log(`Access the API at: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Closing server gracefully...`);

  // Stop accepting new connections
  server.close(() => {
    console.log("HTTP server closed.");

    // Close WebSocket server
    wss.close(() => {
      console.log("WebSocket server closed.");

      // Stop alert scheduler
      alertScheduler.stop();
      console.log("Alert scheduler stopped.");

      // Clear intervals
      clearInterval(pingInterval);

      // Close database connection
      mongoose.connection.close(false, () => {
        console.log("MongoDB connection closed.");
        process.exit(0);
      });
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});

export default app;
