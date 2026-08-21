import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import categoryReducer from "../features/categories/categorySlice";
import taskReducer from "../features/tasks/taskSlice";
import notificationReducer from "../features/notifications/notificationSlice";
import workspaceReducer from "../features/workspaces/workspaceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoryReducer,
    tasks: taskReducer,
    notifications: notificationReducer,
    workspaces: workspaceReducer,
  },
});