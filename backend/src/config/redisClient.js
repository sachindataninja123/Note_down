import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing");
}

const redisClient = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("ready", () => {
  console.log("Redis ready");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redisClient;