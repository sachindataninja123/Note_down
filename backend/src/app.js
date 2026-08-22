import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import authRouter from "./routes/auth.routes.js";
import taskRouter from "./routes/task.routes.js";
import categoryRouter from "./routes/category.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";
import notificationRouter from "./routes/notification.routes.js";

import { ApiError } from "./utils/ApiError.js";
import invitationRouter from "./routes/invitation.routes.js";
import commentRouter from "./routes/comment.routes.js";

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  cors({
    // origin:"https://note-down-1-8smd.onrender.com",
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/invitations", invitationRouter);
app.use("/api/v1/tasks", commentRouter);

// 404 Catch-all Handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global Error-Handling Middleware (Must have 4 arguments)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
