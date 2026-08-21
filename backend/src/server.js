import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectToDB from "./db/db.js";
import { initReminderCron } from "./cron/reminderJob.js";

const PORT = process.env.PORT || 6000;
connectToDB();

initReminderCron();

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
