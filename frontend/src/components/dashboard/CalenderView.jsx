import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getTaskStatus } from "../../features/tasks/taskStatus";
import {
  addDays,
  dueKey,
  formatDateKey,
  getMonthGrid,
  getWeekDays,
  isOverdue,
  toDateKey,
  todayKey,
} from "../../utils/dates";

const MONTH_CHIP_LIMIT = 3;

const STATUS_CHIP = {
  todo: "bg-canvas text-ink-600 border-line",
  in_progress: "bg-warning-50 text-warning-600 border-warning-50",
  in_review: "bg-info-50 text-info-600 border-info-50",
  done: "bg-success-50 text-success-600 border-success-50 line-through opacity-70",
};

const STATUS_DOT = {
  todo: "bg-ink-400",
  in_progress: "bg-warning-600",
  in_review: "bg-info-600",
  done: "bg-success-600",
};

function chipClass(task) {
  const status = getTaskStatus(task);
  return isOverdue(task, status === "done")
    ? "bg-danger-50 text-danger-600 border-danger-50"
    : STATUS_CHIP[status];
}

function TaskChip({ task, onOpen }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(task._id);
      }}
      title={task.title}
      className={`block w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] font-semibold cursor-pointer hover:brightness-95 ${chipClass(task)}`}
    >
      {task.title}
    </button>
  );
}

/**
 * Month / week calendar of tasks by due date. Read-only on dates: tasks can't
 * be dragged to reschedule (that is deliberately left out until the basics are
 * proven). Clicking a day creates a task with that day prefilled.
 */
export default function CalendarView({ tasks, onOpenTask, onCreateOnDate }) {
  const [mode, setMode] = useState("month"); // "month" | "week"
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const today = todayKey();

  const { byDay, undated } = useMemo(() => {
    const map = new Map();
    let missing = 0;
    for (const task of tasks) {
      const key = dueKey(task);
      if (!key) {
        missing += 1;
        continue;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(task);
    }
    // Open tasks first, finished ones last.
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          Number(getTaskStatus(a) === "done") -
          Number(getTaskStatus(b) === "done"),
      );
    }
    return { byDay: map, undated: missing };
  }, [tasks]);

  const days = useMemo(
    () => (mode === "month" ? getMonthGrid(cursor) : getWeekDays(cursor)),
    [mode, cursor],
  );

  const title =
    mode === "month"
      ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : `${days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const step = (direction) => {
    if (mode === "week") return setCursor((c) => addDays(c, 7 * direction));
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + direction, 1));
  };

  const goToday = () => {
    setCursor(new Date());
    setSelectedKey(todayKey());
  };

  // On phones a tap only selects the day (agenda below the grid) so a stray
  // tap can't open the create form; on larger screens a click creates.
  const handleCellClick = (key) => {
    setSelectedKey(key);
    if (window.matchMedia("(min-width: 640px)").matches) onCreateOnDate(key);
  };

  const selectedTasks = byDay.get(selectedKey) || [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={mode === "month" ? "Previous month" : "Previous week"}
            className="rounded-lg border border-line bg-surface p-1.5 text-ink-600 hover:bg-canvas cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={mode === "month" ? "Next month" : "Next week"}
            className="rounded-lg border border-line bg-surface p-1.5 text-ink-600 hover:bg-canvas cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-canvas cursor-pointer"
          >
            Today
          </button>
          <h3
            className="ml-2 text-sm font-bold text-ink-900"
            aria-live="polite"
          >
            {title}
          </h3>
        </div>

        <div
          role="tablist"
          aria-label="Calendar range"
          className="inline-flex rounded-xl border border-line bg-surface p-1"
        >
          {["month", "week"].map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize cursor-pointer ${
                mode === m
                  ? "bg-brand-600 text-white"
                  : "text-ink-600 hover:bg-canvas"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-[#FAFAF8]">
          {days.slice(0, 7).map((d) => (
            <div
              key={d.getDay()}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400"
            >
              {d.toLocaleDateString(undefined, { weekday: "short" })}
            </div>
          ))}
        </div>

        <div
          className={`grid grid-cols-7 ${mode === "month" ? "auto-rows-22 sm:auto-rows-[minmax(8.5rem,auto)]" : "auto-rows-64"}`}
        >
          {days.map((d) => {
            const key = toDateKey(d);
            const list = byDay.get(key) || [];
            const outside =
              mode === "month" && d.getMonth() !== cursor.getMonth();
            const isToday = key === today;
            const isSelected = key === selectedKey;
            const limit = mode === "month" ? MONTH_CHIP_LIMIT : list.length;
            const hidden = list.length - limit;

            return (
              <div
                key={key}
                onClick={() => handleCellClick(key)}
                className={`group relative min-w-0 border-b border-r border-line p-1 sm:p-1.5 cursor-pointer transition hover:bg-brand-50/40 ${
                  outside ? "bg-[#FAFAF8]" : ""
                } ${isSelected ? "ring-2 ring-inset ring-brand-600/40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isToday
                        ? "bg-brand-600 text-white"
                        : outside
                          ? "text-ink-400"
                          : "text-ink-900"
                    }`}
                    aria-label={`${formatDateKey(key, { weekday: "long", month: "long", day: "numeric" })}${isToday ? " (today)" : ""}`}
                  >
                    {d.getDate()}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateOnDate(key);
                    }}
                    aria-label={`Add task on ${formatDateKey(key)}`}
                    className="hidden h-5 w-5 items-center justify-center rounded-md text-ink-400 opacity-0 hover:bg-brand-50 hover:text-brand-600 focus:opacity-100 group-hover:opacity-100 sm:flex cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Phones: dots. Larger screens: titles. */}
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                  {list.slice(0, 6).map((t) => (
                    <span
                      key={t._id}
                      className={`h-1.5 w-1.5 rounded-full ${isOverdue(t, getTaskStatus(t) === "done") ? "bg-danger-600" : STATUS_DOT[getTaskStatus(t)]}`}
                    />
                  ))}
                </div>
                <div className="mt-1 hidden space-y-0.5 sm:block">
                  {list.slice(0, limit).map((t) => (
                    <TaskChip
                      key={t._id}
                      task={t}
                      onOpen={() => onOpenTask(t._id)}
                    />
                  ))}
                  {hidden > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCursor(d);
                        setMode("week");
                      }}
                      className="px-1 text-[11px] font-semibold text-brand-600 hover:underline cursor-pointer"
                    >
                      +{hidden} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phone agenda for the selected day */}
      <div className="mt-4 sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-bold text-ink-900">
            {formatDateKey(selectedKey, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </h4>
          <button
            type="button"
            onClick={() => onCreateOnDate(selectedKey)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 cursor-pointer"
          >
            <Plus size={14} /> Add task
          </button>
        </div>
        {selectedTasks.length === 0 ? (
          <p className="text-xs text-ink-400">No tasks due this day.</p>
        ) : (
          <ul className="space-y-1.5">
            {selectedTasks.map((t) => (
              <li key={t._id}>
                <TaskChip task={t} onOpen={() => onOpenTask(t._id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {undated > 0 && (
        <p className="mt-3 text-xs text-ink-400">
          {undated} task{undated === 1 ? "" : "s"} without a due date{" "}
          {undated === 1 ? "isn't" : "aren't"} shown on the calendar.
        </p>
      )}
    </div>
  );
}
