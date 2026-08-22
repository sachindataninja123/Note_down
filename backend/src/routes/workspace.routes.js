import express from "express";
import {
  createWorkspace,
  getUserWorkspaces,
  removeMember,
  deleteWorkspace,
} from "../controllers/workspace.controller.js";
import { inviteMember } from "../controllers/invitation.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const workspaceRouter = express.Router();
workspaceRouter.use(isAuth);

workspaceRouter.route("/").post(createWorkspace).get(getUserWorkspaces);
workspaceRouter.post("/:id/members/invite", inviteMember); // was addMember
workspaceRouter.delete("/:id/members/:memberId", removeMember);
workspaceRouter.delete("/:id", deleteWorkspace); // isAuth already applied via .use()

export default workspaceRouter;