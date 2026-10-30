import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { CalendarDays, CheckSquare } from "lucide-react";
import { moveTask } from "../../features/tasks/taskSlice";
import {
  TASK_STATUSES,
  getTaskStatus,
} from "../../features/tasks/taskStatus";
import Badge from "../ui/Badge";
import StatusSelect from "./StatusSelect";

const PRIORITY_TONE = { High: "danger", Medium: "warning", Low: "success" };

const COLUMN_ACCENT = {
  todo: "bg-ink-400",
  in_progress: "bg-warning-600",
  in_review: "bg-info-600",
  done: "bg-success-600",
};

const initials = (name = "") =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

function TaskCard({ task, status, isSaving, onOpen, onMove, onDragStart }) {
  const subtasks = task.subtasks || [];
  const doneSubtasks = subtasks.filter((s) => s.completed).length;
  const assignees = (task.assignedTo || []).filter((a) => typeof a === "object");
  const overdue =
    task.dueDate && status !== "done" && new Date(task.dueDate) < new Date();

  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      className={`rounded-xl border border-line bg-surface p-3 shadow-card transition ${
        isSaving ? "opacity-60" : "hover:border-[#D8D8D2]"
      } cursor-grab active:cursor-grabbing`}
    >
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="block w-full text-left text-[13px] font-semibold text-ink-900 hover:text-brand-600 cursor-pointer wrap-break-word"
      >
        {task.title}
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={PRIORITY_TONE[task.priority] || "warning"}>{task.priority}</Badge>
        {task.category && (
          <span
            style={{
              backgroundColor: `${task.category.color}0F`,
              color: task.category.color,
              borderColor: `${task.category.color}35`,
            }}
            className="max-w-28 truncate rounded-md border px-2 py-0.5 text-[11px] font-semibold"
          >
            {task.category.name}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-ink-400">
        <div className="flex items-center gap-2.5">
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                overdue ? "text-danger-600" : ""
              }`}
              title={overdue ? "Overdue" : "Due date"}
            >
              <CalendarDays size={12} aria-hidden="true" />
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {subtasks.length > 0 && (
            <span className="inline-flex items-center gap-1 font-medium">
              <CheckSquare size={12} aria-hidden="true" />
              {doneSubtasks}/{subtasks.length}
            </span>
          )}
        </div>

        {assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((a) => (
              <span
                key={a._id}
                title={a.name}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-brand-100 text-[9px] font-bold text-brand-600"
              >
                {initials(a.name)}
              </span>
            ))}
            {assignees.length > 3 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-canvas text-[9px] font-bold text-ink-600">
                +{assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <StatusSelect
          value={status}
          disabled={isSaving}
          onChange={(next) => onMove(task._id, next)}
          className="w-full"
        />
      </div>
    </article>
  );
}

export default function KanbanBoard({ tasks, onEdit }) {
  const dispatch = useDispatch();
  const updatingTasks = useSelector((s) => s.tasks.updatingTasks);
  const [dragOver, setDragOver] = useState(null);

  const columns = useMemo(() => {
    const grouped = Object.fromEntries(TASK_STATUSES.map((s) => [s.value, []]));
    for (const task of tasks) grouped[getTaskStatus(task)]?.push(task);
    return grouped;
  }, [tasks]);

  const handleMove = async (taskId, status) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || getTaskStatus(task) === status) return;
    try {
      await dispatch(moveTask({ taskId, status })).unwrap();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Couldn't move the task");
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    setDragOver(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) handleMove(taskId, status);
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
      <div className="grid min-w-[880px] grid-cols-4 gap-3 lg:min-w-0">
        {TASK_STATUSES.map((col) => (
          <section
            key={col.value}
            aria-label={`${col.label} column`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOver !== col.value) setDragOver(col.value);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null);
            }}
            onDrop={(e) => handleDrop(e, col.value)}
            className={`flex min-h-64 flex-col rounded-2xl border p-2.5 transition ${
              dragOver === col.value
                ? "border-brand-600 bg-brand-50"
                : "border-line bg-[#FAFAF8]"
            }`}
          >
            <header className="mb-2.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${COLUMN_ACCENT[col.value]}`} />
                <h3 className="text-xs font-bold text-ink-900">{col.label}</h3>
              </div>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-400 border border-line">
                {columns[col.value].length}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-2">
              {columns[col.value].map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  status={col.value}
                  isSaving={Boolean(updatingTasks[task._id])}
                  onOpen={onEdit}
                  onMove={handleMove}
                  onDragStart={handleDragStart}
                />
              ))}
              {columns[col.value].length === 0 && (
                <p className="m-auto px-2 py-6 text-center text-[11px] text-ink-400">
                  Drop a task here
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
