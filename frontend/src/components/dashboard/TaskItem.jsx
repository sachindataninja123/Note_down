import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { toggleTaskStatus } from "../../features/tasks/taskSlice";
import Badge from "../ui/Badge";
import { formatDue, isOverdue } from "../../utils/dates";
import { getStatusMeta, getTaskStatus } from "../../features/tasks/taskStatus";

export default function TaskItem({ task, onOpen, onEdit, onRequestDelete }) {
  const dispatch = useDispatch();

  const priorityStyles = {
    High: "bg-[#FFF1EC] text-[#E14A2C] border-[#FFD9CB]",
    Medium: "bg-[#FFF7E6] text-[#B7791F] border-[#FDE7B8]",
    Low: "bg-[#EFFAF3] text-[#178A4C] border-[#CDEFDC]",
  };

  const completedSubtasks =
    task.subtasks?.filter((s) => s.completed).length || 0;

  const totalSubtasks = task.subtasks?.length || 0;

  const handleToggleStatus = async () => {
    try {
      await dispatch(toggleTaskStatus(task._id)).unwrap();

      toast.success(task.completed ? "Task marked active" : "Task completed!", {
        icon: task.completed ? "🔄" : "✅",
      });
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        task.completed
          ? "border-line opacity-60"
          : "border-line hover:border-[#D8D8D2] hover:shadow-[0_8px_30px_-15px_rgba(20,21,26,0.18)]"
      }`}
    >
      {/* =====================================================
          MAIN TASK
      ===================================================== */}
      <div className="p-3.5 sm:p-4 md:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Checkbox */}
          <button
            onClick={handleToggleStatus}
            aria-label={
              task.completed ? "Mark task active" : "Mark task completed"
            }
            className={`w-5 h-5 sm:w-5.25 sm:h-5.25  mt-0.5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              task.completed
                ? "bg-[#2F5DFF] border-[#2F5DFF] text-white"
                : "border-[#D8D8D2] hover:border-[#2F5DFF] bg-white"
            }`}
          >
            {task.completed && (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Title + Actions */}
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h3
                  onClick={() => onOpen(task)}
                  className={`cursor-pointer hover:text-brand-600 text-[13.5px] sm:text-[15px] font-semibold tracking-tight wrap-break-word ${
                    task.completed
                      ? "line-through text-[#B4B5BD]"
                      : "text-ink-900"
                  }`}
                >
                  {task.title}
                </h3>

                {task.description && (
                  <p className="mt-1 text-[11.5px] sm:text-xs text-ink-400 line-clamp-2 leading-relaxed wrap-break-word ">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-[#95959a] hover:text-[#2553f8] hover:bg-[#EEF2FF] rounded-lg transition cursor-pointer"
                  title="Edit Task"
                  aria-label="Edit Task"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => onOpen(task)}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-[#95959a] hover:text-ink-900 hover:bg-[#F2F2EE] rounded-lg transition cursor-pointer"
                  title="Open details"
                  aria-label="Open task details"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => onRequestDelete(task)}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-[#95959a] hover:text-danger-600 hover:bg-[#FFF1EC] rounded-lg transition cursor-pointer"
                  title="Delete Task"
                  aria-label="Delete Task"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
              {task.category && (
                <span
                  style={{
                    backgroundColor: `${task.category.color}0F`,
                    color: task.category.color,
                    borderColor: `${task.category.color}35`,
                  }}
                  className="max-w-35 truncate text-[9.5px] sm:text-[10px] font-semibold px-2 py-1 rounded-md border"
                >
                  {task.category.name}
                </span>
              )}

              <span
                className={`text-[9.5px] sm:text-[10px] font-semibold px-2 py-1 rounded-md border ${
                  priorityStyles[task.priority] || priorityStyles.Medium
                }`}
              >
                {task.priority}
              </span>

              {getTaskStatus(task) !== "todo" && (
                <Badge tone={getStatusMeta(getTaskStatus(task)).tone}>
                  {getStatusMeta(getTaskStatus(task)).label}
                </Badge>
              )}

              {task.dueDate && (
                <span
                  className={`text-[9.5px] sm:text-[10.5px] flex items-center gap-1 font-medium px-2 py-1 rounded-md border ${
                    isOverdue(task, task.completed)
                      ? "text-danger-600 bg-danger-50 border-[#FFD9CB]"
                      : "text-[#63656F] bg-[#F7F7F5] border-line"
                  }`}
                  title={
                    isOverdue(task, task.completed) ? "Overdue" : "Due date"
                  }
                >
                  <svg
                    className="w-3 h-3 text-ink-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>

                  <span className="whitespace-nowrap">{formatDue(task)}</span>
                </span>
              )}

              {totalSubtasks > 0 && (
                <span className="text-[9.5px] sm:text-[10.5px] text-[#63656F] flex items-center gap-1 font-medium bg-[#F7F7F5] px-2 py-1 rounded-md border border-line">
                  <svg
                    className="w-3 h-3 text-[#2F5DFF] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}

              {/* ASSIGNED MEMBERS — new block goes here */}
              {task.assignedTo && task.assignedTo.length > 0 && (
                <span className="flex items-center -space-x-1.5">
                  {task.assignedTo.slice(0, 3).map((a) => (
                    <span
                      key={a._id}
                      title={a.name}
                      className="w-5 h-5 rounded-full bg-[#EEF2FF] text-[#2F5DFF] border border-white flex items-center justify-center text-[8px] font-bold"
                    >
                      {a.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
