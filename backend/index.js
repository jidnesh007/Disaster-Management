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
import mapRouter from "./routes/map.js"; // Add this import

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  verifyClient: (info, cb) => {
    const allowedOrigins = [
      "http://localhost:5173",
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

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

app.use(express.json());
app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
    credentials: true,
  })
);

// Make WebSocket server accessible to routes
app.locals.wss = wss;

// Enhanced WebSocket handling for map updates
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
          // Broadcast facility capacity updates to map subscribers
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

        case "PING":
          ws.send(JSON.stringify({ type: "PONG" }));
          break;

        default:
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
app.use("/api/map", mapRouter); // Add this route

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

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mumbai Disaster Management API is running",
    features: [
      "Real-time location tracking",
      "Shelter and hospital mapping",
      "SOS emergency services",
      "Rescue team coordination",
    ],
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    websocket: {
      connected: wss.clients.size,
      rescueTeams: Array.from(wss.clients).filter((ws) => ws.isRescueTeam)
        .length,
      mapSubscribers: Array.from(wss.clients).filter((ws) => ws.isMapSubscriber)
        .length,
    },
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Mumbai Disaster Management Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`WebSocket server ready for real-time updates`);
  console.log(`Access the API at: http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  clearInterval(pingInterval);
  wss.close(() => {
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log("MongoDB connection closed.");
        process.exit(0);
      });
    });
  });
});
