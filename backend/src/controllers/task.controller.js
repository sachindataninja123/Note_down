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

// --- TASK CRUD ---

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, category, priority, dueDate, subtasks, workspace } =
    req.body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Task title is required");
  }

  if (workspace) {
    if (!mongoose.isValidObjectId(workspace)) {
      throw new ApiError(400, "Invalid workspace ID");
    }
    const allowed = await isWorkspaceMember(workspace, req.user);
    if (!allowed) throw new ApiError(403, "You are not a member of this workspace");
  }

  const task = await Task.create({
    title: title.trim(),
    description: description ? description.trim() : "",
    category: category || null,
    priority: priority || "Medium",
    dueDate: dueDate ? new Date(dueDate) : null,
    subtasks: Array.isArray(subtasks) ? subtasks : [],
    workspace: workspace || null,
    owner: req.user._id,
  });

  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
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
    if (!allowed) throw new ApiError(403, "You do not have access to this workspace");

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

  const hasSearch = Boolean(search && search.trim());
  if (hasSearch) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  // CHANGED: search queries skip the cache entirely, both read and write.
  // Two reasons: (1) search terms are rarely repeated character-for-
  // character, so the hit rate would be near zero anyway, and (2) every
  // unique search string was getting SADD'd into that scope's tracked
  // key-set, which just bloats the set with entries that will basically
  // never be read again before their TTL expires. Filters like
  // status/category/priority stay cached since those DO repeat constantly
  // (every user clicking "Active" tab hits the exact same key).
  const cacheable = !hasSearch;

  if (cacheable) {
    const cached = await getCachedTasks(scope, req.query);
    if (cached) {
      return res.status(200).json(new ApiResponse(200, cached, "Tasks fetched successfully"));
    }
  }

  const tasks = await Task.find(query)
    .populate("category", "name color icon")
    .populate("owner", "name email")
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
    updates.description = typeof description === "string" ? description.trim() : "";
  }
  if (category !== undefined) updates.category = category || null;
  if (priority !== undefined) updates.priority = priority;
  if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

  const updatedTask = await Task.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
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
      new ApiResponse(200, task, `Task marked as ${task.completed ? "completed" : "active"}`)
    );
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const deletedTask = await Task.findOneAndDelete({ _id: id, owner: req.user._id });
  if (!deletedTask) throw new ApiError(404, "Task not found");

  await invalidateTaskCache(scopeFromTask(deletedTask));

  return res
    .status(200)
    .json(new ApiResponse(200, { taskId: deletedTask._id }, "Task deleted successfully"));
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
    { new: true, runValidators: true }
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
    { new: true }
  ).populate("category", "name color icon");

  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Subtask removed successfully"));
});