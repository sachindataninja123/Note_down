import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getCachedCategories,
  setCachedCategories,
  invalidateCategoryCache,
} from "../utils/categoryCache.js";

// Create a Category
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

  await invalidateCategoryCache(req.user._id.toString()); // NEW

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

// Get All User Categories
export const getCategories = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const cached = await getCachedCategories(userId); // NEW
  if (cached) {
    return res
      .status(200)
      .json(new ApiResponse(200, cached, "Categories fetched successfully"));
  }

  const categories = await Category.find({ owner: req.user._id }).sort({ name: 1 });

  setCachedCategories(userId, categories); // NEW

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

// Update Category
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

  await invalidateCategoryCache(req.user._id.toString()); // NEW

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCategory, "Category updated successfully"));
});

// Delete Category (and unlink from tasks)
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

  await Task.updateMany(
    { owner: req.user._id, category: id },
    { $set: { category: null } }
  );

  await invalidateCategoryCache(req.user._id.toString()); // NEW

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted and unlinked from tasks"));
});