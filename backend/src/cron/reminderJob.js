import cron from "node-cron";
import Task from "../models/task.model.js";
import Notification from "../models/notification.model.js";
import { createNotification } from "../utils/notify.js";

export const initReminderCron = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const dueSoonTasks = await Task.find({
        status: { $ne: "done" },
        dueDate: { $gte: now, $lte: next24Hours },
      });

      for (const task of dueSoonTasks) {
        // Reminders sent before dedupeKey existed have no key; skip those too.
        const legacy = await Notification.exists({
          recipient: task.owner,
          task: task._id,
          type: "DUE_SOON",
        });
        if (legacy) continue;

        // One reminder per task and person, enforced by the unique dedupeKey
        // (safe even if two server instances run this job at once).
        await createNotification({
          recipient: task.owner,
          task: task._id,
          title: "Task Due Soon",
          message: `Your task "${task.title}" is due in less than 24 hours.`,
          type: "DUE_SOON",
          dedupeKey: `DUE_SOON:${task._id}:${task.owner}`,
        });
      }
    } catch (error) {
      console.error("Error running reminder cron job:", error.message);
    }
  });
};