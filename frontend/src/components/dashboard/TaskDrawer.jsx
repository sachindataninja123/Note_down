import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Flag,
  Layers,
  Pencil,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  moveTask,
  createSubtask,
  toggleSubtaskStatus,
  removeSubtask,
  uploadAttachment,
  removeAttachment,
} from "../../features/tasks/taskSlice";
import { getTaskStatus } from "../../features/tasks/taskStatus";
import { formatDue, isDueToday, isOverdue } from "../../utils/dates";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import StatusSelect from "./StatusSelect";
import TaskComments from "./TaskComments";
import ActivityTimeline from "./ActivityTimeline";
import useActivityFeed from "../../hooks/useActivityFeed";
import activityService from "../../features/activity/activityService";

const PRIORITY_TONE = { High: "danger", Medium: "warning", Low: "success" };

function Section({ title, aside, children }) {
  return (
    <section className="border-t border-line px-5 py-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function MetaRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-[13px]">
      <span className="flex w-28 shrink-0 items-center gap-2 text-ink-400">
        <Icon size={15} aria-hidden="true" />
        {label}
      </span>
      <div className="min-w-0 flex-1 text-ink-900">{children}</div>
    </div>
  );
}

/**
 * Right-side task details (full screen on phones). Reads the task from Redux
 * by id, so edits, status moves and subtask toggles show up immediately.
 */
export default function TaskDrawer({ taskId, onClose, onEdit, onRequestDelete }) {
  const dispatch = useDispatch();
  const task = useSelector((s) => s.tasks.tasks.find((t) => t._id === taskId));
  const isSaving = useSelector((s) => Boolean(s.tasks.updatingTasks[taskId]));
  const commentCount = useSelector(
    (s) => s.comments.commentsByTask[taskId]?.length ?? 0,
  );
  const panelRef = useRef(null);

  // Reload the history (in place) whenever the task is saved or a comment is
  // added; both change this key.
  const activityFetch = useCallback(
    (cursor) => activityService.getTaskFeed(taskId, { before: cursor, limit: 10 }),
    [taskId],
  );
  const activityFeed = useActivityFeed({
    scope: taskId,
    refreshKey: `${task?.updatedAt || ""}|${commentCount}`,
    fetchPage: activityFetch,
  });

  const [subtaskInput, setSubtaskInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Close if the task vanishes (deleted, or filtered out by a refetch).
  useEffect(() => {
    if (!task) onClose();
  }, [task, onClose]);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!task) return null;

  const status = getTaskStatus(task);
  const done = status === "done";
  const subtasks = task.subtasks || [];
  const doneSubtasks = subtasks.filter((s) => s.completed).length;
  const progress = subtasks.length
    ? Math.round((doneSubtasks / subtasks.length) * 100)
    : 0;
  const assignees = (task.assignedTo || []).filter((a) => typeof a === "object");

  const handleStatus = async (next) => {
    if (next === status) return;
    try {
      await dispatch(moveTask({ taskId, status: next })).unwrap();
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Couldn't update status");
    }
  };

  const handleAddSubtask = async () => {
    const title = subtaskInput.trim();
    if (!title) {
      toast.error("Subtask cannot be empty");
      return;
    }
    try {
      await dispatch(createSubtask({ taskId, title })).unwrap();
      setSubtaskInput("");
    } catch {
      toast.error("Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await dispatch(toggleSubtaskStatus({ taskId, subtaskId })).unwrap();
    } catch {
      toast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await dispatch(removeSubtask({ taskId, subtaskId })).unwrap();
    } catch {
      toast.error("Failed to delete subtask");
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const promise = dispatch(uploadAttachment({ taskId, file })).unwrap();
    toast.promise(promise, {
      loading: `Uploading ${file.name}...`,
      success: "Attachment uploaded",
      error: "Failed to upload file",
    });
    promise.catch(() => {}).finally(() => setIsUploading(false));
    e.target.value = "";
  };

  const handleDeleteAttachment = (attachmentId) => {
    const promise = dispatch(removeAttachment({ taskId, attachmentId })).unwrap();
    toast.promise(promise, {
      loading: "Removing attachment...",
      success: "Attachment removed",
      error: "Failed to remove attachment",
    });
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Task details">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />

      <aside
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-pop outline-none sm:w-lg"
      >
        <header className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
          <Badge tone={done ? "success" : "neutral"}>{done ? "Completed" : "Open"}</Badge>
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit(task)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => onRequestDelete(task)} aria-label="Delete task">
              <span className="sr-only">Delete</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="rounded-lg p-1.5 text-ink-400 hover:bg-canvas hover:text-ink-900 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4">
            <h2 className={`text-lg font-bold wrap-break-word ${done ? "text-ink-400 line-through" : "text-ink-900"}`}>
              {task.title}
            </h2>
            {task.description ? (
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-600 wrap-break-word">
                {task.description}
              </p>
            ) : (
              <p className="mt-2 text-[13px] text-ink-400">No description.</p>
            )}

            <div className="mt-4">
              <MetaRow icon={Layers} label="Status">
                <StatusSelect value={status} disabled={isSaving} onChange={handleStatus} />
              </MetaRow>
              <MetaRow icon={Flag} label="Priority">
                <Badge tone={PRIORITY_TONE[task.priority] || "warning"}>{task.priority}</Badge>
              </MetaRow>
              <MetaRow icon={Tag} label="Category">
                {task.category ? (
                  <span
                    style={{
                      backgroundColor: `${task.category.color}0F`,
                      color: task.category.color,
                      borderColor: `${task.category.color}35`,
                    }}
                    className="rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                  >
                    {task.category.name}
                  </span>
                ) : (
                  <span className="text-ink-400">None</span>
                )}
              </MetaRow>
              <MetaRow icon={CalendarDays} label="Due date">
                {task.dueDate ? (
                  <span className="flex flex-wrap items-center gap-2">
                    {formatDue(task, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    {isOverdue(task, done) && <Badge tone="danger">Overdue</Badge>}
                    {isDueToday(task, done) && <Badge tone="warning">Due today</Badge>}
                  </span>
                ) : (
                  <span className="text-ink-400">No due date</span>
                )}
              </MetaRow>
              <MetaRow icon={Users} label="Assignees">
                {assignees.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {assignees.map((a) => (
                      <span key={a._id} className="rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                        {a.name}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-ink-400">{task.workspace ? "Unassigned" : "Personal task"}</span>
                )}
              </MetaRow>
            </div>
          </div>

          <Section
            title="Subtasks"
            aside={subtasks.length > 0 && <span className="text-[11px] font-medium text-ink-400">{doneSubtasks}/{subtasks.length} done</span>}
          >
            {subtasks.length > 0 && (
              <div
                className="mb-3 h-1.5 overflow-hidden rounded-full bg-canvas"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Subtask progress"
              >
                <div className="h-full rounded-full bg-success-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <ul className="space-y-1.5">
              {subtasks.map((st) => (
                <li key={st._id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                  <label className="flex min-w-0 cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st._id)}
                      className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-brand-600"
                    />
                    <span className={`text-[13px] wrap-break-word ${st.completed ? "text-ink-400 line-through" : "text-ink-900"}`}>
                      {st.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(st._id)}
                    aria-label={`Delete subtask ${st.title}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 cursor-pointer"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                aria-label="New subtask"
                placeholder="Add an item…"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                className="h-9 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-[13px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/10"
              />
              <Button size="sm" onClick={handleAddSubtask}>Add</Button>
            </div>
          </Section>

          <Section
            title="Attachments"
            aside={
              <label className={`inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 ${isUploading ? "pointer-events-none opacity-50" : ""}`}>
                <Upload size={14} aria-hidden="true" />
                {isUploading ? "Uploading…" : "Upload image"}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleUpload} disabled={isUploading} />
              </label>
            }
          >
            {task.attachments?.length ? (
              <ul className="grid grid-cols-3 gap-2.5">
                {task.attachments.map((att) => (
                  <li key={att._id} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-canvas">
                    <a href={att.url} target="_blank" rel="noreferrer" title={att.fileName} className="block h-full w-full">
                      <img src={att.url} alt={att.fileName} className="h-full w-full object-cover" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(att._id)}
                      aria-label={`Delete ${att.fileName}`}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 cursor-pointer"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-400">No images attached yet.</p>
            )}
          </Section>

          <div className="border-t border-line bg-[#FAFAF8] px-5 py-4">
            <TaskComments taskId={taskId} />
          </div>

          <Section title="Activity">
            <ActivityTimeline
              feed={activityFeed}
              showTask={false}
              compact
              emptyDescription="No recorded activity for this task yet."
            />
          </Section>
        </div>
      </aside>
    </div>
  );
}
