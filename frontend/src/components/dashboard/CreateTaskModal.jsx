// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import toast from "react-hot-toast";
// import { addTask } from "../../features/tasks/taskSlice";
// import Modal, { ModalHeader } from "../Modal";

// const inputClass =
//   "w-full bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#14151A] outline-none focus:border-[#2F5DFF] focus:bg-white focus:ring-2 focus:ring-[#2F5DFF]/10 transition";
// const labelClass = "block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5";

// export default function CreateTaskModal({ isOpen, onClose }) {
//   const dispatch = useDispatch();
//   const { categories } = useSelector((state) => state.categories);
//   const { currentWorkspace } = useSelector((state) => state.workspaces);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [newTask, setNewTask] = useState({
//     title: "",
//     description: "",
//     category: "",
//     priority: "Medium",
//     dueDate: "",
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!newTask.title.trim()) {
//       toast.error("Task title is required");
//       return;
//     }

//     setIsSubmitting(true);
//     const taskPromise = dispatch(
//       addTask({
//         ...newTask,
//         category: newTask.category || null,
//         dueDate: newTask.dueDate || null,
//         workspace: currentWorkspace?._id || null,
//       })
//     ).unwrap();

//     toast.promise(taskPromise, {
//       loading: "Creating task...",
//       success: "Task created successfully!",
//       error: (err) => err || "Failed to create task",
//     });

//     try {
//       await taskPromise;
//       setNewTask({ title: "", description: "", category: "", priority: "Medium", dueDate: "" });
//       onClose();
//     } catch {
//       // Handled by toast.promise
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} size="md">
//       <ModalHeader title="Create New Task" onClose={onClose} />
//       <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
//         <div>
//           <label className={labelClass}>Title</label>
//           <input
//             type="text"
//             placeholder="e.g., Deliver product roadmap"
//             value={newTask.title}
//             onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
//             required
//             autoFocus
//             className={inputClass}
//           />
//         </div>

//         <div>
//           <label className={labelClass}>Description</label>
//           <textarea
//             rows="3"
//             placeholder="Key objectives, guidelines, resources..."
//             value={newTask.description}
//             onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
//             className={inputClass}
//           />
//         </div>

//         <div className="grid grid-cols-2 gap-3">
//           <div>
//             <label className={labelClass}>Category</label>
//             <select
//               value={newTask.category}
//               onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
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
//               value={newTask.priority}
//               onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
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
//             value={newTask.dueDate}
//             onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
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
//             {isSubmitting ? "Creating..." : "Create Task"}
//           </button>
//         </div>
//       </form>
//     </Modal>
//   );
// }

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { addTask } from "../../features/tasks/taskSlice";
import Modal, { ModalHeader } from "../Modal";

const inputClass =
  "w-full bg-[#FAFAF8] border border-[#ECECE6] rounded-xl px-3.5 py-2.5 text-[13px] text-[#14151A] outline-none focus:border-[#2F5DFF] focus:bg-white focus:ring-2 focus:ring-[#2F5DFF]/10 transition";
const labelClass = "block text-[11px] font-semibold text-[#8B8D98] uppercase tracking-wide mb-1.5";

export default function CreateTaskModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Medium",
    dueDate: "",
  });

  const [selectedAssignees, setSelectedAssignees] = useState([]); // NEW

  const toggleAssignee = (userId) => { // NEW
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSubmitting(true);
    const taskPromise = dispatch(
      addTask({
        ...newTask,
        category: newTask.category || null,
        dueDate: newTask.dueDate || null,
        workspace: currentWorkspace?._id || null,
        assignedTo: currentWorkspace ? selectedAssignees : [], // NEW
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
      setSelectedAssignees([]); // NEW
      onClose();
    } catch {
      // Handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title="Create New Task" onClose={onClose} />
      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            placeholder="e.g., Deliver product roadmap"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
            autoFocus
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows="3"
            placeholder="Key objectives, guidelines, resources..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
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
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
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
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Assignees — only when creating inside a workspace */}
        {currentWorkspace && (
          <div>
            <label className={labelClass}>Assign To</label>
            <div className="flex flex-wrap gap-2">
              {currentWorkspace.members?.map((m) => {
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
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}