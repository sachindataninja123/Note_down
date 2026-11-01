import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["DUE_SOON", "OVERDUE", "ASSIGNED", "WORKSPACE_INVITE", "SYSTEM", "COMMENT","MENTION"],
      default: "SYSTEM",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Optional. A second notification with the same key is rejected by the
    // unique index below, so reminders cannot be duplicated even when two
    // server instances run the cron at once.
    dedupeKey: {
      type: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;