import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload Attachment to Task
export const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid Task ID");
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const task = await Task.findOne({ _id: id, owner: req.user._id });
  if (!task) throw new ApiError(404, "Task not found");

  // Stream upload directly from memory buffer
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "task_attachments", resource_type: "auto" },
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

  return res
    .status(201)
    .json(new ApiResponse(201, task.attachments, "File uploaded successfully"));
});

// Delete Attachment from Task
export const deleteTaskAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;

  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(attachmentId)) {
    throw new ApiError(400, "Invalid ID format");
  }

  const task = await Task.findOne({ _id: id, owner: req.user._id });
  if (!task) throw new ApiError(404, "Task not found");

  const attachment = task.attachments.id(attachmentId);
  if (!attachment) throw new ApiError(404, "Attachment not found");

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(attachment.publicId);

  task.attachments.pull({ _id: attachmentId });
  await task.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Attachment deleted successfully"));
});