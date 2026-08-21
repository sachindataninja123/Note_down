import mongoose from "mongoose";
import Workspace from "../models/workspace.model.js";
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

// Add Member by Email
export const addMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body || {};

  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, "Invalid Workspace ID");
  if (!email) throw new ApiError(400, "User email is required");

  const workspace = await Workspace.findOne({ _id: id, owner: req.user._id });
  if (!workspace) {
    throw new ApiError(403, "Only the workspace owner can add members");
  }

  const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
  if (!userToAdd) {
    throw new ApiError(404, "No user found with this email");
  }

  const alreadyMember = workspace.members.some(
    (m) => m.user.toString() === userToAdd._id.toString(),
  );

  if (alreadyMember) {
    throw new ApiError(409, "User is already a member of this workspace");
  }

  workspace.members.push({
    user: userToAdd._id,
    role: role || "member",
  });

  await workspace.save();

  return res
    .status(200)
    .json(new ApiResponse(200, workspace, "Member added successfully"));
});

// Remove Member
export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(memberId)) {
    throw new ApiError(400, "Invalid ID format");
  }

  const workspace = await Workspace.findOne({ _id: id, owner: req.user._id });
  if (!workspace) throw new ApiError(403, "Only the owner can remove members");

  workspace.members = workspace.members.filter(
    (m) => m.user.toString() !== memberId,
  );

  await workspace.save();

  return res
    .status(200)
    .json(new ApiResponse(200, workspace, "Member removed successfully"));
});
