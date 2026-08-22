import Redis from "ioredis";


const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

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