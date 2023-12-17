import express from "express";
import { login, register} from "../controllers/auth.controller";
import { createRestaurant, getRestaurants } from "../controllers/restaurant.controller";
import { createFood, getFoodById, getFoods, getFoodsByRestaurant, updateFood } from "../controllers/food.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { profile, subscribe } from "../controllers/profile.controller";
import { placeOrder, getAllOrders, getOrders, updateOrder, getAllOrderHistory, getOrderHistory, getOrderDetail, getOrderHistoryDetail } from "../controllers/order.controller";

const router = express.Router();

// Auth
router.post("/register", register);
router.post("/login", login);
router.get("/profile/me", authenticateToken, profile);
router.post("/subscribe", authenticateToken, subscribe);

// Restaurant
router.get("/restaurants", getRestaurants);
router.post("/restaurants", createRestaurant);
router.get("/foods/restaurant/:restaurant_id", getFoodsByRestaurant);


// Food
router.get("/foods", getFoods);
router.get("/foods/:id", getFoodById);
router.post("/foods", createFood);
router.patch("/foods/:id", authenticateToken, updateFood);

// Order
router.get("/orders/all", getAllOrders);
router.get("/orders", authenticateToken, getOrders);
router.get("/orders/:order_id", getOrderDetail);
router.post("/order", authenticateToken, placeOrder);

router.post("/update-order", updateOrder);
router.get("/order/history/all", getAllOrderHistory);
router.get("/order/history", authenticateToken, getOrderHistory);
router.get("/order/history/:order_history_id", getOrderHistoryDetail);

export default router;
