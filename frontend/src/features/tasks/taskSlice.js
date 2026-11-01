import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import taskService from "./taskService";

const VIEW_KEY = "taskpulse:taskView";
const getStoredView = () => {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "board" || v === "calendar" ? v : "list";
  } catch {
    return "list";
  }
};

const initialState = {
  viewMode: getStoredView(), // "list" | "board" | "calendar"
  tasks: [],
  currentTask: null,
  statusFilter: "all",
  searchQuery: "",
  assignedToMe: false, // NEW
  isLoading: false,
  isError: false,
  message: "",
  updatingTasks: {},
  pendingMoves: {},
};

// Query params for the current filters / workspace. Shared by the normal
// fetch and the silent real-time refresh so both ask for exactly the same list.
const buildTaskParams = (state) => {
  const { statusFilter, searchQuery, assignedToMe, viewMode } = state.tasks;
  const { selectedCategory } = state.categories;
  const { currentWorkspace } = state.workspaces;

  const params = {};
  // Board and Calendar need every status, so the status filter only
  // applies to the List view.
  if (viewMode === "list" && statusFilter !== "all")
    params.status = statusFilter;
  if (selectedCategory && selectedCategory !== "All")
    params.category = selectedCategory;
  if (searchQuery.trim()) params.search = searchQuery.trim();
  if (assignedToMe) params.assignedToMe = "true"; // NEW

  params.workspace = currentWorkspace?._id ? currentWorkspace._id : "personal";
  return params;
};

export const fetchTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (_, thunkAPI) => {
    try {
      return await taskService.getTasks(buildTaskParams(thunkAPI.getState()));
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

// Silent re-fetch used when a real-time event (or a reconnect) says the list
// may be out of date. No loading flag, and it never overwrites the list while
// this user has a change in flight or after the view has changed underneath it.
export const refreshTasks = createAsyncThunk(
  "tasks/refresh",
  async (_, thunkAPI) => {
    const before = thunkAPI.getState();
    const busy = (s) =>
      Object.keys(s.tasks.updatingTasks).length > 0 ||
      Object.keys(s.tasks.pendingMoves).length > 0;
    if (busy(before)) return { skipped: "busy" };

    const params = buildTaskParams(before);
    try {
      const result = await taskService.getTasks(params);
      const after = thunkAPI.getState();
      if (busy(after)) return { skipped: "busy" };
      const sameView =
        JSON.stringify(buildTaskParams(after)) === JSON.stringify(params);
      if (!sameView) return { skipped: "stale" };
      return result;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const fetchTaskById = createAsyncThunk(
  "tasks/fetchById",
  async (taskId, thunkAPI) => {
    try {
      return await taskService.getTaskById(taskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const addTask = createAsyncThunk(
  "tasks/add",
  async (taskData, thunkAPI) => {
    try {
      return await taskService.createTask(taskData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const editTask = createAsyncThunk(
  "tasks/edit",
  async ({ taskId, taskData }, thunkAPI) => {
    try {
      return await taskService.updateTask(taskId, taskData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const toggleTaskStatus = createAsyncThunk(
  "tasks/toggleStatus",
  async (taskId, thunkAPI) => {
    try {
      return await taskService.toggleTask(taskId);
    } catch (error) {
      return thunkAPI.rejectWithValue({
        taskId,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to update task",
      });
    }
  },
);

// Move a task to another workflow status (Kanban drag/drop or status select).
export const moveTask = createAsyncThunk(
  "tasks/move",
  async ({ taskId, status }, thunkAPI) => {
    try {
      return await taskService.updateTaskStatus(taskId, status);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to move task",
      );
    }
  },
);

export const removeTask = createAsyncThunk(
  "tasks/remove",
  async (taskId, thunkAPI) => {
    try {
      return await taskService.deleteTask(taskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const createSubtask = createAsyncThunk(
  "tasks/createSubtask",
  async ({ taskId, title }, thunkAPI) => {
    try {
      return await taskService.addSubtask(taskId, title);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const toggleSubtaskStatus = createAsyncThunk(
  "tasks/toggleSubtask",
  async ({ taskId, subtaskId }, thunkAPI) => {
    try {
      return await taskService.toggleSubtask(taskId, subtaskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const removeSubtask = createAsyncThunk(
  "tasks/removeSubtask",
  async ({ taskId, subtaskId }, thunkAPI) => {
    try {
      return await taskService.deleteSubtask(taskId, subtaskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const uploadAttachment = createAsyncThunk(
  "tasks/uploadAttachment",
  async ({ taskId, file }, thunkAPI) => {
    try {
      return await taskService.uploadAttachment(taskId, file);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

export const removeAttachment = createAsyncThunk(
  "tasks/removeAttachment",
  async ({ taskId, attachmentId }, thunkAPI) => {
    try {
      const result = await taskService.deleteAttachment(taskId, attachmentId);
      return { taskId, ...result };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
      );
    }
  },
);

// NEW: assign task thunk (used by EditTaskModal/CreateTaskModal)
export const assignTask = createAsyncThunk(
  "tasks/assign",
  async ({ taskId, userIds }, thunkAPI) => {
    try {
      return await taskService.assignTask(taskId, userIds);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to assign task",
      );
    }
  },
);

export const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setViewMode: (state, action) => {
      state.viewMode = ["board", "calendar"].includes(action.payload)
        ? action.payload
        : "list";
      try {
        localStorage.setItem(VIEW_KEY, state.viewMode);
      } catch {
        // storage unavailable: the view just won't be remembered
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setAssignedToMeFilter: (state, action) => {
      // NEW
      state.assignedToMe = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.data || [];
      })
      .addCase(refreshTasks.fulfilled, (state, action) => {
        if (action.payload?.skipped) return;
        state.tasks = action.payload.data || [];
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.currentTask = action.payload.data;
      })

      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload.data);
      })

      .addCase(editTask.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
        if (state.currentTask?._id === updated._id) state.currentTask = updated;
      })

      .addCase(toggleTaskStatus.pending, (state, action) => {
        const taskId = action.meta.arg;
        const task = state.tasks.find((t) => t._id === taskId);
        if (task) {
          task._previousCompleted = task.completed;
          task._previousStatus = task.status;
          task.completed = !task.completed;
          task.status = task.completed ? "done" : "todo";
          state.updatingTasks[taskId] = true;
        }
      })

      .addCase(toggleTaskStatus.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);

        if (index !== -1) {
          state.tasks[index] = updated;
        }

        delete state.updatingTasks[updated._id];
      })

      .addCase(toggleTaskStatus.rejected, (state, action) => {
        const taskId = action.meta.arg;
        const task = state.tasks.find((t) => t._id === taskId);
        if (task) {
          task.completed = task._previousCompleted;
          task.status = task._previousStatus;
          delete task._previousCompleted;
          delete task._previousStatus;
        }
        delete state.updatingTasks[taskId];
      })

      // Optimistic move with rollback. Previous values are remembered per
      // request so two quick moves of the same task roll back correctly.
      .addCase(moveTask.pending, (state, action) => {
        const { taskId, status } = action.meta.arg;
        const task = state.tasks.find((t) => t._id === taskId);
        if (task) {
          state.pendingMoves[action.meta.requestId] = {
            taskId,
            status: task.status,
            completed: task.completed,
          };
          task.status = status;
          task.completed = status === "done";
        }
        state.updatingTasks[taskId] = true;
      })
      .addCase(moveTask.fulfilled, (state, action) => {
        const updated = action.payload.data;
        delete state.pendingMoves[action.meta.requestId];
        delete state.updatingTasks[updated._id];
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })
      .addCase(moveTask.rejected, (state, action) => {
        const prev = state.pendingMoves[action.meta.requestId];
        delete state.pendingMoves[action.meta.requestId];
        const { taskId } = action.meta.arg;
        delete state.updatingTasks[taskId];
        const task = state.tasks.find((t) => t._id === taskId);
        if (task && prev) {
          task.status = prev.status;
          task.completed = prev.completed;
        }
      })

      .addCase(removeTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(
          (t) => t._id !== action.payload.taskId,
        );
      })

      .addCase(createSubtask.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })
      .addCase(toggleSubtaskStatus.pending, (state, action) => {
        const { taskId, subtaskId } = action.meta.arg;
        const task = state.tasks.find((t) => t._id === taskId);
        const subtask = task?.subtasks?.find((s) => s._id === subtaskId);
        if (subtask) {
          subtask._previousCompleted = subtask.completed;
          subtask.completed = !subtask.completed;
        }
      })
      .addCase(toggleSubtaskStatus.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })
      .addCase(toggleSubtaskStatus.rejected, (state, action) => {
        const { taskId, subtaskId } = action.meta.arg;
        const task = state.tasks.find((t) => t._id === taskId);
        const subtask = task?.subtasks?.find((s) => s._id === subtaskId);
        if (subtask && subtask._previousCompleted !== undefined) {
          subtask.completed = subtask._previousCompleted;
          delete subtask._previousCompleted;
        }
      })
      .addCase(removeSubtask.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })

      .addCase(uploadAttachment.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })
      .addCase(removeAttachment.fulfilled, (state, action) => {
        const { taskId, attachmentId } = action.payload;
        const task = state.tasks.find((t) => t._id === taskId);
        if (task) {
          task.attachments = task.attachments.filter(
            (a) => a._id !== attachmentId,
          );
        }
      })

      // NEW
      .addCase(assignTask.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      });
  },
});

export const {
  setStatusFilter,
  setViewMode,
  setSearchQuery,
  setAssignedToMeFilter,
  clearCurrentTask,
} = taskSlice.actions;
export default taskSlice.reducer;