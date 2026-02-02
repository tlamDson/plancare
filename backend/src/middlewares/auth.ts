import { requireAuth, RequireAuthProp } from "@clerk/clerk-sdk-node";
import { Request, Response, NextFunction } from "express";

// Middleware for routes
export const requireUserAuth = (
  req: any, // Correct type
  res: Response,
  next: NextFunction
) => {
  try {
    requireAuth(req); // throws if no valid Clerk session
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};
