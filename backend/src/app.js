import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import taskRouter from "./routes/task.routes.js";
import categoryRouter from "./routes/category.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";
import notificationRouter from "./routes/notification.routes.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Hello server is running");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/notifications", notificationRouter);

export default app;
