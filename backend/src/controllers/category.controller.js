import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 1. Create a Category
export const createCategory = asyncHandler(async (req, res) => {
  const { name, color, icon } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ApiError(400, "Category name is required");
  }

  const existingCategory = await Category.findOne({
    owner: req.user._id,
    name: name.trim(),
  });

  if (existingCategory) {
    throw new ApiError(409, "A category with this name already exists");
  }

  const category = await Category.create({
    name: name.trim(),
    color: color || "#6366F1",
    icon: icon || "tag",
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

// 2. Get All User Categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ owner: req.user._id }).sort({ name: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

// 3. Update Category
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, color, icon } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const updates = {};
  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, "Category name cannot be empty");
    updates.name = name.trim();
  }
  if (color !== undefined) updates.color = color;
  if (icon !== undefined) updates.icon = icon;

  const updatedCategory = await Category.findOneAndUpdate(
    { _id: id, owner: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedCategory) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCategory, "Category updated successfully"));
});

// 4. Delete Category (and unlink from tasks)
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const category = await Category.findOneAndDelete({
    _id: id,
    owner: req.user._id,
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Remove reference from any tasks linked to this category
  await Task.updateMany(
    { owner: req.user._id, category: id },
    { $set: { category: null } }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted and unlinked from tasks"));
});