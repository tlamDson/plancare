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
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const userId = (req as ClerkRequest).auth?.userId;
    if (userId) return `user:${userId}`;
    return ipKeyGenerator(req, res);
  },
  skip: (req) => !(req as ClerkRequest).auth?.userId,
  store: new RedisStore({
    sendCommand: async (...args: any[]): Promise<any> => {
      const [command, ...commandArgs] = args;
      return redisConnection.call(command, ...commandArgs);
    },
    prefix: "rl:trip_create:",
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: "Daily trip creation limit exceeded",
      message:
        "Free tier users can create 10 trips per day. Please try again tomorrow.",
      retryAfter: res.getHeader("Retry-After"),
    });
  },
});
