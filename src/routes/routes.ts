import express from "express";
import { register} from "../controllers/auth.controller";
import { createRestaurant } from "../controllers/restaurant.controller";
import { createFood, getFoods, updateFood } from "../controllers/food.controller";

const router = express.Router();

router.post("/register", register);

// Restaurant
router.post("/restaurants", createRestaurant);

router.get("/foods", getFoods);
router.post("/foods", createFood);
router.patch("/foods/:id", updateFood);

export default router;
