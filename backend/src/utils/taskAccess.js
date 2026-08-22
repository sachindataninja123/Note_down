import Task from "../models/task.model.js";
import Workspace from "../models/workspace.model.js";

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

export const isWorkspaceMember = async (workspaceId, user) => {
  return Boolean(
    await Workspace.exists({
      _id: workspaceId,
      $or: [{ owner: user._id }, { "members.user": user._id }],
    }),
  );
};
