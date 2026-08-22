import mongoose from "mongoose";
import Workspace from "../models/workspace.model.js";
import Task from "../models/task.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getCachedWorkspaces,
  setCachedWorkspaces,
  invalidateWorkspaceCache,
  invalidateWorkspaceCacheForUsers,
} from "../utils/workspaceCache.js";

// Create Workspace
export const createWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Workspace name is required");
  }

  const workspace = await Workspace.create({
    name: name.trim(),
    description: description ? description.trim() : "",
    owner: req.user._id,
    members: [{ user: req.user._id, role: "admin" }],
  });

  await invalidateWorkspaceCache(req.user._id.toString()); // NEW

  return res
    .status(201)
    .json(new ApiResponse(201, workspace, "Workspace created successfully"));
});

// Get User Workspaces
export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const cached = await getCachedWorkspaces(userId); // NEW
  if (cached) {
    return res
      .status(200)
      .json(new ApiResponse(200, cached, "Workspaces fetched successfully"));
  }

  const workspaces = await Workspace.find({
    $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
  })
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar");

  setCachedWorkspaces(userId, workspaces); // NEW — don't block the response

  return res
    .status(200)
    .json(new ApiResponse(200, workspaces, "Workspaces fetched successfully"));
});

// Delete Workspace (owner-only, cascades to its tasks + notifications)
export const deleteWorkspace = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid Workspace ID");
  }

  const workspace = await Workspace.findOne({ _id: id, owner: req.user._id });
  if (!workspace) {
    throw new ApiError(403, "Only the workspace owner can delete this workspace");
  }

  const workspaceTasks = await Task.find({ workspace: id }, "_id");
  const taskIds = workspaceTasks.map((t) => t._id);

  await Notification.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ workspace: id });
  await Workspace.findByIdAndDelete(id);

  // NEW: every member (owner + all members) had this workspace in their
  // cached list — invalidate all of them, not just the actor.
  const affectedUserIds = [
    workspace.owner.toString(),
    ...workspace.members.map((m) => m.user.toString()),
  ];
  await invalidateWorkspaceCacheForUsers(affectedUserIds);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { workspaceId: id, tasksDeleted: taskIds.length },
        "Workspace and its tasks deleted successfully"
      )
    );
});

// Remove Member
export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(memberId)) {
    throw new ApiError(400, "Invalid ID format");
  }

  const workspace = await Workspace.findOne({ _id: id, owner: req.user._id });
  if (!workspace) throw new ApiError(403, "Only the owner can remove members");

  if (memberId === req.user._id.toString()) {
    throw new ApiError(400, "The owner cannot be removed. Delete the workspace instead.");
  }

  workspace.members = workspace.members.filter((m) => m.user.toString() !== memberId);
  await workspace.save();

  // NEW: invalidate both the owner's cache (member list changed) and the
  // removed member's cache (this workspace disappears from their list).
  await invalidateWorkspaceCacheForUsers([req.user._id.toString(), memberId]);

  const populated = await workspace.populate("members.user", "name email avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, populated, "Member removed successfully"));
});