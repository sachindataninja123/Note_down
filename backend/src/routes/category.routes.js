import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { isAuth } from "../middlewares/isAuth.js";

const categoryRouter = express.Router();

categoryRouter.use(isAuth);

categoryRouter.route("/").post(createCategory).get(getCategories);
categoryRouter.route("/:id").put(updateCategory).delete(deleteCategory);

export default categoryRouter;