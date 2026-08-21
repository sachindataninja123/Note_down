import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, removeTask } from "../features/tasks/taskSlice";
import { fetchCategories } from "../features/categories/categorySlice";

import Navbar from "../components/Navbar";
import StatsGrid from "../components/dashbaord/StatsGrid";
import FilterBar from "../components/dashbaord/FilterBar";
import TaskItem from "../components/dashbaord/TaskItem";
import CreateTaskModal from "../components/dashbaord/CreateTaskModal";
import CreateCategoryModal from "../components/dashbaord/CreateCategoryModal";
import DeleteConfirmModal from "../components/dashbaord/DeleteConfirmModal";
import EditTaskModal from "../components/dashbaord/EditTaskModal";
import ManageCategoriesModal from "../components/dashbaord/ManageCategoriesModal";


export default function Dashboard() {
  const dispatch = useDispatch();

  const { tasks, statusFilter, searchQuery, isLoading } = useSelector((state) => state.tasks);
  const { selectedCategory } = useSelector((state) => state.categories);

  // Modals state
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
  }, [dispatch, statusFilter, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, progressPercent };
  }, [tasks]);

  const handleConfirmDelete = () => {
    if (deleteTaskTarget) {
      dispatch(removeTask(deleteTaskTarget._id));
      setDeleteTaskTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B13] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onOpenTaskModal={() => setIsTaskModalOpen(true)} />

      {/* Main Canvas */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <StatsGrid stats={stats} />
        <FilterBar onOpenCategoryModal={() => setIsCategoryModalOpen(true)} />

        {/* Task List */}
        {isLoading && tasks.length === 0 ? (
          <div className="py-24 flex justify-center text-indigo-400">
            <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-white font-semibold text-sm">No tasks found</p>
            <p className="text-slate-500 text-xs mt-1">Get started by creating your first task above.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {tasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                isExpanded={expandedTaskId === task._id}
                onToggleExpand={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                onEdit={(t) => setEditingTask(t)}
                onRequestDelete={(t) => setDeleteTaskTarget(t)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
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