import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { editTask } from "../../features/tasks/taskSlice";
import Modal, { ModalHeader } from "../Modal";

const inputClass =
  "w-full bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#14151A] outline-none focus:border-[#2F5DFF] focus:bg-white focus:ring-2 focus:ring-[#2F5DFF]/10 transition";
const labelClass = "block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5";

export default function EditTaskModal({ isOpen, task, onClose }) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Medium",
    dueDate: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category?._id || task.category || "",
        priority: task.priority || "Medium",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      });
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }

    setIsSubmitting(true);
    const editPromise = dispatch(
      editTask({
        taskId: task._id,
        taskData: {
          ...formData,
          category: formData.category || null,
          dueDate: formData.dueDate || null,
        },
      })
    ).unwrap();

    toast.promise(editPromise, {
      loading: "Saving changes...",
      success: "Task updated successfully!",
      error: (err) => err || "Failed to update task",
    });

    try {
      await editPromise;
      onClose();
    } catch {
      // Handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title="Edit Task" onClose={onClose} />
      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputClass}
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
            <label className={labelClass}>Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className={inputClass}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Due Date</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#63656F] bg-[#F2F2EE] hover:bg-[#ECECE6] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Update Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}