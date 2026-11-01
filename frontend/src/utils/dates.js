/**
 * Date helpers for due dates.
 *
 * A due date is stored as UTC midnight of the day the user picked in the
 * <input type="date"> (the edit form already reads it back with
 * toISOString().slice(0, 10)). So the calendar day of a due date is its UTC
 * date, while "today" is the viewer's LOCAL date. Mixing those two (as
 * toLocaleDateString does) shows the wrong day west of UTC, so every
 * calendar/overdue comparison goes through these helpers instead.
 */

const pad = (n) => String(n).padStart(2, "0");

/** Local-date key "YYYY-MM-DD" for a Date object. */
export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Local Date at midnight for a "YYYY-MM-DD" key. */
export const parseDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => toDateKey(new Date());

/** The calendar day a task is due, as "YYYY-MM-DD" (or null). */
export const dueKey = (task) => {
  if (!task?.dueDate) return null;
  const d = new Date(task.dueDate);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const isOverdue = (task, isDone) => {
  const key = dueKey(task);
  return Boolean(key) && !isDone && key < todayKey();
};

export const isDueToday = (task, isDone) =>
  Boolean(dueKey(task)) && !isDone && dueKey(task) === todayKey();

export const formatDateKey = (key, options) =>
  parseDateKey(key).toLocaleDateString(
    undefined,
    options || { month: "short", day: "numeric", year: "numeric" },
  );

export const formatDue = (task, options) => {
  const key = dueKey(task);
  return key ? formatDateKey(key, options) : "";
};

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

/** Start of the week containing `date`. weekStartsOn: 0 = Sunday, 1 = Monday. */
export const startOfWeek = (date, weekStartsOn = 1) => {
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - diff);
};

/** 7 days of the week containing `date`. */
export const getWeekDays = (date, weekStartsOn = 1) => {
  const start = startOfWeek(date, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

/** 6 full weeks (42 days) covering the month of `date`. */
export const getMonthGrid = (date, weekStartsOn = 1) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};