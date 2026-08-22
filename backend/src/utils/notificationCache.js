import redisClient from "../config/redisClient.js";

const CACHE_PREFIX = "notifications:v1";
const CACHE_TTL_SECONDS = 30; // short TTL — notifications change frequently

const buildKey = (userId) => `${CACHE_PREFIX}:${userId}`;

export const getCachedNotifications = async (userId) => {
  try {
    const raw = await redisClient.get(buildKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Notification cache read failed:", err.message);
    return null;
  }
};

export const setCachedNotifications = async (userId, data) => {
  try {
    await redisClient.set(buildKey(userId), JSON.stringify(data), "EX", CACHE_TTL_SECONDS);
  } catch (err) {
    console.error("Notification cache write failed:", err.message);
  }
};

export const invalidateNotificationCache = async (userId) => {
  try {
    await redisClient.del(buildKey(userId));
  } catch (err) {
    console.error("Notification cache invalidation failed:", err.message);
  }
};