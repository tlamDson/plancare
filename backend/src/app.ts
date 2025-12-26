//Responsibility of the app.ts
//Create the Express instance
//Register middleware
//Register routes
//Configure error handling
//Export the configured app
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies

// Optional: simple logger middleware
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check route
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

export default app;
