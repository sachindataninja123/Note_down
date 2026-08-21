import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getAccessibleTask } from "../utils/taskAccess.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid Task ID");
  }

  if (!req.file) {
    throw new ApiError(400, "No image uploaded");
  }

  const task = await getAccessibleTask(id, req.user);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  // Image type validation
  if (!ALLOWED_MIME_TYPES.has(req.file.mimetype)) {
    throw new ApiError(400, "Only image files are allowed");
  }

  // Size validation
  if (req.file.size > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(400, "Image exceeds the 10MB limit");
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "task_attachments",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
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

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Image uploaded successfully"));
});

// Delete Attachment from Task
export const deleteTaskAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;

  if (
    !mongoose.isValidObjectId(id) ||
    !mongoose.isValidObjectId(attachmentId)
  ) {
    throw new ApiError(400, "Invalid ID format");
  }

  const task = await getAccessibleTask(id, req.user);
  if (!task) throw new ApiError(404, "Task not found");

  const attachment = task.attachments.id(attachmentId);
  if (!attachment) throw new ApiError(404, "Attachment not found");

  await cloudinary.uploader.destroy(attachment.publicId);

  task.attachments.pull({ _id: attachmentId });
  await task.save();

  // FIX: frontend reducer reads action.payload.taskId/attachmentId to
  // splice the item out of state locally — neither was ever returned.
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { taskId: id, attachmentId },
        "Attachment deleted successfully",
      ),
    );
});
