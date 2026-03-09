import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisConnection } from "../lib/queue";
import { ClerkRequest } from "../types/express";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args: any[]): Promise<any> => {
      const [command, ...commandArgs] = args;
      return redisConnection.call(command, ...commandArgs);
    },
    prefix: "rl:general:",
  }),
  message: {
    error: "Too many requests, please try again later.",
  },
});

export const tripCreationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  // Anti-spam limiter only. Plan limits are enforced by userQuotaService.
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const userId = (req as ClerkRequest).auth?.()?.userId;
    if (userId) return `user:${userId}`;
    return ipKeyGenerator(req, res);
  },
  skip: (req) => !(req as ClerkRequest).auth?.()?.userId,
  store: new RedisStore({
    sendCommand: async (...args: any[]): Promise<any> => {
      const [command, ...commandArgs] = args;
      return redisConnection.call(command, ...commandArgs);
    },
    prefix: "rl:trip_create:",
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many trip creation attempts",
      message: "Please wait a moment and try again.",
      retryAfter: res.getHeader("Retry-After"),
    });
  },
});
