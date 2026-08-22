import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import commentService from "./commentService";

const initialState = {
  commentsByTask: {},
  isLoading: false,
  isError: false,
  message: "",
};

export const fetchComments = createAsyncThunk(
  "comments/fetchAll",
  async (taskId, thunkAPI) => {
    try {
      const res = await commentService.getComments(taskId);
      return { taskId, comments: res.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load comments",
      );
    }
  },
);

export const createComment = createAsyncThunk(
  "comments/create",
  async ({ taskId, text }, thunkAPI) => {
    try {
      const res = await commentService.addComment(taskId, text);
      return { taskId, comment: res.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to add comment",
      );
    }
  },
);

export const removeComment = createAsyncThunk(
  "comments/remove",
  async ({ taskId, commentId }, thunkAPI) => {
    try {
      await commentService.deleteComment(taskId, commentId);
      return { taskId, commentId };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete comment",
      );
    }
  },
);

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.commentsByTask[action.payload.taskId] = action.payload.comments;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const { taskId, comment } = action.payload;
        if (!state.commentsByTask[taskId]) state.commentsByTask[taskId] = [];
        state.commentsByTask[taskId].push(comment);
      })
      .addCase(removeComment.fulfilled, (state, action) => {
        const { taskId, commentId } = action.payload;
        if (state.commentsByTask[taskId]) {
          state.commentsByTask[taskId] = state.commentsByTask[taskId].filter(
            (c) => c._id !== commentId,
          );
        }
      });
  },
});

export default commentSlice.reducer;
