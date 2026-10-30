import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchTasks, removeTask, setViewMode } from "../features/tasks/taskSlice";
import { getTaskStatus } from "../features/tasks/taskStatus";
import { fetchCategories } from "../features/categories/categorySlice";

import AppShell from "../components/layout/AppShell";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { ClipboardList, Plus } from "lucide-react";
import PulseMark from "../components/PulseMark";
import StatsGrid from "../components/dashboard/StatsGrid";
import FilterBar from "../components/dashboard/FilterBar";
import KanbanBoard from "../components/dashboard/KanbanBoard";
import ViewSwitcher from "../components/dashboard/ViewSwitcher";
import TaskItem from "../components/dashboard/TaskItem";
import CreateTaskModal from "../components/dashboard/CreateTaskModal";
import DeleteConfirmModal from "../components/dashboard/DeleteConfirmModal";
import EditTaskModal from "../components/dashboard/EditTaskModal";
import ManageCategoriesModal from "../components/dashboard/ManageCategoriesModal";

export default function Dashboard() {
  const dispatch = useDispatch();

  const { tasks, statusFilter, searchQuery, assignedToMe, isLoading, viewMode } =
    useSelector((state) => state.tasks);
  const { selectedCategory } = useSelector((state) => state.categories);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const user = useSelector((state) => state.auth.user);

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
  }, [
    dispatch,
    statusFilter,
    selectedCategory,
    searchQuery,
    currentWorkspace,
    assignedToMe,
    viewMode,
  ]);

  const stats = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
    for (const t of tasks) counts[getTaskStatus(t)] += 1;
    const total = tasks.length;
    const progressPercent =
      total === 0 ? 0 : Math.round((counts.done / total) * 100);
    return {
      total,
      todo: counts.todo,
      inProgress: counts.in_progress,
      inReview: counts.in_review,
      completed: counts.done,
      progressPercent,
    };
  }, [tasks]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleConfirmDelete = async () => {
    if (!deleteTaskTarget) return;

    const taskTitle = deleteTaskTarget.title;
    const deletePromise = dispatch(removeTask(deleteTaskTarget._id)).unwrap();

    toast.promise(deletePromise, {
      loading: "Deleting task...",
      success: `"${taskTitle}" deleted`,
      error: (err) => err || "Failed to delete task",
    });

    try {
      await deletePromise;
      setDeleteTaskTarget(null);
    } catch {
      // Handled by toast.promise
    }
  };

  return (
    <AppShell
      title="Overview"
      showSearch
      onCreateTask={() => setIsTaskModalOpen(true)}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[24px] font-semibold text-ink-700 capitalize">
            {greeting}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-[14px] font-normal tracking-normal text-ink-600">
            {today} · {currentWorkspace ? currentWorkspace.name : "Personal tasks"}
          </p>
        </div>
        <ViewSwitcher
          value={viewMode}
          onChange={(v) => dispatch(setViewMode(v))}
        />
      </div>

        <StatsGrid stats={stats} />
        <FilterBar
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          hideStatus={viewMode === "board"}
        />

        {isLoading && tasks.length === 0 ? (
          <div className="py-28 flex flex-col items-center gap-3">
            <PulseMark variant="loading" className="w-32 h-7" />
            <p className="text-xs text-ink-400 font-medium">
              Loading your tasks…
            </p>
          </div>
        ) : viewMode === "board" ? (
          <KanbanBoard tasks={tasks} onEdit={(t) => setEditingTask(t)} />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks here"
            description="Create a task, or adjust your filters if you expected to see some."
            action={
              <Button icon={Plus} onClick={() => setIsTaskModalOpen(true)}>
                New Task
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                isExpanded={expandedTaskId === task._id}
                onToggleExpand={() =>
                  setExpandedTaskId(
                    expandedTaskId === task._id ? null : task._id,
                  )
                }
                onEdit={(t) => setEditingTask(t)}
                onRequestDelete={(t) => setDeleteTaskTarget(t)}
              />
            ))}
          </div>
        )}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
      <EditTaskModal
        isOpen={Boolean(editingTask)}
        task={editingTask}
        onClose={() => setEditingTask(null)}
      />
      <ManageCategoriesModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
      <DeleteConfirmModal
        isOpen={Boolean(deleteTaskTarget)}
        taskTitle={deleteTaskTarget?.title || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTaskTarget(null)}
      />
    </AppShell>
  );
}
