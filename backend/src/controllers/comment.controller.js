import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getAccessibleTask } from "../utils/taskAccess.js";
import Workspace from "../models/workspace.model.js";

// Extract @Name mentions from comment text and resolve them against
// workspace members. Matches "@" followed by letters/spaces up to the
// next "@", comma, or line break — good enough for a first pass without
// building a full mention-picker protocol on the frontend yet.
const resolveMentions = async (text, workspaceId) => {
  if (!workspaceId) return []; // no mentions possible on Personal tasks

  const matches = [...text.matchAll(/@([a-zA-Z\s]+?)(?=[@,.\n]|$)/g)].map(
    (m) => m[1].trim().toLowerCase()
  );
  if (matches.length === 0) return [];

  const workspace = await Workspace.findById(workspaceId).populate(
    "members.user",
    "name"
  );
  if (!workspace) return [];

  const mentionedIds = [];
  for (const m of workspace.members) {
    if (matches.includes(m.user.name.toLowerCase())) {
      mentionedIds.push(m.user._id);
    }
  }
  return mentionedIds;
};

export const addComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { text } = req.body || {};

  if (!mongoose.isValidObjectId(taskId)) throw new ApiError(400, "Invalid Task ID");
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new ApiError(400, "Comment text is required");
  }

  const task = await getAccessibleTask(taskId, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  const mentions = await resolveMentions(text.trim(), task.workspace);

  const comment = await Comment.create({
    task: taskId,
    author: req.user._id,
    text: text.trim(),
    mentions,
  });

  const populated = await comment.populate("author", "name email avatar");

  // Notify mentioned users (skip notifying yourself)
  for (const userId of mentions) {
    if (userId.toString() === req.user._id.toString()) continue;
    await Notification.create({
      recipient: userId,
      task: taskId,
      title: "You were mentioned",
      message: `${req.user.name} mentioned you in "${task.title}"`,
      type: "MENTION",
    });
  }

  // Notify the task assignee(s) too, if they didn't write the comment
  // and weren't already mentioned (avoid double notifications).
  if (Array.isArray(task.assignedTo)) {
    for (const assigneeId of task.assignedTo) {
      const isAuthor = assigneeId.toString() === req.user._id.toString();
      const alreadyMentioned = mentions.some((m) => m.toString() === assigneeId.toString());
      if (isAuthor || alreadyMentioned) continue;

      await Notification.create({
        recipient: assigneeId,
        task: taskId,
        title: "New comment",
        message: `${req.user.name} commented on "${task.title}"`,
        type: "COMMENT",
      });
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Comment added successfully"));
});

export const getComments = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  if (!mongoose.isValidObjectId(taskId)) throw new ApiError(400, "Invalid Task ID");

  const task = await getAccessibleTask(taskId, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  const comments = await Comment.find({ task: taskId })
    .populate("author", "name email avatar")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { taskId, commentId } = req.params;
  if (!mongoose.isValidObjectId(taskId) || !mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid ID format");
  }

  const comment = await Comment.findOne({ _id: commentId, task: taskId });
  if (!comment) throw new ApiError(404, "Comment not found");

  // Author-only delete
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own comments");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));
});