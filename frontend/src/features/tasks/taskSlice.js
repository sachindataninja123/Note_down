import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import taskService from "./taskService";

const initialState = {
  tasks: [],
  statusFilter: "all",
  searchQuery: "",
  isLoading: false,
  isError: false,
  message: "",
};

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
      const message =
        error.response?.data?.message || error.message || "Failed to load tasks";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addTask = createAsyncThunk(
  "tasks/add",
  async (taskData, thunkAPI) => {
    try {
      return await taskService.createTask(taskData);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to add task";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

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
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tasks
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

      // Add Task
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload.data);
      })

      // Toggle Task
      .addCase(toggleTaskStatus.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) {
          state.tasks[index] = updated;
        }
      })

      // Remove Task
      .addCase(removeTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload.taskId);
      })

      // Subtask updates (backend returns the updated task document)
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
      });
  },
});

export const { setStatusFilter, setSearchQuery } = taskSlice.actions;
export default taskSlice.reducer;