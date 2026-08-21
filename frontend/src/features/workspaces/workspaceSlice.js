import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import workspaceService from "./workspaceService";

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  isError: false,
  message: "",
};

export const fetchWorkspaces = createAsyncThunk(
  "workspaces/fetchAll",
  async (_, thunkAPI) => {
    try {
      return await workspaceService.getWorkspaces();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load workspaces"
      );
    }
  }
);

export const addWorkspace = createAsyncThunk(
  "workspaces/create",
  async (workspaceData, thunkAPI) => {
    try {
      return await workspaceService.createWorkspace(workspaceData);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to create workspace"
      );
    }
  }
);

export const inviteMember = createAsyncThunk(
  "workspaces/inviteMember",
  async ({ workspaceId, email, role }, thunkAPI) => {
    try {
      return await workspaceService.addMember(workspaceId, { email, role });
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to invite member"
      );
    }
  }
);

export const deleteMember = createAsyncThunk(
  "workspaces/removeMember",
  async ({ workspaceId, memberId }, thunkAPI) => {
    try {
      return await workspaceService.removeMember(workspaceId, memberId);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to remove member"
      );
    }
  }
);

export const workspaceSlice = createSlice({
  name: "workspaces",
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workspaces = action.payload.data || [];
        if (!state.currentWorkspace && state.workspaces.length > 0) {
          state.currentWorkspace = state.workspaces[0];
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(addWorkspace.fulfilled, (state, action) => {
        state.workspaces.push(action.payload.data);
        state.currentWorkspace = action.payload.data;
      })
      .addCase(inviteMember.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.workspaces.findIndex((w) => w._id === updated._id);
        if (index !== -1) state.workspaces[index] = updated;
        if (state.currentWorkspace?._id === updated._id) state.currentWorkspace = updated;
      })
      .addCase(deleteMember.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.workspaces.findIndex((w) => w._id === updated._id);
        if (index !== -1) state.workspaces[index] = updated;
        if (state.currentWorkspace?._id === updated._id) state.currentWorkspace = updated;
      });
  },
});

export const { setCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;