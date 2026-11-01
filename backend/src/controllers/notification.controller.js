import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { MUTABLE_NOTIFICATION_TYPES } from "../utils/notify.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getCachedNotifications,
  setCachedNotifications,
  invalidateNotificationCache,
} from "../utils/notificationCache.js";

// Get All Notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const cached = await getCachedNotifications(userId); // NEW
  if (cached) {
    return res
      .status(200)
      .json(new ApiResponse(200, cached, "Notifications fetched successfully"));
  }

  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("task", "title dueDate completed status workspace")
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  const payload = { notifications, unreadCount };
  setCachedNotifications(userId, payload); // NEW

  return res
    .status(200)
    .json(new ApiResponse(200, payload, "Notifications fetched successfully"));
});

// Mark Single Notification as Read
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, "Invalid Notification ID");

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: req.user._id },
    { $set: { isRead: true } },
    { new: true },
  );

  if (!notification) throw new ApiError(404, "Notification not found");

  await invalidateNotificationCache(req.user._id.toString()); // NEW

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

// Mark All Notifications as Read
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } },
  );

  await invalidateNotificationCache(req.user._id.toString()); // NEW

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All notifications marked as read"));
});


const readPreferences = (user) =>
  Object.fromEntries(
    MUTABLE_NOTIFICATION_TYPES.map((t) => [
      t,
      user?.notificationPreferences?.[t] !== false,
    ]),
  );

// Get Notification Preferences
export const getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("notificationPreferences")
    .lean();
  return res
    .status(200)
    .json(new ApiResponse(200, readPreferences(user), "Preferences fetched"));
});

// Update Notification Preferences (only the keys sent are changed)
export const updatePreferences = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Preferences must be an object");
  }

  const $set = {};
  for (const [key, value] of Object.entries(body)) {
    if (!MUTABLE_NOTIFICATION_TYPES.includes(key)) {
      throw new ApiError(400, `Unknown notification type: ${key}`);
    }
    if (typeof value !== "boolean") {
      throw new ApiError(400, `${key} must be true or false`);
    }
    $set[`notificationPreferences.${key}`] = value;
  }
  if (Object.keys($set).length === 0) {
    throw new ApiError(400, "No preferences provided");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set },
    { new: true },
  )
    .select("notificationPreferences")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, readPreferences(user), "Preferences updated"));
});