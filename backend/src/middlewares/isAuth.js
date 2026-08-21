import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";

export const isAuth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request: Token is missing!");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired access token");
  }

  const user = await User.findById(decoded?._id || decoded?.id).select(
    "-password"
  );

  if (!user) {
    throw new ApiError(401, "Invalid Access Token: User no longer exists!");
  }

  req.user = user;
  next();
});