import dotenv from "dotenv";
import path from "path";

// Load .env FIRST, before any other imports that use env vars
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import connectDB from "./config/db";
import { logger } from "./lib/logger";
import { createApp } from "./app";

const app = createApp();

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
