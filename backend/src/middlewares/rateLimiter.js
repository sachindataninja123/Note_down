import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../config/redisClient.js";

const buildLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true, // adds RateLimit-* response headers
    legacyHeaders: false,
    message: { success: false, message },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: "rl:",
    }),
  });

// Tight limit on login/register — this is the brute-force protection.
export const authLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 attempts per IP per window
  message: "Too many attempts. Please try again in 10 minutes.",
});

export const apiLimiter = buildLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per IP per minute
  message: "Too many requests. Please slow down.",
});
