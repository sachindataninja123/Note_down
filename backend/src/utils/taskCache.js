import redisClient from "../config/redisClient.js";

const CACHE_PREFIX = "tasks:v1";
const CACHE_TTL_SECONDS = 60;



export const buildScope = ({ userId, workspaceId }) =>
  workspaceId ? `workspace:${workspaceId}` : `user:${userId}`;

export const scopeFromTask = (task) =>
  task.workspace ? `workspace:${task.workspace}` : `user:${task.owner}`;

// Same query params (status/category/priority/search) in any order must
// produce the same cache key, so sort them before hashing.
const buildQueryKey = (scope, query = {}) => {
  const sorted = Object.keys(query)
    .filter((k) => query[k] !== undefined && query[k] !== "")
    .sort()
    .reduce((acc, k) => ({ ...acc, [k]: query[k] }), {});
  return `${CACHE_PREFIX}:${scope}:${JSON.stringify(sorted)}`;
};

const scopeKeySetName = (scope) => `${CACHE_PREFIX}:keyset:${scope}`;


export const getCachedTasks = async (scope, query) => {
  try {
    const raw = await redisClient.get(buildQueryKey(scope, query));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Task cache read failed:", err.message);
    return null;
  }
};

export const setCachedTasks = async (scope, query, data) => {
  try {
    const key = buildQueryKey(scope, query);
    const keySet = scopeKeySetName(scope);

    await redisClient.set(key, JSON.stringify(data), "EX", CACHE_TTL_SECONDS);
    await redisClient.sadd(keySet, key);
    await redisClient.expire(keySet, CACHE_TTL_SECONDS + 30);
  } catch (err) {
    console.error("Task cache write failed:", err.message);
  }
};


export const invalidateTaskCache = async (scope) => {
  try {
    const keySet = scopeKeySetName(scope);
    const keys = await redisClient.smembers(keySet);
    if (keys.length > 0) await redisClient.del(...keys);
    await redisClient.del(keySet);
  } catch (err) {
    console.error("Task cache invalidation failed:", err.message);
  }
};