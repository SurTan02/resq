import express from "express";
import { login, register} from "../controllers/auth.controller";
import { createRestaurant, getRestaurantById, getRestaurants } from "../controllers/restaurant.controller";
import { createFood, getFoodById, getFoods, getFoodsByRestaurant, updateFood } from "../controllers/food.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { getSubscription, profile, subscribe } from "../controllers/profile.controller";
import { placeOrder, getAllOrders, getOrders, updateOrder, getAllOrderHistory, getOrderHistory, getOrderDetail, getOrderHistoryDetail, getAllSuccessfulOrderHistory } from "../controllers/order.controller";

const router = express.Router();

// Auth
router.post("/register", register);
router.post("/login", login);
router.get("/profile/me", authenticateToken, profile);
router.post("/subscribe", authenticateToken, subscribe);
router.get("/subscription", authenticateToken, getSubscription);

// Restaurant
router.get("/restaurants", getRestaurants);
router.get("/restaurants/:id", getRestaurantById);
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
router.get("/order/histories/all", getAllOrderHistory);
router.get("/order/history", authenticateToken, getOrderHistory);
router.get("/order/history/:order_history_id", getOrderHistoryDetail);

// ML data
router.get("/order-history", authenticateToken, getAllSuccessfulOrderHistory);

export default router;
