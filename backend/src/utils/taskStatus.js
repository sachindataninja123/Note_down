import { ApiError } from "./ApiError.js";

/**
 * Single source of truth for task workflow statuses.
 * `completed` (legacy boolean) is kept in sync: completed === (status === "done").
 */
export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done"];

export const isValidStatus = (value) => TASK_STATUSES.includes(value);

export const assertValidStatus = (value) => {
  if (!isValidStatus(value)) {
    throw new ApiError(
      400,
      `Invalid status. Allowed: ${TASK_STATUSES.join(", ")}`,
    );
  }
};

/**
 * Turns the ?status= query param into a Mongo condition for `status`.
 *  - undefined / "all"   -> null (no filter)
 *  - "active"            -> everything except done   (legacy tab)
 *  - "completed"         -> done                     (legacy tab)
 *  - "todo,in_review"    -> any of the listed statuses
 */
export const buildStatusCondition = (param) => {
  if (!param || param === "all") return null;
  if (param === "active") return { $ne: "done" };
  if (param === "completed") return "done";

  const list = String(param)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  list.forEach(assertValidStatus);
  return list.length === 1 ? list[0] : { $in: list };
};

/**
 * One-time (idempotent) backfill for tasks created before `status` existed.
 * Old documents have no stored `status`, so we set it from `completed`.
 * Safe to run on every startup: it only touches documents missing the field.
 */
export const migrateTaskStatus = async (TaskModel) => {
  const done = await TaskModel.collection.updateMany(
    { status: { $exists: false }, completed: true },
    { $set: { status: "done" } },
  );
  const todo = await TaskModel.collection.updateMany(
    { status: { $exists: false } },
    { $set: { status: "todo", completed: false } },
  );
  return { done: done.modifiedCount, todo: todo.modifiedCount };
};

/**
 * Done tasks created before `completedAt` existed have no completion time.
 * We approximate it with their last-modified time (`updatedAt`), which is the
 * best information available. Idempotent: only touches done tasks that have no
 * `completedAt` field. Needs MongoDB 4.2+ (pipeline-style update).
 */
export const backfillCompletedAt = async (TaskModel) => {
  const result = await TaskModel.collection.updateMany(
    { status: "done", completedAt: { $exists: false } },
    [{ $set: { completedAt: { $ifNull: ["$updatedAt", "$createdAt"] } } }],
  );
  return { backfilled: result.modifiedCount };
};