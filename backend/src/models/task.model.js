import mongoose from "mongoose";
import { TASK_STATUSES } from "../utils/taskStatus.js";

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Subtask title is required"],
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, default: "application/octet-stream" },
  fileSize: { type: Number },
  uploadedAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Workflow status (todo -> in_progress -> in_review -> done).
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "todo",
      index: true,
    },
    // When the task last became "done" (null while it is not done). Powers the
    // "completed per day" analytics. Kept in sync by the pre-validate hook.
    completedAt: {
      type: Date,
      default: null,
    },
    // Legacy flag, kept in sync with status by the pre-validate hook below.
    completed: {
      type: Boolean,
      default: false,
    },
    subtasks: [subtaskSchema],
    attachments: [attachmentSchema],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ owner: 1, completed: 1, createdAt: -1 });
taskSchema.index({ workspace: 1, status: 1, createdAt: -1 });

// Keep `status` and the legacy `completed` flag consistent on every save().
taskSchema.pre("validate", function () {
  if (this.isModified("status")) {
    this.completed = this.status === "done";
  } else if (this.isModified("completed")) {
    this.status = this.completed
      ? "done"
      : this.status === "done"
        ? "todo"
        : this.status;
  } else {
    return;
  }

  if (this.status === "done") {
    if (!this.completedAt) this.completedAt = new Date();
  } else {
    this.completedAt = null;
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;