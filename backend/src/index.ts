import dotenv from "dotenv";
import path from "path";

// Load .env FIRST, before any other imports that use env vars
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db";
import webhookRoutes from "./features/auth/routes";
import { clerkMiddleware } from "@clerk/express";
import { logger } from "./lib/logger";
import { env } from "./config/env";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

// Feature Routes
import assistantRoutes from "./features/assistant/routes";
import plannerRoutes from "./features/planner/routes";
import userRoutes from "./features/user/routes";

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TravelPlan API",
      version: "1.0.0",
      description: "API documentation for TravelPlan application",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./routes/*.ts", "./features/*/routes.ts"], // Path to route files
};
//Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app: Express = express();

// ============================================
// MIDDLEWARE ORDER MATTERS!
// ============================================

//1. CORS - Allow cross-origin request
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://plancare-web-omega.vercel.app",
      env.FRONTEND_URL,
    ],
    credentials: true, // Required for Clerk / Auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);
//2. Webhook routes - BEFORE express.json() for signature verification
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  webhookRoutes,
);

// 3. Clerk middleware - After webhooks
app.use(clerkMiddleware());

// 4. Body parsers - For regular API routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// 5. Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 5.5 Welcome root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "TravelPlan API is live and connected to Atlas!" });
});

// 6. API Routes
app.use("/api/ai", assistantRoutes);
app.use("/api/users", userRoutes);
app.use("/api", plannerRoutes);

//7. Health checks
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Ready check (verifies DB + Redis connectivity)
app.get("/ready", async (req: Request, res: Response) => {
  try {
    // Check MongoDB
    const mongoStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // Check Redis (import redisConnection from queue.ts)
    const { redisConnection } = await import("./lib/queue");
    await redisConnection.ping();

    if (mongoStatus !== "connected") {
      return res.status(503).json({
        status: "not_ready",
        mongodb: mongoStatus,
        redis: "connected",
        timestamp: new Date(),
      });
    }

    res.json({
      status: "ready",
      mongodb: mongoStatus,
      redis: "connected",
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      error: "Service dependencies unavailable",
      timestamp: new Date(),
    });
  }
});

// 8. Global error handler (MUST BE LAST)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, stack: err.stack }, "Unhandled error");

  res.status(500).json({
    success: false,
    message: "An unexpected error occured",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// ============================================
// SERVER STARTUP
// ============================================
const PORT: number = parseInt(process.env.PORT || "3000");

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info({ port: PORT }, "Server is running");
    });
  } catch (error) {
    logger.fatal({ error }, "Failed to start server");
    process.exit(1);
  }
};

//Optional : Handle uncaught exception / unhandled rejections
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception");
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "Unhandled Rejection");
  process.exit(1);
});

startServer();

//Export for testing
export default app;
