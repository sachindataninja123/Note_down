import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import notificationService from "./notificationService";

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isError: false,
  message: "",
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, thunkAPI) => {
    try {
      return await notificationService.getNotifications();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to load notifications"
      );
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  "notifications/markRead",
  async (id, thunkAPI) => {
    try {
      return await notificationService.markAsRead(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to mark as read"
      );
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, thunkAPI) => {
    try {
      return await notificationService.markAllAsRead();
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Failed to clear notifications"
      );
    }
  }
);

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Pushed by the socket. De-duplicated by id: the same notification can
    // arrive over the socket AND in a REST refresh.
    notificationReceived: (state, action) => {
      const incoming = action.payload;
      if (!incoming?._id) return;
      if (state.notifications.some((n) => n._id === incoming._id)) return;
      state.notifications.unshift(incoming);
      if (state.notifications.length > 30) state.notifications.length = 30;
      if (!incoming.isRead) state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.data?.notifications || [];
        state.unreadCount = action.payload.data?.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.notifications.findIndex((n) => n._id === updated._id);
        if (index !== -1 && !state.notifications[index].isRead) {
          state.notifications[index].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export const { notificationReceived } = notificationSlice.actions;
export default notificationSlice.reducer;