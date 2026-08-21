import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const notificationRouter = express.Router();
notificationRouter.use(isAuth);

notificationRouter.get("/", getNotifications);
notificationRouter.patch("/read-all", markAllAsRead);
notificationRouter.patch("/:id/read", markAsRead);

export default notificationRouter;