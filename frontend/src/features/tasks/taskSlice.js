import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import taskService from "./taskService";

const initialState = {
  tasks: [],
  currentTask: null,
  statusFilter: "all",
  searchQuery: "",
  isLoading: false,
  isError: false,
  message: "",
  updatingTasks: {},
};

export const fetchTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const { statusFilter, searchQuery } = state.tasks;
      const { selectedCategory } = state.categories;
      const { currentWorkspace } = state.workspaces;

      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (selectedCategory && selectedCategory !== "All")
        params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      // Pass the active workspace ID
      if (currentWorkspace?._id) {
        params.workspace = currentWorkspace._id;
      } else {
        params.workspace = "personal";
      }

      return await taskService.getTasks(params);
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
      return await taskService.deleteAttachment(taskId, attachmentId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message,
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
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.data || [];
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Fetch Single
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.currentTask = action.payload.data;
      })

      // Add Task
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload.data);
      })

      // Edit Task
      .addCase(editTask.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
        if (state.currentTask?._id === updated._id) state.currentTask = updated;
      })

      // Toggle Task - Optimistic Update
      .addCase(toggleTaskStatus.pending, (state, action) => {
        const taskId = action.meta.arg;
        const task = state.tasks.find((t) => t._id === taskId);
        if (task) {
          task._previousCompleted = task.completed; // ADD THIS LINE
          task.completed = !task.completed;
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
          delete task._previousCompleted;
        }
        delete state.updatingTasks[taskId]; // ADD THIS LINE
      })

      // Delete Task
      .addCase(removeTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(
          (t) => t._id !== action.payload.taskId,
        );
      })

      // Subtasks (Backend returns the updated parent task document)
      .addCase(createSubtask.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })
      .addCase(toggleSubtaskStatus.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })
      .addCase(removeSubtask.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })

      // Attachments
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
      });
  },
});

export const { setStatusFilter, setSearchQuery, clearCurrentTask } =
  taskSlice.actions;
export default taskSlice.reducer;
