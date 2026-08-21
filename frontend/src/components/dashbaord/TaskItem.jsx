import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  toggleTaskStatus,
  createSubtask,
  toggleSubtaskStatus,
  removeSubtask,
  uploadAttachment,
  removeAttachment,
} from "../../features/tasks/taskSlice";

export default function TaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onEdit,
  onRequestDelete,
}) {
  const dispatch = useDispatch();
  const [subtaskInput, setSubtaskInput] = useState("");

  const priorityStyles = {
    High: "bg-red-500/10 text-red-400 border-red-500/20",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    dispatch(createSubtask({ taskId: task._id, title: subtaskInput.trim() }));
    setSubtaskInput("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    dispatch(uploadAttachment({ taskId: task._id, file }));
  };

  return (
    <div
      className={`bg-slate-900/70 backdrop-blur-md rounded-3xl border transition-all duration-200 shadow-sm ${
        task.completed
          ? "border-slate-800/40 opacity-60"
          : "border-slate-800/80 hover:border-slate-700"
      }`}
    >
      <div className="p-5 flex items-start justify-between gap-4">
        {/* Checkbox & Text */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button
            onClick={() => dispatch(toggleTaskStatus(task._id))}
            className={`w-6 h-6 mt-0.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              task.completed
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-slate-700 hover:border-indigo-500 bg-slate-950/60"
            }`}
          >
            {task.completed && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="space-y-1 flex-1 min-w-0">
            <h3
              className={`text-sm font-semibold tracking-tight truncate ${
                task.completed ? "line-through text-slate-500" : "text-slate-100"
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {task.category && (
                <span
                  style={{
                    backgroundColor: `${task.category.color}15`,
                    color: task.category.color,
                    borderColor: `${task.category.color}30`,
                  }}
                  className="text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border"
                >
                  {task.category.name}
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium bg-slate-950/40 px-2 py-0.5 rounded-lg border border-slate-800">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              {totalSubtasks > 0 && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium bg-slate-950/40 px-2 py-0.5 rounded-lg border border-slate-800">
                  <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="text-slate-400 hover:text-indigo-400 p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            title="Edit Task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onToggleExpand}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
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
            className="text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 transition cursor-pointer"
            title="Delete Task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Accordion: Subtasks & Attachments */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 bg-slate-950/40 rounded-b-3xl space-y-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subtasks</span>
            <div className="mt-2 space-y-2">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask._id}
                  className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => dispatch(toggleSubtaskStatus({ taskId: task._id, subtaskId: subtask._id }))}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                    <span
                      className={`text-xs ${
                        subtask.completed ? "line-through text-slate-500" : "text-slate-200 font-medium"
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>
                  <button
                    onClick={() => dispatch(removeSubtask({ taskId: task._id, subtaskId: subtask._id }))}
                    className="text-slate-500 hover:text-red-400 text-sm px-1 cursor-pointer"
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleAddSubtask}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-xl font-semibold transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attachments</span>
              <label className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer">
                + Upload File
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {task.attachments?.map((att) => (
                <div
                  key={att._id}
                  className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300"
                >
                  <a href={att.url} target="_blank" rel="noreferrer" className="hover:text-indigo-400 truncate max-w-36">
                    📎 {att.fileName}
                  </a>
                  <button
                    onClick={() => dispatch(removeAttachment({ taskId: task._id, attachmentId: att._id }))}
                    className="text-slate-500 hover:text-red-400 ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}