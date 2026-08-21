import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchTasks, removeTask } from "../features/tasks/taskSlice";
import { fetchCategories } from "../features/categories/categorySlice";

import Navbar from "../components/Navbar";
import PulseMark from "../components/PulseMark";
import StatsGrid from "../components/dashboard/StatsGrid";
import FilterBar from "../components/dashboard/FilterBar";
import TaskItem from "../components/dashboard/TaskItem";
import CreateTaskModal from "../components/dashboard/CreateTaskModal";
import CreateCategoryModal from "../components/dashboard/CreateCategoryModal";
import DeleteConfirmModal from "../components/dashboard/DeleteConfirmModal";
import EditTaskModal from "../components/dashboard/EditTaskModal";
import ManageCategoriesModal from "../components/dashboard/ManageCategoriesModal";

export default function Dashboard() {
  const dispatch = useDispatch();

  const { tasks, statusFilter, searchQuery, isLoading } = useSelector((state) => state.tasks);
  const { selectedCategory } = useSelector((state) => state.categories);
  const { currentWorkspace } = useSelector((state) => state.workspaces);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch, statusFilter, selectedCategory, searchQuery, currentWorkspace]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, progressPercent };
  }, [tasks]);

  const handleConfirmDelete = async () => {
    if (!deleteTaskTarget) return;

    const taskTitle = deleteTaskTarget.title;
    const deletePromise = dispatch(removeTask(deleteTaskTarget._id)).unwrap();

    toast.promise(deletePromise, {
      loading: "Deleting task...",
      success: `"${taskTitle}" deleted`,
      error: "Failed to delete task",
    });

    try {
      await deletePromise;
      setDeleteTaskTarget(null);
    } catch {
      // Handled by toast.promise
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#14151A] font-sans antialiased selection:bg-[#2F5DFF] selection:text-white">
      <Navbar onOpenTaskModal={() => setIsTaskModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <StatsGrid stats={stats} />
        <FilterBar onOpenCategoryModal={() => setIsCategoryModalOpen(true)} />

        {isLoading && tasks.length === 0 ? (
          <div className="py-28 flex flex-col items-center gap-3">
            <PulseMark variant="loading" className="w-32 h-7" />
            <p className="text-xs text-[#8B8D98] font-medium">Loading your tasks…</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-[#FAFAF8] rounded-2xl border border-dashed border-[#D8D8D2] py-20 text-center">
            <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#2F5DFF] flex items-center justify-center mx-auto mb-3 border border-[#DCE3FF]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-[#14151A] font-semibold text-sm">No tasks yet</p>
            <p className="text-[#8B8D98] text-xs mt-1">
              Create your first task to start tracking your work.
            </p>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                isExpanded={expandedTaskId === task._id}
                onToggleExpand={() =>
                  setExpandedTaskId(expandedTaskId === task._id ? null : task._id)
                }
                onEdit={(t) => setEditingTask(t)}
                onRequestDelete={(t) => setDeleteTaskTarget(t)}
              />
            ))}
          </div>
        )}
      </main>

      <CreateTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
      <EditTaskModal isOpen={Boolean(editingTask)} task={editingTask} onClose={() => setEditingTask(null)} />
      <ManageCategoriesModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
      <DeleteConfirmModal
        isOpen={Boolean(deleteTaskTarget)}
        taskTitle={deleteTaskTarget?.title || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTaskTarget(null)}
      />
    </div>
  );
}