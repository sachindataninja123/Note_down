import mongoose from "mongoose";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getAccessibleTask, isWorkspaceMember } from "../utils/taskAccess.js";
import {
  buildScope,
  scopeFromTask,
  getCachedTasks,
  setCachedTasks,
  invalidateTaskCache,
} from "../utils/taskCache.js";
import Notification from "../models/notification.model.js";
import Workspace from "../models/workspace.model.js";
import { invalidateNotificationCache } from "../utils/notificationCache.js";

// --- TASK CRUD ---

export const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    priority,
    dueDate,
    subtasks,
    workspace,
    assignedTo, // NEW
  } = req.body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Task title is required");
  }

  if (workspace) {
    if (!mongoose.isValidObjectId(workspace)) {
      throw new ApiError(400, "Invalid workspace ID");
    }
    const allowed = await isWorkspaceMember(workspace, req.user);
    if (!allowed)
      throw new ApiError(403, "You are not a member of this workspace");
  }

  // NEW: validate assignedTo — only meaningful on workspace tasks, and
  // every assignee must actually belong to that workspace.
  let validAssignees = [];
  if (assignedTo !== undefined && assignedTo !== null) {
    if (!Array.isArray(assignedTo)) {
      throw new ApiError(400, "assignedTo must be an array of user IDs");
    }

    if (assignedTo.length > 0 && !workspace) {
      throw new ApiError(400, "Personal tasks cannot be assigned to others");
    }

    for (const userId of assignedTo) {
      if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID in assignedTo list");
      }
      const isMember = await isWorkspaceMember(workspace, { _id: userId });
      if (!isMember) {
        throw new ApiError(
          400,
          "All assignees must be members of this workspace",
        );
      }
    }

    validAssignees = assignedTo;
  }

  const task = await Task.create({
    title: title.trim(),
    description: description ? description.trim() : "",
    category: category || null,
    priority: priority || "Medium",
    dueDate: dueDate ? new Date(dueDate) : null,
    subtasks: Array.isArray(subtasks) ? subtasks : [],
    workspace: workspace || null,
    assignedTo: validAssignees, // NEW
    owner: req.user._id,
  });

  await invalidateTaskCache(scopeFromTask(task));

  const populated = await task.populate([
    { path: "category", select: "name color icon" },
    { path: "assignedTo", select: "name email avatar" }, // NEW
  ]);

  for (const userId of validAssignees) {
    if (userId.toString() === req.user._id.toString()) continue;
    await Notification.create({
      recipient: userId,
      task: task._id,
      title: "Task assigned to you",
      message: `${req.user.name} assigned you to "${task.title}"`,
      type: "ASSIGNED",
    });
    await invalidateNotificationCache(userId.toString()); // NEW
  }

  return res
    .status(201)
    .json(new ApiResponse(201, populated, "Task created successfully"));
});

export const getAllTasks = asyncHandler(async (req, res) => {
  const { status, category, priority, search, workspace } = req.query;

  let query = {};
  let scope;

  if (workspace && workspace !== "personal") {
    if (!mongoose.isValidObjectId(workspace)) {
      throw new ApiError(400, "Invalid workspace ID");
    }
    const allowed = await isWorkspaceMember(workspace, req.user);
    if (!allowed)
      throw new ApiError(403, "You do not have access to this workspace");

    query.workspace = workspace;
    scope = buildScope({ workspaceId: workspace });
  } else {
    query.owner = req.user._id;
    query.workspace = null;
    scope = buildScope({ userId: req.user._id });
  }

  if (status === "active") query.completed = false;
  if (status === "completed") query.completed = true;
  if (category && category !== "All") query.category = category;
  if (priority && priority !== "All") query.priority = priority;

  if (req.query.assignedToMe === "true") {
    query.assignedTo = req.user._id;
  }

  const hasSearch = Boolean(search && search.trim());
  if (hasSearch) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  const cacheable = !hasSearch;

  if (cacheable) {
    const cached = await getCachedTasks(scope, req.query);
    if (cached) {
      return res
        .status(200)
        .json(new ApiResponse(200, cached, "Tasks fetched successfully"));
    }
  }

  const tasks = await Task.find(query)
    .populate("category", "name color icon")
    .populate("owner", "name email")
    .populate("assignedTo", "name email avatar")
    .sort({ completed: 1, createdAt: -1 });

  if (cacheable) {
    setCachedTasks(scope, req.query, tasks); // don't block the response on this
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const accessible = await getAccessibleTask(id, req.user);
  if (!accessible) throw new ApiError(404, "Task not found");

  const task = await Task.findById(id).populate("category", "name color icon");

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task fetched successfully"));
});

export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority, dueDate } = req.body || {};

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const accessible = await getAccessibleTask(id, req.user);
  if (!accessible) throw new ApiError(404, "Task not found");

  const updates = {};
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      throw new ApiError(400, "Title cannot be empty");
    }
    updates.title = title.trim();
  }
  if (description !== undefined) {
    updates.description =
      typeof description === "string" ? description.trim() : "";
  }
  if (category !== undefined) updates.category = category || null;
  if (priority !== undefined) updates.priority = priority;
  if (dueDate !== undefined)
    updates.dueDate = dueDate ? new Date(dueDate) : null;

  const updatedTask = await Task.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true },
  ).populate("category", "name color icon");

  await invalidateTaskCache(scopeFromTask(updatedTask));

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

export const toggleTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  task.completed = !task.completed;
  await task.save();

  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        task,
        `Task marked as ${task.completed ? "completed" : "active"}`,
      ),
    );
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, "Task not found");

  const isOwner = task.owner.toString() === req.user._id.toString();

  let isWorkspaceAdmin = false;
  if (task.workspace) {
    const workspace = await Workspace.findOne({
      _id: task.workspace,
      $or: [
        { owner: req.user._id },
        { members: { $elemMatch: { user: req.user._id, role: "admin" } } },
      ],
    });
    isWorkspaceAdmin = Boolean(workspace);
  }

  if (!isOwner && !isWorkspaceAdmin) {
    throw new ApiError(403, "This is not your task");
  }

  await Task.findByIdAndDelete(id);

  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(200)
    .json(
      new ApiResponse(200, { taskId: task._id }, "Task deleted successfully"),
    );
});

export const assignTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body || {}; // array of user IDs to assign

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");
  if (!Array.isArray(userIds))
    throw new ApiError(400, "userIds must be an array");

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  if (!task.workspace) {
    throw new ApiError(400, "Personal tasks cannot be assigned to others");
  }

  // Validate every proposed assignee is actually a workspace member
  for (const userId of userIds) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user ID in assignment list");
    }
    const allowed = await isWorkspaceMember(task.workspace, { _id: userId });
    if (!allowed) {
      throw new ApiError(
        400,
        "All assignees must be members of this workspace",
      );
    }
  }

  const previousAssignees = (task.assignedTo || []).map((a) => a.toString());
  task.assignedTo = userIds;
  await task.save();

  const populated = await task.populate([
    { path: "category", select: "name color icon" },
    { path: "assignedTo", select: "name email avatar" },
  ]);

  await invalidateTaskCache(scopeFromTask(task));

  // Notify newly-added assignees only (not people already assigned)
  const newlyAssigned = userIds.filter(
    (id) => !previousAssignees.includes(id.toString()),
  );
  for (const userId of newlyAssigned) {
    if (userId.toString() === req.user._id.toString()) continue;
    await Notification.create({
      recipient: userId,
      task: task._id,
      title: "Task assigned to you",
      message: `${req.user.name} assigned you to "${task.title}"`,
      type: "ASSIGNED",
    });
    await invalidateNotificationCache(userId.toString());
  }

  return res
    .status(200)
    .json(new ApiResponse(200, populated, "Task assignment updated"));
});

// --- SUBTASK ACTIONS ---

export const addSubtask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body || {};

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");
  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Subtask title is required");
  }

  const accessible = await getAccessibleTask(id, req.user);
  if (!accessible) throw new ApiError(404, "Task not found");

  const task = await Task.findByIdAndUpdate(
    id,
    { $push: { subtasks: { title: title.trim(), completed: false } } },
    { new: true, runValidators: true },
  ).populate("category", "name color icon");

  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Subtask added successfully"));
});

export const toggleSubtask = asyncHandler(async (req, res) => {
  const { id, subtaskId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(subtaskId)) {
    throw new ApiError(400, "Invalid Task or Subtask ID");
  }

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  const subtask = task.subtasks.id(subtaskId);
  if (!subtask) throw new ApiError(404, "Subtask not found");

  subtask.completed = !subtask.completed;
  await task.save();

  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Subtask status updated"));
});

export const deleteSubtask = asyncHandler(async (req, res) => {
  const { id, subtaskId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(subtaskId)) {
    throw new ApiError(400, "Invalid Task or Subtask ID");
  }

  const accessible = await getAccessibleTask(id, req.user);
  if (!accessible) throw new ApiError(404, "Task not found");

  const task = await Task.findByIdAndUpdate(
    id,
    { $pull: { subtasks: { _id: subtaskId } } },
    { new: true },
  ).populate("category", "name color icon");

  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Subtask removed successfully"));
});
