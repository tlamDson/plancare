import { requireAuth } from "@clerk/express";

// Middleware for routes that require authentication
// In @clerk/express, requireAuth() is used directly as middleware
// It will automatically return 401 if no valid session exists
export const requireUserAuth = requireAuth();
