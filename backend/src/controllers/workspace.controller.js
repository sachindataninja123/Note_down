import mongoose from "mongoose";
import Workspace from "../models/workspace.model.js";
import Task from "../models/task.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  return res
    .status(201)
    .json(new ApiResponse(201, workspace, "Workspace created successfully"));
});

// Get User Workspaces
export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({
    $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
  })
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, workspaces, "Workspaces fetched successfully"));
});

// NEW: Delete Workspace (owner-only, cascades to its tasks + notifications)
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

  // NOTE: task attachments live on Cloudinary. Deleting the Task documents
  // does NOT delete the uploaded files there — if you care about orphaned
  // storage, loop each task's attachments and call
  // cloudinary.uploader.destroy(publicId) here before removing the tasks.
  // Left out by default since it turns this into N cloud API calls per
  // delete; wire it in if storage cost/cleanup matters for you.

  await Notification.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ workspace: id });
  await Workspace.findByIdAndDelete(id);

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

  // FIX: you can't remove the owner from their own workspace via this route
  // — that would leave the workspace ownerless while still existing.
  if (memberId === req.user._id.toString()) {
    throw new ApiError(400, "The owner cannot be removed. Delete the workspace instead.");
  }

  workspace.members = workspace.members.filter((m) => m.user.toString() !== memberId);
  await workspace.save();

  const populated = await workspace.populate("members.user", "name email avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, populated, "Member removed successfully"));
});