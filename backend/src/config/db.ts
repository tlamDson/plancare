import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../lib/logger";

const connectDB = async (): Promise<void> => {
  try {
    logger.info("Connecting to MongoDB...");
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    logger.error({ error: error.message }, "MongoDB connection error");
    process.exit(1);
  }
};

export default connectDB;
