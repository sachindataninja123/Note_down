import React, { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  toggleTaskStatus,
  createSubtask,
  toggleSubtaskStatus,
  removeSubtask,
  uploadAttachment,
  removeAttachment,
} from "../../features/tasks/taskSlice";
import TaskComments from "./TaskComments";

export default function TaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onEdit,
  onRequestDelete,
}) {
  const dispatch = useDispatch();
  const [subtaskInput, setSubtaskInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  const handleAddSubtask = async () => {
    if (!subtaskInput.trim()) {
      toast.error("Subtask item cannot be empty");
      return;
    }

    try {
      await dispatch(
        createSubtask({
          taskId: task._id,
          title: subtaskInput.trim(),
        }),
      ).unwrap();

      toast.success("Subtask added");
      setSubtaskInput("");
    } catch {
      toast.error("Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await dispatch(
        toggleSubtaskStatus({
          taskId: task._id,
          subtaskId,
        }),
      ).unwrap();
    } catch {
      toast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await dispatch(
        removeSubtask({
          taskId: task._id,
          subtaskId,
        }),
      ).unwrap();

      toast.success("Subtask removed");
    } catch {
      toast.error("Failed to delete subtask");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setIsUploading(true);

    const uploadPromise = dispatch(
      uploadAttachment({
        taskId: task._id,
        file,
      }),
    ).unwrap();

    toast.promise(uploadPromise, {
      loading: `Uploading ${file.name}...`,
      success: "Attachment uploaded successfully!",
      error: "Failed to upload file",
    });

    uploadPromise.finally(() => setIsUploading(false));

    e.target.value = "";
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const deletePromise = dispatch(
      removeAttachment({
        taskId: task._id,
        attachmentId,
      }),
    ).unwrap();

    toast.promise(deletePromise, {
      loading: "Removing attachment...",
      success: "Attachment removed",
      error: "Failed to remove attachment",
    });
  };

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        task.completed
          ? "border-[#ECECE6] opacity-60"
          : "border-[#ECECE6] hover:border-[#D8D8D2] hover:shadow-[0_8px_30px_-15px_rgba(20,21,26,0.18)]"
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
                  className={`text-[13.5px] sm:text-[15px] font-semibold tracking-tight wrap-break-word ${
                    task.completed
                      ? "line-through text-[#B4B5BD]"
                      : "text-[#14151A]"
                  }`}
                >
                  {task.title}
                </h3>

                {task.description && (
                  <p className="mt-1 text-[11.5px] sm:text-xs text-[#8B8D98] line-clamp-2 leading-relaxed wrap-break-word ">
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
                  onClick={onToggleExpand}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-[#95959a] hover:text-[#14151A] hover:bg-[#F2F2EE] rounded-lg transition cursor-pointer"
                  title="Expand Subtasks & Files"
                  aria-label="Expand Subtasks and Files"
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => onRequestDelete(task)}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center text-[#95959a] hover:text-[#E14A2C] hover:bg-[#FFF1EC] rounded-lg transition cursor-pointer"
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

              {task.dueDate && (
                <span className="text-[9.5px] sm:text-[10.5px] text-[#63656F] flex items-center gap-1 font-medium bg-[#F7F7F5] px-2 py-1 rounded-md border border-[#ECECE6]">
                  <svg
                    className="w-3 h-3 text-[#8B8D98] shrink-0"
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

                  <span className="whitespace-nowrap">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </span>
              )}

              {totalSubtasks > 0 && (
                <span className="text-[9.5px] sm:text-[10.5px] text-[#63656F] flex items-center gap-1 font-medium bg-[#F7F7F5] px-2 py-1 rounded-md border border-[#ECECE6]">
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

      {/* =====================================================
          EXPANDED CONTENT
      ===================================================== */}
      {isExpanded && (
        <div className="px-3.5 sm:px-4 md:px-5 pb-4 sm:pb-5 pt-4 border-t border-[#ECECE6] bg-[#FAFAF8] space-y-5">
          {/* =================================================
              SUBTASKS
          ================================================= */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-[#8B8D98] uppercase tracking-wide">
                Subtasks
              </span>

              {totalSubtasks > 0 && (
                <span className="text-[10px] font-medium text-[#B4B5BD]">
                  {completedSubtasks}/{totalSubtasks} completed
                </span>
              )}
            </div>

            <div className="mt-2.5 space-y-1.5">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask._id}
                  className="flex items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-xl border border-[#ECECE6] hover:border-[#D8D8D2] transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask._id)}
                      className="w-3.5 h-3.5 accent-[#2F5DFF] rounded cursor-pointer shrink-0"
                    />

                    <span
                      className={`text-[12px] sm:text-sm wrap-break-word  ${
                        subtask.completed
                          ? "line-through text-[#B4B5BD]"
                          : "text-[#14151A] font-medium"
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteSubtask(subtask._id)}
                    className="w-7 h-7 flex items-center justify-center shrink-0 text-[#B4B5BD] hover:text-[#E14A2C] hover:bg-[#FFF1EC] rounded-lg transition cursor-pointer"
                    aria-label="Delete subtask"
                  >
                    &times;
                  </button>
                </div>
              ))}

              {/* Add Subtask */}
              <div className="flex flex-col xs:flex-row sm:flex-row gap-2 mt-2.5">
                <input
                  type="text"
                  placeholder="Add item..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  className="w-full min-w-0 bg-white border border-[#ECECE6] rounded-xl px-3 py-2.5 text-[11.5px] sm:text-xs text-[#14151A] placeholder-[#B4B5BD] outline-none focus:border-[#2F5DFF] focus:ring-2 focus:ring-[#2F5DFF]/10 transition"
                />

                <button
                  onClick={handleAddSubtask}
                  className="w-full sm:w-auto bg-[#432DD7] hover:bg-[#3622bd] active:scale-[0.98] text-white text-[11.5px] sm:text-xs px-4 py-2.5 rounded-xl font-semibold transition cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* =================================================
              ATTACHMENTS
          ================================================= */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-[#8B8D98] uppercase tracking-wide">
                Attachments
              </span>

              <label
                className={`text-[11px] sm:text-xs font-semibold text-[#2F5DFF] hover:text-[#1E46E0] cursor-pointer whitespace-nowrap ${
                  isUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {isUploading ? "Uploading…" : "+ Upload Image"}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Image Grid */}
            <div className="mt-2.5 grid grid-cols-3 xs:grid-cols-4 sm:flex sm:flex-wrap gap-2.5">
              {task.attachments?.map((att) => (
                <div
                  key={att._id}
                  className="group relative aspect-square w-full sm:w-20 md:w-22 sm:h-20 md:h-22 rounded-xl overflow-hidden border border-[#ECECE6] bg-[#F8F8F5]"
                >
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full h-full"
                  >
                    <img
                      src={att.url}
                      alt={att.fileName}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </a>

                  <button
                    onClick={() => handleDeleteAttachment(att._id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete image"
                  >
                    &times;
                  </button>
                </div>
              ))}

              {(!task.attachments || task.attachments.length === 0) && (
                <p className="col-span-full text-[11px] text-[#B4B5BD] py-1">
                  No images attached yet.
                </p>
              )}
            </div>
          </div>

          <TaskComments taskId={task._id} />
        </div>
      )}
    </div>
  );
}
