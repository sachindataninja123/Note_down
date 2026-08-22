import mongoose from "mongoose";
import crypto from "crypto";

const invitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// One pending invite per email per workspace at a time.
invitationSchema.index(
  { workspace: 1, email: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

invitationSchema.statics.hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

invitationSchema.statics.generateRawToken = () =>
  crypto.randomBytes(32).toString("hex");

const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation;
