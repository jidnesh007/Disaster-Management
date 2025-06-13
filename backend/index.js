import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws"; // Named import for WebSocket server
import http from "http";
import authRouter from "./routes/auth.js";
import rescueRouter from "./routes/rescue.js";
import coordinatorRoutes from "./routes/coordinator.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({
  // Now correctly creating a WebSocket server
  server,
  verifyClient: (info, cb) => {
    const allowedOrigins = ["http://localhost:5173"];
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
  console.error(
    `Error: Missing environment variables: ${missingEnv.join(", ")}`
  );
  process.exit(1);
}

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

wss.on("connection", (ws, req) => {
  console.log(`WebSocket client connected from ${req.headers.origin}`);
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  ws.on("message", (message) => {
    console.log("Received:", message.toString());
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message.toString());
      }
    });
  });
  ws.on("close", (code, reason) => {
    console.log(
      `WebSocket client disconnected. Code: ${code}, Reason: ${reason}`
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
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use("/api/auth", authRouter);
app.use("/api/rescue", rescueRouter);
app.use("/api/coordinator", coordinatorRoutes);

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
  res.json({ success: true, message: "API is running" });
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
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
