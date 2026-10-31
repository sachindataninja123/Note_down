import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { getAnalytics } from "../controllers/analytics.controller.js";

const analyticsRouter = express.Router();
analyticsRouter.use(isAuth);
analyticsRouter.get("/", getAnalytics);

export default analyticsRouter;