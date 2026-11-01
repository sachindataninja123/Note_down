import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
} from "../controllers/notification.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const notificationRouter = express.Router();
notificationRouter.use(isAuth);

notificationRouter.get("/", getNotifications);
notificationRouter.get("/preferences", getPreferences);
notificationRouter.patch("/preferences", updatePreferences);
notificationRouter.patch("/read-all", markAllAsRead);
notificationRouter.patch("/:id/read", markAsRead);

export default notificationRouter;