import express from "express";
import {
  getMe,
  loginUser,
  logout,
  refreshAccessToken,
  registerUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  updateProfileImage,
  deleteProfileImage,
} from "../controllers/auth.controller.js";
import { isAuth } from "../middlewares/isAuth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import upload from "../middlewares/multer.middleware.js";

const authRouter = express.Router();

authRouter.post("/register", authLimiter, registerUser);
authRouter.post("/login", authLimiter, loginUser);
authRouter.get("/profile", isAuth, getMe);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.post("/logout", isAuth, logout);

// Password reset (OTP flow, logged out)
authRouter.post("/forgot-password", authLimiter, forgotPassword);
authRouter.post("/verify-otp", authLimiter, verifyResetOtp);
authRouter.post("/reset-password", authLimiter, resetPassword);

// Change password (logged in)
authRouter.post("/change-password", isAuth, authLimiter, changePassword);

// Profile Image Updation , deletion
authRouter.put("/profile-image", isAuth, upload.single("profilePic"), updateProfileImage);
authRouter.delete("/profile-image", isAuth, deleteProfileImage);

export default authRouter;
