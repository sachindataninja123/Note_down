import dotenv from "dotenv";
dotenv.config();
import http from "http";
import app from "./app.js";
import { initSocket } from "./socket/index.js";
import connectToDB from "./db/db.js";
import { initReminderCron } from "./cron/reminderJob.js";
import Task from "./models/task.model.js";
import { migrateTaskStatus, backfillCompletedAt } from "./utils/taskStatus.js";

const PORT = process.env.PORT || 6000;
const start = async () => {
  await connectToDB();

  // Backfill `status` on tasks created before the workflow field existed.
  // Idempotent: only touches documents that have no `status` yet.
  try {
    const result = await migrateTaskStatus(Task);
    if (result.done || result.todo) {
      console.log(
        `Task status migration: ${result.done} -> done, ${result.todo} -> todo`,
      );
    }
    const completed = await backfillCompletedAt(Task);
    if (completed.backfilled) {
      console.log(
        `Backfilled completedAt on ${completed.backfilled} done task(s) (approximate: uses last-updated time)`,
      );
    }
  } catch (err) {
    console.error("Task status migration failed:", err.message);
  }

  initReminderCron();

  // Socket.IO shares the HTTP server; REST keeps working if it never connects.
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
};

start();