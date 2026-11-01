import Activity from "../models/activity.model.js";

/**
 * Records one activity entry. It must NEVER break the action it describes,
 * so failures are logged and swallowed. Call it only AFTER the action has
 * succeeded, so a failed request never leaves a misleading "success" entry.
 */
export const logActivity = async ({
  workspace = null,
  task = null,
  actor,
  action,
  details = {},
}) => {
  try {
    await Activity.create({ workspace, task, actor, action, details });
  } catch (err) {
    console.error(`Activity log failed (${action}):`, err.message);
  }
};

/** Task-scoped shortcut: fills workspace/task and always records the title. */
export const logTaskActivity = ({ task, actor, action, details = {} }) =>
  logActivity({
    workspace: task.workspace || null,
    task: task._id,
    actor: actor._id || actor,
    action,
    details: { taskTitle: task.title, ...details },
  });

/** "someone@gmail.com" -> "s***@gmail.com" (workspace members can read feeds). */
export const maskEmail = (email = "") => {
  const [name = "", domain = ""] = String(email).split("@");
  return name ? `${name[0]}***@${domain}` : "";
};