import express from "express";
import { login, register} from "../controllers/auth.controller";
import { createRestaurant, getRestaurants } from "../controllers/restaurant.controller";
import { createFood, getFoods, updateFood } from "../controllers/food.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Restaurant
router.get("/restaurants", getRestaurants);
router.post("/restaurants", createRestaurant);

router.get("/foods", getFoods);
router.post("/foods", authenticateToken, createFood);
router.patch("/foods/:id", authenticateToken, updateFood);

export default router;
