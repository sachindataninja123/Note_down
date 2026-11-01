import mongoose from "mongoose";

export const ACTIVITY_ACTIONS = [
  "task.created",
  "task.updated",
  "task.deleted",
  "task.status_changed",
  "task.priority_changed",
  "task.due_date_changed",
  "task.assignee_added",
  "task.assignee_removed",
  "subtask.created",
  "subtask.completed",
  "subtask.reopened",
  "subtask.deleted",
  "comment.added",
  "attachment.uploaded",
  "attachment.deleted",
  "workspace.created",
  "workspace.deleted",
  "member.invited",
  "member.joined",
  "member.removed",
];

const activitySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Feeds are read newest-first and paged by _id (see activity.controller.js).
activitySchema.index({ workspace: 1, _id: -1 });
activitySchema.index({ task: 1, _id: -1 });
activitySchema.index({ actor: 1, workspace: 1, _id: -1 });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;