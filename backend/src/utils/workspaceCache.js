import redisClient from "../config/redisClient.js";

const CACHE_PREFIX = "workspaces:v1";
const CACHE_TTL_SECONDS = 300; // workspaces change rarely — longer TTL than tasks

const buildKey = (userId) => `${CACHE_PREFIX}:${userId}`;

export const getCachedWorkspaces = async (userId) => {
  try {
    const raw = await redisClient.get(buildKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Workspace cache read failed:", err.message);
    return null;
  }
};

export const setCachedWorkspaces = async (userId, data) => {
  try {
    await redisClient.set(buildKey(userId), JSON.stringify(data), "EX", CACHE_TTL_SECONDS);
  } catch (err) {
    console.error("Workspace cache write failed:", err.message);
  }
};

export const invalidateWorkspaceCache = async (userId) => {
  try {
    await redisClient.del(buildKey(userId));
  } catch (err) {
    console.error("Workspace cache invalidation failed:", err.message);
  }
};

// Bulk invalidate for every member of a workspace at once — needed
// because one workspace mutation (invite accepted, member removed,
// workspace deleted) can affect several different users' cached lists
// simultaneously, not just the actor's own.
export const invalidateWorkspaceCacheForUsers = async (userIds = []) => {
  try {
    if (userIds.length === 0) return;
    const keys = userIds.map((id) => buildKey(id.toString()));
    await redisClient.del(...keys);
  } catch (err) {
    console.error("Bulk workspace cache invalidation failed:", err.message);
  }
};