import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import taskRouter from "./routes/task.routes.js";

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

app.use("/api/v1/auth",authRouter );
app.use("/api/v1/tasks" , taskRouter)

export default app;
