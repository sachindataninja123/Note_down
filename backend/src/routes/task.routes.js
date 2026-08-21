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

export default taskRouter;