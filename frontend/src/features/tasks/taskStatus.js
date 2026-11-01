// Frontend mirror of backend/src/utils/taskStatus.js. Keep the two in sync.
export const TASK_STATUSES = [
  { value: "todo", label: "To Do", tone: "neutral" },
  { value: "in_progress", label: "In Progress", tone: "warning" },
  { value: "in_review", label: "In Review", tone: "info" },
  { value: "done", label: "Done", tone: "success" },
];

// Falls back to `completed` so a task that somehow arrives without `status`
// (e.g. an old cached response) still renders in the right column.
export const getTaskStatus = (task) =>
  task?.status || (task?.completed ? "done" : "todo");

export const getStatusMeta = (value) =>
  TASK_STATUSES.find((s) => s.value === value) || TASK_STATUSES[0];