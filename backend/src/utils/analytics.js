import { TASK_STATUSES } from "./taskStatus.js";

const PRIORITIES = ["High", "Medium", "Low"];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const RANGE_OPTIONS = [7, 30, 90];

/** "YYYY-MM-DD" shifted by n days (pure calendar math, no timezone involved). */
export const addDaysToKey = (key, n) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const isValidDayKey = (key) =>
  typeof key === "string" &&
  DAY_RE.test(key) &&
  !Number.isNaN(new Date(`${key}T00:00:00Z`).getTime()) &&
  new Date(`${key}T00:00:00Z`).toISOString().slice(0, 10) === key;

export const isValidTimeZone = (tz) => {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const formatters = new Map();
/** The calendar day a timestamp falls on in `timeZone`, as "YYYY-MM-DD". */
export const dayKeyInZone = (date, timeZone) => {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatters.set(timeZone, fmt);
  }
  return fmt.format(new Date(date));
};

// A due date is stored as UTC midnight of the day the user picked, so its
// calendar day is its UTC date (same rule as the frontend's utils/dates.js).
const dueDayKey = (dueDate) =>
  dueDate ? new Date(dueDate).toISOString().slice(0, 10) : null;

const taskStatusOf = (t) => t.status || (t.completed ? "done" : "todo");

/**
 * Pure analytics over a user's/workspace's tasks.
 *
 * `tasks` are lean docs with only: status, completed, priority, dueDate,
 * completedAt, createdAt, assignedTo. Counts come straight from these records
 * so they always match what the task list shows.
 *
 *  - Snapshot numbers (totals, byStatus, byPriority, overdue...) describe ALL
 *    tasks in scope as they are right now.
 *  - `period` and `trend` cover the last `rangeDays` days ending on `today`,
 *    with days bucketed in the viewer's `timeZone`.
 */
export function computeAnalytics(
  tasks,
  { today, rangeDays, timeZone, includeWorkload = false },
) {
  const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0]));
  const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p, 0]));

  const from = addDaysToKey(today, -(rangeDays - 1));
  const soon = addDaysToKey(today, 7);
  const trendIndex = new Map();
  const trend = Array.from({ length: rangeDays }, (_, i) => {
    const date = addDaysToKey(from, i);
    const row = { date, completed: 0, created: 0 };
    trendIndex.set(date, row);
    return row;
  });

  let overdue = 0;
  let dueToday = 0;
  let upcoming = 0;
  let createdInRange = 0;
  let completedInRange = 0;
  const workload = new Map();

  const bucketFor = (userId) => {
    const key = userId ? String(userId) : "unassigned";
    if (!workload.has(key)) {
      workload.set(key, {
        userId: userId ? key : null,
        open: 0,
        done: 0,
        overdue: 0,
      });
    }
    return workload.get(key);
  };

  for (const task of tasks) {
    const status = taskStatusOf(task);
    const isDone = status === "done";
    if (status in byStatus) byStatus[status] += 1;
    if (task.priority in byPriority) byPriority[task.priority] += 1;

    const due = dueDayKey(task.dueDate);
    const isOverdue = !isDone && due !== null && due < today;
    if (isOverdue) overdue += 1;
    if (!isDone && due === today) dueToday += 1;
    if (!isDone && due !== null && due > today && due <= soon) upcoming += 1;

    if (task.createdAt) {
      const row = trendIndex.get(dayKeyInZone(task.createdAt, timeZone));
      if (row) {
        row.created += 1;
        createdInRange += 1;
      }
    }
    if (isDone && task.completedAt) {
      const row = trendIndex.get(dayKeyInZone(task.completedAt, timeZone));
      if (row) {
        row.completed += 1;
        completedInRange += 1;
      }
    }

    if (includeWorkload) {
      const assignees = task.assignedTo?.length ? task.assignedTo : [null];
      for (const userId of assignees) {
        const b = bucketFor(userId);
        if (isDone) b.done += 1;
        else b.open += 1;
        if (isOverdue) b.overdue += 1;
      }
    }
  }

  const total = tasks.length;
  const done = byStatus.done;

  return {
    range: { days: rangeDays, from, to: today, timeZone },
    totals: {
      total,
      open: total - done,
      done,
      completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
      overdue,
      dueToday,
      upcoming,
    },
    byStatus,
    byPriority,
    period: { created: createdInRange, completed: completedInRange },
    trend,
    workload: includeWorkload ? [...workload.values()] : undefined,
  };
}