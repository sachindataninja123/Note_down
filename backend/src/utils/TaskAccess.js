import Task from "../models/task.model.js";
import Workspace from "../models/workspace.model.js";

/**
 * Checks whether `user` may read/write `taskId`.
 * Access is granted if the user owns the task, OR the task belongs to a
 * workspace the user is a member of (owner or in members[]).
 *
 * Returns the Task document (unpopulated) if access is allowed, else null.
 */
export const getAccessibleTask = async (taskId, user) => {
  const task = await Task.findById(taskId);
  if (!task) return null;

  if (task.owner.toString() === user._id.toString()) return task;

  if (task.workspace) {
    const isMember = await Workspace.exists({
      _id: task.workspace,
      $or: [{ owner: user._id }, { "members.user": user._id }],
    });
    if (isMember) return task;
  }

  return null;
};

/**
 * Confirms `user` is a member (owner or invited) of `workspaceId`.
 * Throws nothing — just returns true/false so callers decide how to respond.
 */
export const isWorkspaceMember = async (workspaceId, user) => {
  return Boolean(
    await Workspace.exists({
      _id: workspaceId,
      $or: [{ owner: user._id }, { "members.user": user._id }],
    })
  );
};