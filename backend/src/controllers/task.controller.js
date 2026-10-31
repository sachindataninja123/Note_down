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
import {
  assertValidStatus,
  buildStatusCondition,
} from "../utils/taskStatus.js";
import User from "../models/user.model.js";
import { logTaskActivity } from "../utils/activity.js";
import { diffTaskUpdate } from "../utils/taskActivity.js";

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
    status,
  } = req.body || {};

  if (status !== undefined) assertValidStatus(status);

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
    status: status || "todo",
    dueDate: dueDate ? new Date(dueDate) : null,
    subtasks: Array.isArray(subtasks) ? subtasks : [],
    workspace: workspace || null,
    assignedTo: validAssignees, // NEW
    owner: req.user._id,
  });

  await invalidateTaskCache(scopeFromTask(task));

  await logTaskActivity({
    task,
    actor: req.user,
    action: "task.created",
    details: { status: task.status, priority: task.priority },
  });

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

  const statusCondition = buildStatusCondition(status);
  if (statusCondition) query.status = statusCondition;
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
  const { title, description, category, priority, dueDate, status } =
    req.body || {};

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const accessible = await getAccessibleTask(id, req.user);
  if (!accessible) throw new ApiError(404, "Task not found");

  // Snapshot BEFORE the update so we can record exactly what changed.
  const before = {
    title: accessible.title,
    description: accessible.description,
    category: accessible.category,
    priority: accessible.priority,
    status: accessible.status,
    dueDate: accessible.dueDate,
  };

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
  if (status !== undefined) {
    assertValidStatus(status);
    updates.status = status;
    updates.completed = status === "done";
    updates.completedAt =
      status === "done" ? accessible.completedAt || new Date() : null;
  }
  if (dueDate !== undefined)
    updates.dueDate = dueDate ? new Date(dueDate) : null;

  const updatedTask = await Task.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true },
  )
    .populate("category", "name color icon")
    .populate("assignedTo", "name email avatar");

  await invalidateTaskCache(scopeFromTask(updatedTask));

  for (const event of diffTaskUpdate(before, updates)) {
    await logTaskActivity({ task: updatedTask, actor: req.user, ...event });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

export const toggleTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  // Setting status is enough: the model hook keeps `completed` in sync.
  const fromStatus = task.status;
  task.status = task.status === "done" ? "todo" : "done";
  await task.save();

  await invalidateTaskCache(scopeFromTask(task));
  await logTaskActivity({
    task,
    actor: req.user,
    action: "task.status_changed",
    details: { from: fromStatus, to: task.status },
  });

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

// PATCH /tasks/:id/status  { status } — used by the Kanban board.
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");
  assertValidStatus(status);

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  if (task.status !== status) {
    const fromStatus = task.status;
    task.status = status;
    await task.save();
    await invalidateTaskCache(scopeFromTask(task));
    await logTaskActivity({
      task,
      actor: req.user,
      action: "task.status_changed",
      details: { from: fromStatus, to: status },
    });
  }

  const populated = await task.populate([
    { path: "category", select: "name color icon" },
    { path: "owner", select: "name email" },
    { path: "assignedTo", select: "name email avatar" },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, populated, "Task status updated"));
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
  // History is kept after deletion; details.taskTitle says what it was.
  await logTaskActivity({ task, actor: req.user, action: "task.deleted" });

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
  const nextIds = userIds.map((id) => id.toString());
  const removed = previousAssignees.filter((id) => !nextIds.includes(id));

  const changedIds = [...newlyAssigned.map(String), ...removed];
  if (changedIds.length) {
    const users = await User.find({ _id: { $in: changedIds } }, "name").lean();
    const nameOf = (uid) =>
      users.find((u) => String(u._id) === String(uid))?.name || "a member";
    for (const uid of newlyAssigned) {
      await logTaskActivity({
        task,
        actor: req.user,
        action: "task.assignee_added",
        details: { targetUser: uid, targetName: nameOf(uid) },
      });
    }
    for (const uid of removed) {
      await logTaskActivity({
        task,
        actor: req.user,
        action: "task.assignee_removed",
        details: { targetUser: uid, targetName: nameOf(uid) },
      });
    }
  }
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
  await logTaskActivity({
    task,
    actor: req.user,
    action: "subtask.created",
    details: { subtaskTitle: title.trim() },
  });

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
  await logTaskActivity({
    task,
    actor: req.user,
    action: subtask.completed ? "subtask.completed" : "subtask.reopened",
    details: { subtaskTitle: subtask.title },
  });

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

  const removedSubtaskTitle = accessible.subtasks.id(subtaskId)?.title;

  const task = await Task.findByIdAndUpdate(
    id,
    { $pull: { subtasks: { _id: subtaskId } } },
    { new: true },
  ).populate("category", "name color icon");

  await invalidateTaskCache(scopeFromTask(task));
  if (removedSubtaskTitle) {
    await logTaskActivity({
      task,
      actor: req.user,
      action: "subtask.deleted",
      details: { subtaskTitle: removedSubtaskTitle },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Subtask removed successfully"));
});