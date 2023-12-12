import express from "express";
import { login, register} from "../controllers/auth.controller";
import { createRestaurant, getRestaurants } from "../controllers/restaurant.controller";
import { createFood, getFoodById, getFoods, getFoodsByRestaurant, updateFood } from "../controllers/food.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { profile } from "../controllers/profile.controller";

const router = express.Router();

// Auth
router.post("/register", register);
router.post("/login", login);
router.get("/profile/me", authenticateToken, profile);

// Restaurant
router.get("/restaurants", getRestaurants);
router.post("/restaurants", createRestaurant);
router.get("/foods/restaurant/:restaurant_id", getFoodsByRestaurant);


// Food
router.get("/foods", getFoods);
router.get("/foods/:id", getFoodById);
router.post("/foods", createFood);
router.patch("/foods/:id", authenticateToken, updateFood);

export default router;
