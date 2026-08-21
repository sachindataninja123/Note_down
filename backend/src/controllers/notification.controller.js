import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Get All Notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("task", "title dueDate completed")
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { notifications, unreadCount },
        "Notifications fetched successfully"
      )
    );
});

// Mark Single Notification as Read
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Notification ID");

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) throw new ApiError(404, "Notification not found");

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

// Mark All Notifications as Read
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All notifications marked as read"));
});