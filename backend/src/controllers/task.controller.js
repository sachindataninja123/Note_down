import mongoose from "mongoose";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// --- TASK CRUD ---

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, category, priority, dueDate, subtasks } = req.body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Task title is required");
  }

  const task = await Task.create({
    title: title.trim(),
    description: description ? description.trim() : "",
    category: category || null,
    priority: priority || "Medium",
    dueDate: dueDate ? new Date(dueDate) : null,
    subtasks: Array.isArray(subtasks) ? subtasks : [],
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

export const getAllTasks = asyncHandler(async (req, res) => {
  const { status, category, priority, search } = req.query;

  const query = { owner: req.user._id };

  if (status === "active") query.completed = false;
  if (status === "completed") query.completed = true;
  if (category && mongoose.isValidObjectId(category)) query.category = category;
  if (priority && priority !== "All") query.priority = priority;

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const tasks = await Task.find(query)
    .populate("category", "name color icon")
    .sort({ completed: 1, createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const task = await Task.findOne({ _id: id, owner: req.user._id }).populate(
    "category",
    "name color icon"
  );

  if (!task) throw new ApiError(404, "Task not found");

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task fetched successfully"));
});

export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority, dueDate } = req.body || {};

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const updates = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (category !== undefined) updates.category = category || null;
  if (priority !== undefined) updates.priority = priority;
  if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

  const updatedTask = await Task.findOneAndUpdate(
    { _id: id, owner: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  ).populate("category", "name color icon");

  if (!updatedTask) throw new ApiError(404, "Task not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

export const toggleTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const task = await Task.findOne({ _id: id, owner: req.user._id });
  if (!task) throw new ApiError(404, "Task not found");

  task.completed = !task.completed;
  await task.save();

  return res
    .status(200)
    .json(new ApiResponse(200, task, `Task marked as ${task.completed ? "completed" : "active"}`));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const deletedTask = await Task.findOneAndDelete({ _id: id, owner: req.user._id });
  if (!deletedTask) throw new ApiError(404, "Task not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

// --- SUBTASK ACTIONS (Step 1) ---

// Add Subtask
export const addSubtask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body || {};

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");
  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Subtask title is required");
  }

  const task = await Task.findOneAndUpdate(
    { _id: id, owner: req.user._id },
    { $push: { subtasks: { title: title.trim(), completed: false } } },
    { new: true, runValidators: true }
  ).populate("category", "name color icon");

  if (!task) throw new ApiError(404, "Task not found");

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Subtask added successfully"));
});

// Toggle Subtask Completion
export const toggleSubtask = asyncHandler(async (req, res) => {
  const { id, subtaskId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(subtaskId)) {
    throw new ApiError(400, "Invalid Task or Subtask ID");
  }

  const task = await Task.findOne({ _id: id, owner: req.user._id });
  if (!task) throw new ApiError(404, "Task not found");

  const subtask = task.subtasks.id(subtaskId);
  if (!subtask) throw new ApiError(404, "Subtask not found");

  subtask.completed = !subtask.completed;
  await task.save();

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Subtask status updated"));
});

// Delete Subtask
export const deleteSubtask = asyncHandler(async (req, res) => {
  const { id, subtaskId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(subtaskId)) {
    throw new ApiError(400, "Invalid Task or Subtask ID");
  }

  const task = await Task.findOneAndUpdate(
    { _id: id, owner: req.user._id },
    { $pull: { subtasks: { _id: subtaskId } } },
    { new: true }
  ).populate("category", "name color icon");

  if (!task) throw new ApiError(404, "Task not found");

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Subtask removed successfully"));
});