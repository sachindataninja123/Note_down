import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { invalidateNotificationCache } from "./notificationCache.js";
import { emitToUser } from "./realtime.js";

// Types a user may switch off. The rest (invites, system) always arrive.
export const MUTABLE_NOTIFICATION_TYPES = [
  "ASSIGNED",
  "MENTION",
  "COMMENT",
  "DUE_SOON",
];


/**
 * Create a notification for one recipient, respecting their preferences and
 * never creating the same one twice.
 *
 *   dedupeKey       permanent: one notification per key, ever (reminders).
 *   dedupeWindowMs  opt-in: same recipient + task + type within the window is
 *                   skipped (assign / unassign / assign again in seconds).
 *                   Off by default, so two separate comments both notify.
 *
 * Returns the notification, or null when it was skipped. Never throws: a
 * failing notification must not fail the request that triggered it.
 */
export const createNotification = async ({
  recipient,
  task = null,
  title,
  message,
  type,
  dedupeKey,
  dedupeWindowMs = 0,
}) => {
  try {
    if (MUTABLE_NOTIFICATION_TYPES.includes(type)) {
      const user = await User.findById(recipient)
        .select("notificationPreferences")
        .lean();
      if (!user) return null;
      if (user.notificationPreferences?.[type] === false) return null;
    }

    if (!dedupeKey && dedupeWindowMs > 0 && task) {
      const recent = await Notification.exists({
        recipient,
        task,
        type,
        createdAt: { $gte: new Date(Date.now() - dedupeWindowMs) },
      });
      if (recent) return null;
    }

    let notification;
    try {
      notification = await Notification.create({
        recipient,
        task,
        title,
        message,
        type,
        ...(dedupeKey ? { dedupeKey } : {}),
      });
    } catch (err) {
      if (err?.code === 11000) return null; // same dedupeKey already exists
      throw err;
    }

    await invalidateNotificationCache(recipient.toString());

    const populated = await notification.populate(
      "task",
      "title dueDate completed status workspace",
    );
    emitToUser(recipient, "notification:new", populated.toJSON());
    return populated;
  } catch (err) {
    console.error("createNotification failed:", err.message);
    return null;
  }
};