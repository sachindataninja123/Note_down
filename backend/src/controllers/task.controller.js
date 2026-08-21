import mongoose from "mongoose";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getAccessibleTask, isWorkspaceMember } from "../utils/taskAccess.js";

// --- TASK CRUD ---

export const createTask = asyncHandler(async (req, res) => {
  // FIX: `workspace` was missing from the destructure, so shared tasks were
  // always created with workspace: null and never showed up for teammates.
  const {
    title,
    description,
    category,
    priority,
    dueDate,
    subtasks,
    workspace,
  } = req.body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Task title is required");
  }

  // FIX: verify the user actually belongs to the workspace before letting
  // them create a task inside it.
  if (workspace) {
    if (!mongoose.isValidObjectId(workspace)) {
      throw new ApiError(400, "Invalid workspace ID");
    }
    const allowed = await isWorkspaceMember(workspace, req.user);
    if (!allowed)
      throw new ApiError(403, "You are not a member of this workspace");
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

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

export const getAllTasks = asyncHandler(async (req, res) => {
  const { status, category, priority, search, workspace } = req.query;

  let query = {};

  if (workspace && workspace !== "personal") {
    // FIX: this used to trust any workspace ID from the query string and
    // return its tasks with no membership check (IDOR). Now verified first.
    if (!mongoose.isValidObjectId(workspace)) {
      throw new ApiError(400, "Invalid workspace ID");
    }
    const allowed = await isWorkspaceMember(workspace, req.user);
    if (!allowed)
      throw new ApiError(403, "You do not have access to this workspace");

    query.workspace = workspace;
  } else {
    // Personal mode: only show user's own tasks without a workspace
    query.owner = req.user._id;
    query.workspace = null;
  }

  if (status === "active") query.completed = false;
  if (status === "completed") query.completed = true;
  if (category && category !== "All") query.category = category;
  if (priority && priority !== "All") query.priority = priority;

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { description: { $regex: escaped, $options: "i" } },
    ];
  }

  const tasks = await Task.find(query)
    .populate("category", "name color icon")
    .populate("owner", "name email")
    .sort({ completed: 1, createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  // FIX: was hard-locked to owner only, so workspace teammates got a 404
  // on tasks they should be able to view.
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

  // FIX: `.trim()` was called unguarded — a non-string title/description
  // (or a title that trims to "") would throw a raw 500 instead of a 400.
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

  // NOTE: deleting is intentionally still owner-only — workspace members
  // can edit/toggle a shared task, but only the creator (or you could add
  // an "admin" role check here) can delete it. Adjust if that's not the
  // policy you want.
  const deletedTask = await Task.findOneAndDelete({
    _id: id,
    owner: req.user._id,
  });
  if (!deletedTask) throw new ApiError(404, "Task not found");

  // FIX: the frontend reducer filters on `action.payload.taskId`, which
  // this response never provided, so deleted tasks stayed in the UI list
  // until the next full refetch. Now included explicitly.
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { taskId: deletedTask._id },
        "Task deleted successfully",
      ),
    );
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

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Subtask removed successfully"));
});
