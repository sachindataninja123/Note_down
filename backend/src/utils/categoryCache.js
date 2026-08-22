import redisClient from "../config/redisClient.js";

const CACHE_PREFIX = "categories:v1";
const CACHE_TTL_SECONDS = 300;

const buildKey = (userId) => `${CACHE_PREFIX}:${userId}`;

export const getCachedCategories = async (userId) => {
  try {
    const raw = await redisClient.get(buildKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Category cache read failed:", err.message);
    return null;
  }
};

export const setCachedCategories = async (userId, data) => {
  try {
    await redisClient.set(buildKey(userId), JSON.stringify(data), "EX", CACHE_TTL_SECONDS);
  } catch (err) {
    console.error("Category cache write failed:", err.message);
  }
};

export const invalidateCategoryCache = async (userId) => {
  try {
    await redisClient.del(buildKey(userId));
  } catch (err) {
    console.error("Category cache invalidation failed:", err.message);
  }
};