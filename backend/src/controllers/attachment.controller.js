import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getAccessibleTask } from "../utils/taskAccess.js";
import { scopeFromTask, invalidateTaskCache } from "../utils/taskCache.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// CHANGED: images only — no PDFs, no docs.
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
// CHANGED: 5MB instead of 10MB.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
    throw new ApiError(400, "Only image files are allowed (PNG, JPG, WEBP, GIF)");
  }
  if (req.file.size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(400, "Image exceeds the 5MB limit");
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "task_attachments", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  });

  task.attachments.push({
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
  });

  await task.save();
  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Image uploaded successfully"));
});

export const deleteTaskAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(attachmentId)) {
    throw new ApiError(400, "Invalid ID format");
  }

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  const attachment = task.attachments.id(attachmentId);
  if (!attachment) throw new ApiError(404, "Attachment not found");

  await cloudinary.uploader.destroy(attachment.publicId);

  task.attachments.pull({ _id: attachmentId });
  await task.save();
  await invalidateTaskCache(scopeFromTask(task));

  return res
    .status(200)
    .json(
      new ApiResponse(200, { taskId: id, attachmentId }, "Attachment deleted successfully")
    );
});