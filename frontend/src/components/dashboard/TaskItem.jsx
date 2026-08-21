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

export default function TaskItem({ task, isExpanded, onToggleExpand, onEdit, onRequestDelete }) {
  const dispatch = useDispatch();
  const [subtaskInput, setSubtaskInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const priorityStyles = {
    High: "bg-[#FFF1EC] text-[#E14A2C] border-[#FFD9CB]",
    Medium: "bg-[#FFF7E6] text-[#B7791F] border-[#FDE7B8]",
    Low: "bg-[#EFFAF3] text-[#178A4C] border-[#CDEFDC]",
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
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
      await dispatch(createSubtask({ taskId: task._id, title: subtaskInput.trim() })).unwrap();
      toast.success("Subtask added");
      setSubtaskInput("");
    } catch {
      toast.error("Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await dispatch(toggleSubtaskStatus({ taskId: task._id, subtaskId })).unwrap();
    } catch {
      toast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await dispatch(removeSubtask({ taskId: task._id, subtaskId })).unwrap();
      toast.success("Subtask removed");
    } catch {
      toast.error("Failed to delete subtask");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const uploadPromise = dispatch(uploadAttachment({ taskId: task._id, file })).unwrap();

    toast.promise(uploadPromise, {
      loading: `Uploading ${file.name}...`,
      success: "Attachment uploaded successfully!",
      error: "Failed to upload file",
    });

    uploadPromise.finally(() => setIsUploading(false));
    // FIX: allow re-selecting the same file (input value wasn't reset before)
    e.target.value = "";
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const deletePromise = dispatch(removeAttachment({ taskId: task._id, attachmentId })).unwrap();
    toast.promise(deletePromise, {
      loading: "Removing attachment...",
      success: "Attachment removed",
      error: "Failed to remove attachment",
    });
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 ${
        task.completed ? "border-[#ECECE6] opacity-60" : "border-[#ECECE6] hover:border-[#D8D8D2] hover:shadow-[0_2px_10px_-4px_rgba(20,21,26,0.08)]"
      }`}
    >
      <div className="p-4 flex items-start justify-between gap-4">
        {/* Checkbox & Text */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <button
            onClick={handleToggleStatus}
            className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              task.completed
                ? "bg-[#2F5DFF] border-[#2F5DFF] text-white"
                : "border-[#D8D8D2] hover:border-[#2F5DFF] bg-white"
            }`}
          >
            {task.completed && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="space-y-1 flex-1 min-w-0">
            <h3
              className={`text-[13.5px] font-semibold tracking-tight truncate ${
                task.completed ? "line-through text-[#B4B5BD]" : "text-[#14151A]"
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-[#8B8D98] line-clamp-2 leading-relaxed">{task.description}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              {task.category && (
                <span
                  style={{
                    backgroundColor: `${task.category.color}0F`,
                    color: task.category.color,
                    borderColor: `${task.category.color}35`,
                  }}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                >
                  {task.category.name}
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className="text-[10.5px] text-[#63656F] flex items-center gap-1 font-medium font-mono bg-[#F7F7F5] px-2 py-0.5 rounded-md border border-[#ECECE6]">
                  <svg className="w-3 h-3 text-[#8B8D98]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              {totalSubtasks > 0 && (
                <span className="text-[10.5px] text-[#63656F] flex items-center gap-1 font-medium font-mono bg-[#F7F7F5] px-2 py-0.5 rounded-md border border-[#ECECE6]">
                  <svg className="w-3 h-3 text-[#2F5DFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="text-[#95959a] hover:text-[#2553f8] p-1.5 rounded-lg hover:bg-[#EEF2FF] transition cursor-pointer"
            title="Edit Task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onToggleExpand}
            className="text-[#95959a] hover:text-[#14151A] p-1.5 rounded-lg hover:bg-[#F2F2EE] transition cursor-pointer"
            title="Expand Subtasks & Files"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => onRequestDelete(task)}
            className="text-[#95959a] hover:text-[#E14A2C] p-1.5 rounded-lg hover:bg-[#FFF1EC] transition cursor-pointer"
            title="Delete Task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Accordion */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 border-t border-[#ECECE6] bg-[#FAFAF8] rounded-b-2xl space-y-4">
          {/* Subtasks */}
          <div>
            <span className="text-[10.5px] font-semibold text-[#8B8D98] uppercase tracking-wide">Subtasks</span>
            <div className="mt-2 space-y-1.5">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask._id}
                  className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#ECECE6]"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask._id)}
                      className="w-3.5 h-3.5 accent-[#2F5DFF] rounded cursor-pointer"
                    />
                    <span className={`text-xs ${subtask.completed ? "line-through text-[#B4B5BD]" : "text-[#14151A] font-medium"}`}>
                      {subtask.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubtask(subtask._id)}
                    className="text-[#B4B5BD] hover:text-[#E14A2C] text-sm px-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Add item..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  className="w-full bg-white border border-[#ECECE6] rounded-lg px-3 py-2 text-xs text-[#14151A] placeholder-[#B4B5BD] outline-none focus:border-[#2F5DFF]"
                />
                <button
                  onClick={handleAddSubtask}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-semibold text-[#8B8D98] uppercase tracking-wide">Attachments</span>
              <label className={`text-xs font-semibold text-[#2F5DFF] hover:text-[#1E46E0] cursor-pointer ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                {isUploading ? "Uploading…" : "+ Upload File"}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {task.attachments?.map((att) => (
                <div
                  key={att._id}
                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#ECECE6] text-xs text-[#63656F]"
                >
                  <a href={att.url} target="_blank" rel="noreferrer" className="hover:text-[#2F5DFF] truncate max-w-36">
                    📎 {att.fileName}
                  </a>
                  <button
                    onClick={() => handleDeleteAttachment(att._id)}
                    className="text-[#B4B5BD] hover:text-[#E14A2C] ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {(!task.attachments || task.attachments.length === 0) && (
                <p className="text-[11px] text-[#B4B5BD]">No files attached yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}