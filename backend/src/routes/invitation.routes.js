import express from "express";
import {
  getInviteInfo,
  acceptInvite,
  rejectInvite,
} from "../controllers/invitation.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const invitationRouter = express.Router();

// Public — frontend calls this first to decide where to redirect.
invitationRouter.get("/:token", getInviteInfo);

// Requires login — frontend only calls these after ensuring the user is authed.
invitationRouter.post("/:token/accept", isAuth, acceptInvite);
invitationRouter.post("/:token/reject", isAuth, rejectInvite);

export default invitationRouter;