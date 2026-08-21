import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from "../controllers/task.controller.js";
import { isAuth } from "../middlewares/isAuth.js";
import multer from "multer";
import {
  uploadTaskAttachment,
  deleteTaskAttachment,
} from "../controllers/attachment.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});


const taskRouter = express.Router();

taskRouter.use(isAuth);

// Task Routes
taskRouter.route("/").post(createTask).get(getAllTasks);
taskRouter.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);
taskRouter.patch("/:id/toggle", toggleTaskStatus);

// Subtask Routes
taskRouter.post("/:id/subtasks", addSubtask);
taskRouter.patch("/:id/subtasks/:subtaskId/toggle", toggleSubtask);
taskRouter.delete("/:id/subtasks/:subtaskId", deleteSubtask);

// Attachment endpoints
taskRouter.post("/:id/attachments", upload.single("file"), uploadTaskAttachment);
taskRouter.delete("/:id/attachments/:attachmentId", deleteTaskAttachment);

export default taskRouter;