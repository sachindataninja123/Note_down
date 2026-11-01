import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    // Which notifications this user wants. Missing = on (existing users).
    notificationPreferences: {
      ASSIGNED: { type: Boolean, default: true },
      MENTION: { type: Boolean, default: true },
      COMMENT: { type: Boolean, default: true },
      DUE_SOON: { type: Boolean, default: true },
    },

    profilePic: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    resetOtp: {
      type: String,
      default: null,
      select: false,
    },
    resetOtpExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    resetOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    resetOtpLastSentAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
