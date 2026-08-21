import express from "express";
import {
  createWorkspace,
  getUserWorkspaces,
  addMember,
  removeMember,
  deleteWorkspace,
} from "../controllers/workspace.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const workspaceRouter = express.Router();
workspaceRouter.use(isAuth);

workspaceRouter.route("/").post(createWorkspace).get(getUserWorkspaces);
workspaceRouter.post("/:id/members", addMember);
workspaceRouter.delete("/:id/members/:memberId", removeMember);
workspaceRouter.delete("/:id", isAuth, deleteWorkspace);

export default workspaceRouter;
