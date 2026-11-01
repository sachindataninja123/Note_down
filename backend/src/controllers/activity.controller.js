import mongoose from "mongoose";
import Activity from "../models/activity.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getAccessibleTask, isWorkspaceMember } from "../utils/taskAccess.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Cursor pagination on _id (newest first). Unlike skip/offset, entries added
 * while the user is scrolling can't cause duplicates or gaps: the next page is
 * always "older than the last item I already have".
 */
const parsePaging = (query) => {
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  let before = null;
  if (query.before !== undefined && query.before !== "") {
    if (!mongoose.isValidObjectId(query.before)) {
      throw new ApiError(400, "Invalid pagination cursor");
    }
    before = query.before;
  }
  return { limit, before };
};

const runFeedQuery = async (filter, { limit, before }) => {
  const query = before ? { ...filter, _id: { $lt: before } } : filter;

  // One extra row tells us whether another page exists.
  const rows = await Activity.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("actor", "name avatar") // never expose email here
    .lean();

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? String(items[items.length - 1]._id) : null,
  };
};

// GET /activity?workspace=<id|personal>&before=<cursor>&limit=<n>
export const getActivityFeed = asyncHandler(async (req, res) => {
  const { workspace } = req.query;
  const paging = parsePaging(req.query);

  let filter;
  if (workspace && workspace !== "personal") {
    if (!mongoose.isValidObjectId(workspace)) {
      throw new ApiError(400, "Invalid workspace ID");
    }
    const allowed = await isWorkspaceMember(workspace, req.user);
    if (!allowed) {
      throw new ApiError(403, "You do not have access to this workspace");
    }
    filter = { workspace };
  } else {
    // Personal feed: only the user's own personal-scope activity.
    filter = { workspace: null, actor: req.user._id };
  }

  const data = await runFeedQuery(filter, paging);
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Activity fetched successfully"));
});

// GET /tasks/:id/activity
export const getTaskActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  const data = await runFeedQuery({ task: id }, parsePaging(req.query));
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Task activity fetched successfully"));
});