import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [30, "Category name cannot exceed 30 characters"],
    },
    color: {
      type: String,
      default: "#6366F1",
      match: [
        /^#([0-9A-F]{3}){1,2}$/i,
        "Please provide a valid hex color code",
      ],
    },
    icon: {
      type: String,
      default: "tag",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ owner: 1, name: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;
