import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { isWorkspaceMember } from "../utils/taskAccess.js";
import { setIo, userRoom, workspaceRoom } from "../utils/realtime.js";

const allowedOrigins = () =>
  [
    "https://note-down-1-8smd.onrender.com",
    process.env.CLIENT_URL,
    "http://localhost:5173",
  ].filter(Boolean);

const readCookie = (header, name) => {
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Same rule as the REST isAuth middleware: the access-token cookie (or an
// explicit token), verified and tied to a user that still exists.
export const authenticateSocket = async (socket, next) => {
  try {
    const token =
      readCookie(socket.handshake.headers?.cookie, "accessToken") ||
      socket.handshake.auth?.token;
    if (!token) return next(new Error("unauthorized"));

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded?._id || decoded?.id)
      .select("_id name")
      .lean();
    if (!user) return next(new Error("unauthorized"));

    socket.data.userId = user._id.toString();
    return next();
  } catch {
    return next(new Error("unauthorized"));
  }
};

// Joining a workspace room is only allowed for members; the check runs on the
// server every time, never trusting the client's claim.
export const handleJoinWorkspace = async (socket, workspaceId, ack) => {
  const reply = typeof ack === "function" ? ack : () => {};
  try {
    if (!mongoose.isValidObjectId(workspaceId)) {
      return reply({ ok: false, error: "Invalid workspace" });
    }
    const member = await isWorkspaceMember(workspaceId, {
      _id: socket.data.userId,
    });
    if (!member) return reply({ ok: false, error: "Not a member" });

    // One active workspace per connection.
    for (const room of socket.rooms) {
      if (room.startsWith("ws:") && room !== workspaceRoom(workspaceId)) {
        socket.leave(room);
      }
    }
    await socket.join(workspaceRoom(workspaceId));
    return reply({ ok: true });
  } catch (err) {
    console.error("Socket join failed:", err.message);
    return reply({ ok: false, error: "Server error" });
  }
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins(), credentials: true },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));

    socket.on("workspace:join", (workspaceId, ack) =>
      handleJoinWorkspace(socket, workspaceId, ack),
    );
    socket.on("workspace:leave", (workspaceId) => {
      if (typeof workspaceId === "string") socket.leave(workspaceRoom(workspaceId));
    });
  });

  setIo(io);
  return io;
};