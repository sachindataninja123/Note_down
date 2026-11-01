import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { genAccessToken, genRefreshToken } from "../utils/generateToken.js";
import {
  generateOtp,
  hashOtp,
  compareOtp,
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  MAX_OTP_ATTEMPTS,
} from "../utils/otp.js";
import { sendResetOtpEmail } from "../utils/sendOtpEmail.js";

import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- Helpers ---
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const assertPlainString = (value, fieldName) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${fieldName} must be a valid string`);
  }
};

const getCookieOptions = (maxAge = null) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  if (maxAge !== null) options.maxAge = maxAge;
  return options;
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15m
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d

const RESET_TOKEN_SECRET =
  process.env.RESET_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET;
const RESET_TOKEN_EXPIRY = "10m";

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(
    "accessToken",
    accessToken,
    getCookieOptions(ACCESS_TOKEN_MAX_AGE),
  );
  if (refreshToken) {
    res.cookie(
      "refreshToken",
      refreshToken,
      getCookieOptions(REFRESH_TOKEN_MAX_AGE),
    );
  }
};

// --- Controllers ---

export const registerUser = asyncHandler(async (req, res) => {
  // FIX: removed console.log(BODY/NAME/EMAIL/PASSWORD) — the password one
  // was writing plaintext passwords straight into server logs. Never log
  // req.body on an auth route.
  const { name, password, email } = req.body || {};

  if (!name || !password || !email) {
    throw new ApiError(400, "All fields are required!");
  }

  assertPlainString(name, "Name");
  assertPlainString(password, "Password");
  assertPlainString(email, "Email");

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      400,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  // FIX: normalize email the same way the schema does (lowercase/trim)
  // before the duplicate check, otherwise "Foo@Bar.com" and "foo@bar.com"
  // both pass this check but collide on save via the unique index.
  const normalizedEmail = email.toLowerCase().trim();

  const existUser = await User.findOne({ email: normalizedEmail });
  if (existUser) {
    throw new ApiError(409, "Email already registered");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  const safeUser = await User.findById(user._id).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, safeUser, "User registered successfully!"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required!");
  }

  assertPlainString(email, "Email");
  assertPlainString(password, "Password");

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new ApiError(401, "Invalid email or password!");
  }

  const isValidUser = await user.comparePassword(password);
  if (!isValidUser) {
    throw new ApiError(401, "Invalid email or password!");
  }

  const accessToken = genAccessToken(user);
  const refreshToken = genRefreshToken(user);

  setAuthCookies(res, accessToken, refreshToken);

  const safeUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, { user: safeUser }, "User logged in successfully!"),
    );
});

export const getMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized access");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetched successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id || decoded.id).select(
    "-password",
  );
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (decoded.tokenVersion !== user.tokenVersion) {
    throw new ApiError(401, "Refresh token has been revoked");
  }

  const accessToken = genAccessToken(user);
  const newRefreshToken = genRefreshToken(user);

  setAuthCookies(res, accessToken, newRefreshToken);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Access token refreshed successfully"));
});

export const logout = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
  }

  res
    .clearCookie("accessToken", getCookieOptions())
    .clearCookie("refreshToken", getCookieOptions());

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};

  // 1. Validate email input
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  assertPlainString(email, "Email");

  const normalizedEmail = email.toLowerCase().trim();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  // 2. Lookup user
  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+resetOtp +resetOtpExpiry +resetOtpAttempts +resetOtpLastSentAt");

  // 3. User Enumeration Protection (Return identical generic success if not found)
  if (!user) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "If an account exists with this email, an OTP has been sent",
        ),
      );
  }

  // 4. Rate-limiting / Cooldown Check
  if (
    user.resetOtpLastSentAt &&
    Date.now() - user.resetOtpLastSentAt.getTime() <
      OTP_RESEND_COOLDOWN_SECONDS * 1000
  ) {
    const elapsedSeconds =
      (Date.now() - user.resetOtpLastSentAt.getTime()) / 1000;
    const waitSeconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);

    throw new ApiError(
      429,
      `Please wait ${waitSeconds}s before requesting another OTP`,
    );
  }

  // 5. Generate and store OTP data
  const otp = generateOtp();
  const hashedOtp = await hashOtp(otp);

  user.resetOtp = hashedOtp;
  user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.resetOtpAttempts = 0;
  user.resetOtpLastSentAt = new Date();

  await user.save();

  // 6. Send OTP with automatic state rollback on failure
  try {
    await sendResetOtpEmail(user.email, otp);
  } catch (emailError) {
    console.error("❌ SMTP Delivery Failed:", emailError.message);

    // Rollback OTP state so user isn't locked out by a failed send
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.resetOtpAttempts = 0;
    user.resetOtpLastSentAt = null;
    await user.save();

    throw new ApiError(
      500,
      `Failed to deliver email: ${emailError.message || "SMTP connection error"}`,
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "If an account exists with this email, an OTP has been sent",
      ),
    );
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }
  assertPlainString(email, "Email");
  assertPlainString(otp, "OTP");

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+resetOtp +resetOtpExpiry +resetOtpAttempts",
  );

  if (!user || !user.resetOtp || !user.resetOtpExpiry) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (user.resetOtpExpiry.getTime() < Date.now()) {
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.resetOtpAttempts = 0;
    await user.save();
    throw new ApiError(400, "OTP has expired, please request a new one");
  }

  if (user.resetOtpAttempts >= MAX_OTP_ATTEMPTS) {
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.resetOtpAttempts = 0;
    await user.save();
    throw new ApiError(
      429,
      "Too many incorrect attempts. Please request a new OTP",
    );
  }

  const isValid = await compareOtp(otp, user.resetOtp);

  if (!isValid) {
    user.resetOtpAttempts += 1;
    await user.save();
    throw new ApiError(400, "Incorrect OTP");
  }

  // OTP verified — clear it so it can't be reused, and issue a short-lived
  // reset token that authorizes the actual password change.
  user.resetOtp = null;
  user.resetOtpExpiry = null;
  user.resetOtpAttempts = 0;
  await user.save();

  const resetToken = jwt.sign(
    { _id: user._id, purpose: "password_reset" },
    RESET_TOKEN_SECRET,
    { expiresIn: RESET_TOKEN_EXPIRY },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { resetToken }, "OTP verified successfully"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body || {};

  if (!resetToken || !newPassword) {
    throw new ApiError(400, "Reset token and new password are required");
  }
  assertPlainString(resetToken, "Reset token");
  assertPlainString(newPassword, "New password");

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      400,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, RESET_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired reset token");
  }

  if (decoded.purpose !== "password_reset") {
    throw new ApiError(401, "Invalid reset token");
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  user.password = newPassword; // hashed by the pre("save") hook
  // Invalidate any existing sessions/refresh tokens after a password reset.
  user.tokenVersion += 1;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized access");
  }

  const { oldPassword, newPassword } = req.body || {};

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  assertPlainString(oldPassword, "Old password");
  assertPlainString(newPassword, "New password");

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(
      400,
      `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      "New password must be different from the old password",
    );
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword; // re-hashed by the pre("save") hook
  // Invalidate existing sessions elsewhere (forces re-login on other devices)
  user.tokenVersion += 1;
  await user.save();

  const accessToken = genAccessToken(user);
  const refreshToken = genRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, "Please upload a profile image");
  }

  const ALLOWED_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ]);

  if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
    throw new ApiError(400, "Only PNG, JPG, WEBP and GIF images are allowed");
  }

  if (req.file.size > 5 * 1024 * 1024) {
    throw new ApiError(400, "Image size cannot exceed 5MB");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "taskpulse/profile_images",
        resource_type: "image",
        transformation: [
          {
            width: 500,
            height: 500,
            crop: "fill",
            gravity: "face",
          },
        ],
      },

      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  });

  const oldPublicId = user.profilePic?.publicId;

  user.profilePic = {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };

  await user.save();

  if (oldPublicId) {
    try {
      await cloudinary.uploader.destroy(oldPublicId);
    } catch (error) {
      console.error("Old profile image deletion failed:", error);
    }
  }

  const updatedUser = await User.findById(userId).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Profile image updated successfully"),
    );
});

export const deleteProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const publicId = user.profilePic?.publicId;

  if (!publicId) {
    throw new ApiError(404, "Profile image not found");
  }

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(publicId);

  // Reset profile image
  user.profilePic = {
    url: "",
    publicId: "",
  };

  await user.save();

  const updatedUser = await User.findById(userId).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Profile image deleted successfully"),
    );
});
