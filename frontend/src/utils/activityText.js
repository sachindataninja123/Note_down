import { getStatusMeta } from "../features/tasks/taskStatus";
import { formatDateKey } from "./dates";

const statusLabel = (value) => getStatusMeta(value).label;
const q = (text) => `“${text}”`;

/**
 * Turns an activity record into a readable sentence (without the actor's
 * name, which the UI shows separately). `showTask` is false inside a task's
 * own drawer, where "this task" reads better than repeating the title.
 */
export function describeActivity(activity, { showTask = true } = {}) {
  const d = activity.details || {};
  const task = showTask && d.taskTitle ? q(d.taskTitle) : "this task";

  switch (activity.action) {
    case "task.created":
      return showTask ? `created task ${task}` : "created this task";
    case "task.deleted":
      return `deleted task ${showTask ? task : q(d.taskTitle || "")}`.trim();
    case "task.updated": {
      const fields = (d.fields || []).join(", ");
      if (
        d.fields?.length === 1 &&
        d.fields[0] === "title" &&
        d.previousTitle
      ) {
        return `renamed ${q(d.previousTitle)} to ${q(d.taskTitle)}`;
      }
      return `edited the ${fields || "details"} of ${task}`;
    }
    case "task.status_changed":
      return `moved ${task} from ${statusLabel(d.from)} to ${statusLabel(d.to)}`;
    case "task.priority_changed":
      return `changed the priority of ${task} from ${d.from} to ${d.to}`;
    case "task.due_date_changed":
      if (!d.to) return `removed the due date of ${task}`;
      if (!d.from)
        return `set the due date of ${task} to ${formatDateKey(d.to)}`;
      return `changed the due date of ${task} from ${formatDateKey(d.from)} to ${formatDateKey(d.to)}`;
    case "task.assignee_added":
      return `assigned ${d.targetName || "someone"} to ${task}`;
    case "task.assignee_removed":
      return `unassigned ${d.targetName || "someone"} from ${task}`;
    case "subtask.created":
      return `added subtask ${q(d.subtaskTitle)} to ${task}`;
    case "subtask.completed":
      return `completed subtask ${q(d.subtaskTitle)} on ${task}`;
    case "subtask.reopened":
      return `reopened subtask ${q(d.subtaskTitle)} on ${task}`;
    case "subtask.deleted":
      return `deleted subtask ${q(d.subtaskTitle)} from ${task}`;
    case "comment.added":
      return `commented on ${task}`;
    case "attachment.uploaded":
      return `uploaded ${d.fileName || "an image"} to ${task}`;
    case "attachment.deleted":
      return `removed ${d.fileName || "an image"} from ${task}`;
    case "workspace.created":
      return `created the workspace ${q(d.workspaceName || "")}`;
    case "workspace.deleted":
      return `deleted the workspace ${q(d.workspaceName || "")} and its ${d.tasksDeleted ?? 0} task${d.tasksDeleted === 1 ? "" : "s"}`;
    case "member.invited":
      return `invited ${d.invitee || "someone"} as ${d.role || "member"}`;
    case "member.joined":
      return "joined the workspace";
    case "member.removed":
      return `removed ${d.targetName || "a member"} from the workspace`;
    default:
      return activity.action;
  }
}

export function timeAgo(isoDate, now = new Date()) {
  const diff = Math.max(0, now - new Date(isoDate));
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
