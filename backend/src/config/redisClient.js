import dotenv from "dotenv";
dotenv.config();
import Redis from "ioredis";

const REDIS_URL =
  process.env.REDIS_URL ||
  "rediss://red-da4umu2jobas73d06qug:rNjiXJwX5xqQHFCwsvK8hoJFQq1LWQ8M@oregon-keyvalue.render.com:6379";

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redisClient;
