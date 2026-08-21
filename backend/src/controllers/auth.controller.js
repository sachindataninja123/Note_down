import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { genAccessToken, genRefreshToken } from "../utils/generateToken.js";

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

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE));
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE));
  }
};

// --- Controllers ---

export const registerUser = asyncHandler(async (req, res) => {
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
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  }

  const existUser = await User.findOne({ email });
  if (existUser) {
    throw new ApiError(409, "Email already registered");
  }

  const user = await User.create({
    name,
    email,
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

  const user = await User.findOne({ email });
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
    .json(new ApiResponse(200, { user: safeUser }, "User logged in successfully!"));
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
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id || decoded.id).select("-password");
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
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { tokenVersion: 1 },
    });
  }

  res
    .clearCookie("accessToken", getCookieOptions())
    .clearCookie("refreshToken", getCookieOptions());

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});