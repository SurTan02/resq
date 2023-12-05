import express from "express";
import { register} from "../controllers/auth.controller";
import { createRestaurant } from "../controllers/restaurant.controller";
import { createFood, getFoods, searchFoodsByName, updateFood } from "../controllers/food.controller";
import { placeOrder, getAllOrders, getOrders } from "../controllers/order.controller";

const router = express.Router();

router.post("/register", register);

// Restaurant
router.post("/restaurants", createRestaurant);

router.get("/foods", getFoods);
router.post("/foods", createFood);
router.patch("/foods/:id", updateFood);
router.get("/foods/:food_name", searchFoodsByName);

// Order
router.get("/orders", getAllOrders);
router.get("/orders/:user_id", getOrders);
router.post("/orders", placeOrder);

export default router;
