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
};

// 1. Fetch all tasks with filters
export const fetchTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const { statusFilter, searchQuery } = state.tasks;
      const { selectedCategory } = state.categories;

      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (selectedCategory && selectedCategory !== "All") params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      return await taskService.getTasks(params);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 2. Fetch single task
export const fetchTaskById = createAsyncThunk(
  "tasks/fetchById",
  async (taskId, thunkAPI) => {
    try {
      return await taskService.getTaskById(taskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 3. Create task
export const addTask = createAsyncThunk(
  "tasks/add",
  async (taskData, thunkAPI) => {
    try {
      return await taskService.createTask(taskData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 4. Update task details
export const editTask = createAsyncThunk(
  "tasks/edit",
  async ({ taskId, taskData }, thunkAPI) => {
    try {
      return await taskService.updateTask(taskId, taskData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 5. Toggle task completion
export const toggleTaskStatus = createAsyncThunk(
  "tasks/toggleStatus",
  async (taskId, thunkAPI) => {
    try {
      return await taskService.toggleTask(taskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 6. Delete task
export const removeTask = createAsyncThunk(
  "tasks/remove",
  async (taskId, thunkAPI) => {
    try {
      return await taskService.deleteTask(taskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 7. Subtasks: Add
export const createSubtask = createAsyncThunk(
  "tasks/createSubtask",
  async ({ taskId, title }, thunkAPI) => {
    try {
      return await taskService.addSubtask(taskId, title);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 8. Subtasks: Toggle
export const toggleSubtaskStatus = createAsyncThunk(
  "tasks/toggleSubtask",
  async ({ taskId, subtaskId }, thunkAPI) => {
    try {
      return await taskService.toggleSubtask(taskId, subtaskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 9. Subtasks: Delete
export const removeSubtask = createAsyncThunk(
  "tasks/removeSubtask",
  async ({ taskId, subtaskId }, thunkAPI) => {
    try {
      return await taskService.deleteSubtask(taskId, subtaskId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 10. Attachments: Upload
export const uploadAttachment = createAsyncThunk(
  "tasks/uploadAttachment",
  async ({ taskId, file }, thunkAPI) => {
    try {
      return await taskService.uploadAttachment(taskId, file);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// 11. Attachments: Delete
export const removeAttachment = createAsyncThunk(
  "tasks/removeAttachment",
  async ({ taskId, attachmentId }, thunkAPI) => {
    try {
      return await taskService.deleteAttachment(taskId, attachmentId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
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

      // Toggle Task
      .addCase(toggleTaskStatus.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      })

      // Delete Task
      .addCase(removeTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload.taskId);
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
          task.attachments = task.attachments.filter((a) => a._id !== attachmentId);
        }
      });
  },
});

export const { setStatusFilter, setSearchQuery, clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer;