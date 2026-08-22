import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  addComment,
  deleteComment,
  getComments,
} from "../controllers/comment.controller.js";

const commentRouter = express.Router();
commentRouter.use(isAuth);

commentRouter.route("/:taskId/comments").get(getComments).post(addComment);

commentRouter.delete("/:taskId/comments/:commentId", deleteComment);

export default commentRouter;
