import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Invitation from "../models/invitation.model.js";
import Workspace from "../models/workspace.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendWorkspaceInviteEmail } from "../utils/sendOtpEmail.js";
import { invalidateWorkspaceCacheForUsers } from "../utils/workspaceCache.js";


const INVITE_EXPIRY_DAYS = 7;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// --- Invite a member (replaces old addMember) ---
export const inviteMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body || {};

  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, "Invalid Workspace ID");
  if (!email) throw new ApiError(400, "Email is required");

  const normalizedEmail = email.toLowerCase().trim();

  const workspace = await Workspace.findOne({ _id: id, owner: req.user._id });
  if (!workspace) {
    throw new ApiError(403, "Only the workspace owner can invite members");
  }

  // If a user account already exists with this email, block inviting them
  // if they're already a member.
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === existingUser._id.toString(),
    );
    if (alreadyMember) {
      throw new ApiError(409, "User is already a member of this workspace");
    }
  }

  // Don't let the owner invite themself.
  if (normalizedEmail === req.user.email) {
    throw new ApiError(400, "You cannot invite yourself");
  }

  const existingPending = await Invitation.findOne({
    workspace: id,
    email: normalizedEmail,
    status: "pending",
  });
  if (existingPending) {
    throw new ApiError(409, "An invitation is already pending for this email");
  }

  const rawToken = Invitation.generateRawToken();
  const tokenHash = Invitation.hashToken(rawToken);

  const invitation = await Invitation.create({
    workspace: id,
    email: normalizedEmail,
    invitedBy: req.user._id,
    role: role || "member",
    tokenHash,
    expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  });

  const inviteLink = `${CLIENT_URL}/invite/${rawToken}`;

  await sendWorkspaceInviteEmail(normalizedEmail, {
    workspaceName: workspace.name,
    inviterName: req.user.name,
    inviteLink,
    expiryDays: INVITE_EXPIRY_DAYS,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        invitationId: invitation._id,
        email: normalizedEmail,
        status: invitation.status,
      },
      "Invitation sent successfully",
    ),
  );
});

// --- Public: check invite status (frontend uses this to decide redirect) ---
export const getInviteInfo = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) throw new ApiError(400, "Invite token is required");

  const tokenHash = Invitation.hashToken(token);

  const invitation = await Invitation.findOne({ tokenHash }).populate(
    "workspace",
    "name description",
  );

  if (!invitation) {
    throw new ApiError(404, "Invitation not found or invalid");
  }

  if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
    invitation.status = "expired";
    await invitation.save();
  }

  const userExists = !!(await User.findOne({ email: invitation.email }).select(
    "_id",
  ));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status: invitation.status,
        email: invitation.email,
        role: invitation.role,
        workspace: invitation.workspace
          ? { id: invitation.workspace._id, name: invitation.workspace.name }
          : null,
        userExists, // frontend: false -> /register, true -> /login (if not authed)
      },
      "Invitation details fetched",
    ),
  );
});

// --- Accept invite (requires login) ---
export const acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const tokenHash = Invitation.hashToken(token);

  const invitation = await Invitation.findOne({ tokenHash });
  if (!invitation) throw new ApiError(404, "Invitation not found or invalid");

  if (invitation.status !== "pending") {
    throw new ApiError(
      400,
      `This invitation has already been ${invitation.status}`,
    );
  }

  if (invitation.expiresAt < new Date()) {
    invitation.status = "expired";
    await invitation.save();
    throw new ApiError(400, "This invitation has expired");
  }

  // Prevent hijacking: the logged-in user's email must match the invited email.
  if (req.user.email !== invitation.email) {
    throw new ApiError(
      403,
      "This invitation was sent to a different email address than the one you're logged in with",
    );
  }

  const workspace = await Workspace.findById(invitation.workspace);
  if (!workspace) throw new ApiError(404, "Workspace no longer exists");

  const alreadyMember = workspace.members.some(
    (m) => m.user.toString() === req.user._id.toString(),
  );
  if (!alreadyMember) {
    workspace.members.push({ user: req.user._id, role: invitation.role });
    await workspace.save();
  }

  await invalidateWorkspaceCacheForUsers([
    req.user._id.toString(),
    workspace.owner.toString(),
  ]);

  invitation.status = "accepted";
  await invitation.save();

  const populated = await workspace.populate(
    "members.user",
    "name email avatar",
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        populated,
        "Invitation accepted. Welcome to the workspace!",
      ),
    );
});

// --- Reject invite (requires login) ---
export const rejectInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const tokenHash = Invitation.hashToken(token);

  const invitation = await Invitation.findOne({ tokenHash });
  if (!invitation) throw new ApiError(404, "Invitation not found or invalid");

  if (invitation.status !== "pending") {
    throw new ApiError(
      400,
      `This invitation has already been ${invitation.status}`,
    );
  }

  if (req.user.email !== invitation.email) {
    throw new ApiError(
      403,
      "This invitation was sent to a different email address",
    );
  }

  invitation.status = "rejected";
  await invitation.save();

  return res.status(200).json(new ApiResponse(200, {}, "Invitation rejected"));
});
