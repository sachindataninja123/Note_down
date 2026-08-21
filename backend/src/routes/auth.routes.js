import express from "express";
import {
  getMe,
  loginUser,
  logout,
  refreshAccessToken,
  registerUser,
} from "../controllers/auth.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/profile", isAuth, getMe);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.post("/logout", isAuth, logout);

export default authRouter;