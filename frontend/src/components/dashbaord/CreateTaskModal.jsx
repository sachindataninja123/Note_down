import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { addTask } from "../../features/tasks/taskSlice";

export default function CreateTaskModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Medium",
    dueDate: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    const taskPromise = dispatch(
      addTask({
        ...newTask,
        category: newTask.category || null,
        dueDate: newTask.dueDate || null,
      })
    ).unwrap();

    toast.promise(taskPromise, {
      loading: "Creating task...",
      success: "Task created successfully!",
      error: (err) => err || "Failed to create task",
    });

    try {
      await taskPromise;
      setNewTask({ title: "", description: "", category: "", priority: "Medium", dueDate: "" });
      onClose();
    } catch {
      // Handled by toast.promise
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white">Create New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl font-bold cursor-pointer">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g., Deliver product roadmap"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
            <textarea
              rows="3"
              placeholder="Key objectives, guidelines, resources..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</label>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}