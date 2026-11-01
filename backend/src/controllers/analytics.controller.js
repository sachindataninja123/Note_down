import mongoose from "mongoose";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isWorkspaceMember } from "../utils/taskAccess.js";
import {
  RANGE_OPTIONS,
  computeAnalytics,
  isValidDayKey,
  isValidTimeZone,
} from "../utils/analytics.js";

// GET /analytics?workspace=<id|personal>&range=7|30|90&today=YYYY-MM-DD&tz=<IANA zone>
//
// `today` and `tz` come from the browser because "today" and "which day did
// this happen on" depend on the viewer's timezone, which the server can't know.
export const getAnalytics = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  const rangeDays = req.query.range === undefined ? 30 : Number(req.query.range);
  if (!RANGE_OPTIONS.includes(rangeDays)) {
    throw new ApiError(400, `range must be one of ${RANGE_OPTIONS.join(", ")}`);
  }

  const today =
    req.query.today === undefined
      ? new Date().toISOString().slice(0, 10)
      : req.query.today;
  if (!isValidDayKey(today)) {
    throw new ApiError(400, "today must be a valid YYYY-MM-DD date");
  }

  const timeZone = req.query.tz === undefined ? "UTC" : req.query.tz;
  if (!isValidTimeZone(timeZone)) {
    throw new ApiError(400, "tz must be a valid IANA time zone");
  }

  let filter;
  const isWorkspaceScope = Boolean(workspace && workspace !== "personal");
  if (isWorkspaceScope) {
    if (!mongoose.isValidObjectId(workspace)) {
      throw new ApiError(400, "Invalid workspace ID");
    }
    const allowed = await isWorkspaceMember(workspace, req.user);
    if (!allowed) {
      throw new ApiError(403, "You do not have access to this workspace");
    }
    filter = { workspace };
  } else {
    // Personal scope: only the caller's own personal tasks, never anyone else's.
    filter = { owner: req.user._id, workspace: null };
  }

  const tasks = await Task.find(filter)
    .select("status completed priority dueDate completedAt createdAt assignedTo")
    .lean();

  const data = computeAnalytics(tasks, {
    today,
    rangeDays,
    timeZone,
    includeWorkload: isWorkspaceScope,
  });

  if (data.workload?.length) {
    const ids = data.workload.filter((w) => w.userId).map((w) => w.userId);
    const users = await User.find({ _id: { $in: ids } }, "name").lean();
    const names = new Map(users.map((u) => [String(u._id), u.name]));
    // Alphabetical on purpose: this is a workload view, not a leaderboard.
    data.workload = data.workload
      .map((w) => ({ ...w, name: w.userId ? names.get(w.userId) || "Member" : null }))
      .sort((a, b) => (a.name ?? "￿").localeCompare(b.name ?? "￿"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Analytics fetched successfully"));
});