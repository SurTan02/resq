import express from "express";
import { login, register} from "../controllers/auth.controller";
import { createRestaurant, getRestaurants } from "../controllers/restaurant.controller";
import { createFood, getFoodById, getFoods, getFoodsByRestaurant, searchFoodsByName, updateFood } from "../controllers/food.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { profile } from "../controllers/profile.controller";
import { placeOrder, getAllOrders, getOrders, updateOrder, getAllOrderHistory, getOrderHistory } from "../controllers/order.controller";

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
router.get("/foods/:food_name", searchFoodsByName);

// Order
router.get("/orders", getAllOrders);
router.get("/orders/:user_id", getOrders);
router.post("/orders", authenticateToken, placeOrder);

router.post("/update-order", updateOrder);
router.get("/order/history", getAllOrderHistory);
router.get("/order/history/:user_id", getOrderHistory);

export default router;
