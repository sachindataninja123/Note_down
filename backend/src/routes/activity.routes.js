import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { getActivityFeed } from "../controllers/activity.controller.js";

const activityRouter = express.Router();
activityRouter.use(isAuth);
activityRouter.get("/", getActivityFeed);

export default activityRouter;