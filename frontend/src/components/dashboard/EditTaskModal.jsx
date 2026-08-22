// import React, { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import toast from "react-hot-toast";
// import { editTask } from "../../features/tasks/taskSlice";
// import Modal, { ModalHeader } from "../Modal";

// const inputClass =
//   "w-full bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#14151A] outline-none focus:border-[#2F5DFF] focus:bg-white focus:ring-2 focus:ring-[#2F5DFF]/10 transition";
// const labelClass = "block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5";

// export default function EditTaskModal({ isOpen, task, onClose }) {
//   const dispatch = useDispatch();
//   const { categories } = useSelector((state) => state.categories);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     category: "",
//     priority: "Medium",
//     dueDate: "",
//   });

//   useEffect(() => {
//     if (task) {
//       setFormData({
//         title: task.title || "",
//         description: task.description || "",
//         category: task.category?._id || task.category || "",
//         priority: task.priority || "Medium",
//         dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
//       });
//     }
//   }, [task]);

//   if (!task) return null;

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.title.trim()) {
//       toast.error("Task title cannot be empty");
//       return;
//     }

//     setIsSubmitting(true);
//     const editPromise = dispatch(
//       editTask({
//         taskId: task._id,
//         taskData: {
//           ...formData,
//           category: formData.category || null,
//           dueDate: formData.dueDate || null,
//         },
//       })
//     ).unwrap();

//     toast.promise(editPromise, {
//       loading: "Saving changes...",
//       success: "Task updated successfully!",
//       error: (err) => err || "Failed to update task",
//     });

//     try {
//       await editPromise;
//       onClose();
//     } catch {
//       // Handled by toast.promise
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} size="md">
//       <ModalHeader title="Edit Task" onClose={onClose} />
//       <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
//         <div>
//           <label className={labelClass}>Title</label>
//           <input
//             type="text"
//             value={formData.title}
//             onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//             required
//             autoFocus
//             className={inputClass}
//           />
//         </div>

//         <div>
//           <label className={labelClass}>Description</label>
//           <textarea
//             rows="3"
//             value={formData.description}
//             onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//             className={inputClass}
//           />
//         </div>

//         <div className="grid grid-cols-2 gap-3">
//           <div>
//             <label className={labelClass}>Category</label>
//             <select
//               value={formData.category}
//               onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//               className={inputClass}
//             >
//               <option value="">No Category</option>
//               {categories.map((c) => (
//                 <option key={c._id} value={c._id}>
//                   {c.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className={labelClass}>Priority</label>
//             <select
//               value={formData.priority}
//               onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
//               className={inputClass}
//             >
//               <option value="Low">Low</option>
//               <option value="Medium">Medium</option>
//               <option value="High">High</option>
//             </select>
//           </div>
//         </div>

//         <div>
//           <label className={labelClass}>Due Date</label>
//           <input
//             type="date"
//             value={formData.dueDate}
//             onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
//             className={inputClass}
//           />
//         </div>

//         <div className="flex justify-end gap-2.5 pt-2">
//           <button
//             type="button"
//             onClick={onClose}
//             className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#63656F] bg-[#F2F2EE] hover:bg-[#ECECE6] transition cursor-pointer"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isSubmitting ? "Saving..." : "Update Task"}
//           </button>
//         </div>
//       </form>
//     </Modal>
//   );
// }

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { editTask, assignTask } from "../../features/tasks/taskSlice";
import Modal, { ModalHeader } from "../Modal";

const inputClass =
  "w-full bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#14151A] outline-none focus:border-[#2F5DFF] focus:bg-white focus:ring-2 focus:ring-[#2F5DFF]/10 transition";
const labelClass = "block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5";

export default function EditTaskModal({ isOpen, task, onClose }) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  const { workspaces } = useSelector((state) => state.workspaces);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Medium",
    dueDate: "",
  });

  const [selectedAssignees, setSelectedAssignees] = useState([]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category?._id || task.category || "",
        priority: task.priority || "Medium",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      });
      setSelectedAssignees(
        (task.assignedTo || []).map((a) => (typeof a === "string" ? a : a._id))
      );
    }
  }, [task]);

  if (!task) return null;

  // Task's own workspace, not currentWorkspace — editing a task should show
  // that task's own workspace members, even if the user has since switched
  // to viewing a different workspace elsewhere in the app.
  const taskWorkspace = task.workspace
    ? workspaces.find((w) => w._id === (task.workspace._id || task.workspace))
    : null;

  const toggleAssignee = (userId) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

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

      // Only hit the assign endpoint if this is a workspace task and the
      // assignee selection actually changed something — avoids an extra
      // API call + notification spam on every save when nothing changed.
      if (taskWorkspace) {
        const original = (task.assignedTo || [])
          .map((a) => (typeof a === "string" ? a : a._id))
          .sort()
          .join(",");
        const current = [...selectedAssignees].sort().join(",");

        if (original !== current) {
          await dispatch(
            assignTask({ taskId: task._id, userIds: selectedAssignees })
          ).unwrap();
        }
      }

      onClose();
    } catch (err) {
      // editTask errors handled by toast.promise; assignTask errors land here
      if (typeof err === "string") toast.error(err);
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

        {/* Assignees — only for workspace tasks */}
        {taskWorkspace && (
          <div>
            <label className={labelClass}>Assign To</label>
            <div className="flex flex-wrap gap-2">
              {taskWorkspace.members?.map((m) => {
                const memberId = m.user?._id || m.user;
                const memberName = m.user?.name || "Member";
                const isSelected = selectedAssignees.includes(memberId);
                return (
                  <button
                    key={memberId}
                    type="button"
                    onClick={() => toggleAssignee(memberId)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? "bg-[#2F5DFF] text-white border-[#2F5DFF]"
                        : "bg-[#FAFAF8] text-[#63656F] border-[#ECECE6] hover:border-[#D8D8D2]"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#ECECE6] text-[#63656F]"
                      }`}
                    >
                      {memberName[0]?.toUpperCase()}
                    </span>
                    {memberName}
                  </button>
                );
              })}
            </div>
            {(!taskWorkspace.members || taskWorkspace.members.length === 0) && (
              <p className="text-[11px] text-[#B4B5BD]">No members in this workspace yet.</p>
            )}
          </div>
        )}

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