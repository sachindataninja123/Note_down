import cron from "node-cron";
import Task from "../models/task.model.js";
import Notification from "../models/notification.model.js";

export const initReminderCron = () => {
  // Runs every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find uncompleted tasks with due date in the next 24h
      const dueSoonTasks = await Task.find({
        completed: false,
        dueDate: { $gte: now, $lte: next24Hours },
      });

      for (const task of dueSoonTasks) {
        // Prevent duplicate reminder alerts
        const alreadyNotified = await Notification.findOne({
          recipient: task.owner,
          task: task._id,
          type: "DUE_SOON",
        });

        if (!alreadyNotified) {
          await Notification.create({
            recipient: task.owner,
            task: task._id,
            title: "Task Due Soon",
            message: `Your task "${task.title}" is due in less than 24 hours.`,
            type: "DUE_SOON",
          });
        }
      }
    } catch (error) {
      console.error("Error running reminder cron job:", error.message);
    }
  });
};
