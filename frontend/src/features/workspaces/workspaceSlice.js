import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import workspaceService from "./workspaceService";

const initialState = {
  workspaces: [],
  // FIX: stays null (= Personal) until the user explicitly picks a
  // workspace. Previously fetchWorkspaces.fulfilled auto-selected
  // workspaces[0], which meant a user with any workspace membership could
  // never see their personal tasks on load.
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

// NEW: was entirely missing — nothing in the app could delete a workspace.
export const removeWorkspace = createAsyncThunk(
  "workspaces/remove",
  async (workspaceId, thunkAPI) => {
    try {
      await workspaceService.deleteWorkspace(workspaceId);
      return { workspaceId };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to delete workspace"
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
    // Pass a workspace object to switch into it, or `null` to go back to
    // Personal. The Navbar now calls this with null explicitly for the
    // "Personal" option.
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
        // FIX: no more auto-selecting workspaces[0]. If the workspace the
        // user currently has selected was deleted elsewhere (another tab,
        // or by the owner), fall back to Personal instead of pointing at
        // a workspace that no longer exists.
        if (
          state.currentWorkspace &&
          !state.workspaces.some((w) => w._id === state.currentWorkspace._id)
        ) {
          state.currentWorkspace = null;
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
      .addCase(removeWorkspace.fulfilled, (state, action) => {
        const { workspaceId } = action.payload;
        state.workspaces = state.workspaces.filter((w) => w._id !== workspaceId);
        // If the deleted workspace was the active one, drop back to Personal.
        if (state.currentWorkspace?._id === workspaceId) {
          state.currentWorkspace = null;
        }
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