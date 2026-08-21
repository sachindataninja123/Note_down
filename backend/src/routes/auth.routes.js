import express from "express";
import {
  getMe,
  loginUser,
  logout,
  refreshAccessToken,
  registerUser,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/profile", getMe);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.post("/logout", logout);

export default authRouter;