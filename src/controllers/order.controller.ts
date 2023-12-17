import { type Request, type Response } from "express";
import { pool } from "../db/connection";
import { v4 as uuidv4 } from "uuid"; 
import { RowDataPacket } from "mysql2";

export interface Order extends RowDataPacket {
    id: string;
    user_id: string;
    restaurant_id: string;
    order_date: string;
};

export interface OrderDetail extends RowDataPacket {
    id: string;
    food_id: string;
    quantity: number;
}

export interface OrderRequest {
    restaurant_id: string,
    orders: OrderDetail[];
}

export interface MembershipTypeUser extends RowDataPacket {
    membership_type: string
};

export interface CountOrders extends RowDataPacket {
    count: number
};

export interface Food extends RowDataPacket {
    name: string;
    quantity: number;
};

export interface FoodDetail {
    id: string;
    name: string;
}

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query(
            `
                SELECT * 
                FROM ORDERS
            `
        );
        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query(
            `
                SELECT * 
                FROM ORDERS 
                WHERE user_id = ?
            `,
            [req.user.id]
        );

        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};

export const getOrderDetail = async (req: Request, res: Response) => {
    const orderId = req.params.order_id;

    try {
        const [orderRows] = await pool.query(
            `
                SELECT * 
                FROM ORDER_DETAIL 
                WHERE order_id = ?
            `,
            [orderId]
        );

        res.status(200).json({
            "message": "Success",
            "data": orderRows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};

export const placeOrder = async (req: Request, res: Response) => {
    const id = uuidv4();
    const date = new Date().toISOString().split('T')[0];
    const { restaurant_id, orders }: OrderRequest = req.body;
  
    try {
        // check the quantity of food ordered
        let foodQuantityList = [];
        for (const order of orders) {
            const [foodQuantityResult] = await pool.query <Food[]>(
                `
                    SELECT quantity
                    FROM FOOD
                    WHERE id = ?
                `,
                [order.food_id]
            );
            const foodQuantity = foodQuantityResult[0].quantity;
            foodQuantityList.push(foodQuantity);
    
            if (foodQuantity < order.quantity) {
                return res.status(400).json({
                    message: "Out of stock"
                })
            }
        }

        // check if user is subscribed
        const [membershipTypeResult] = await pool.query<MembershipTypeUser[]>("SELECT membership_type FROM USER WHERE id = ?", [req.user.id]);
        const membershipType = membershipTypeResult[0].membership_type == "premium" ? true : false;

        // check if user has placed an order today
        const [countOrdersResult] = await pool.query<CountOrders[]>(
            `
                SELECT COUNT(*) as count 
                FROM ORDERS 
                WHERE user_id = ? 
                AND order_date = ?
            `,
            [req.user.id, date]
        );
        const [countOrderHistoryResult] = await pool.query<CountOrders[]>(
            `
                SELECT COUNT(*) as count 
                FROM ORDER_HISTORY
                WHERE user_id = ? 
                AND order_date = ?
            `,
            [req.user.id, date]
        );
        const hasOrdered = countOrdersResult[0].count > 0 || countOrderHistoryResult[0].count > 0;

        if (!membershipType && hasOrdered) {
            return res.status(400).json({
                message: "Exceeds order quota"
            })
        }
        
        // insert into orders and order_detail table
        await pool.query(
            `
                INSERT INTO ORDERS (id, user_id, restaurant_id, order_date)
                VALUES (?, ?, ?, ?)
            `,
            [id, req.user.id, restaurant_id, date]
        );
        for (const order of orders) {
            const detailId = uuidv4();
            await pool.query(
                `
                    INSERT INTO ORDER_DETAIL (id, order_id, food_id, quantity)
                    VALUES (?, ?, ?, ?)
                `,
                [detailId, id, order.food_id, order.quantity]
            );
        }

        // update food quantity
        for (const order of orders) {
            let currentFoodQuantity = foodQuantityList.length > 0 ? foodQuantityList.shift()! : 0;
            await pool.query(
                `
                    UPDATE FOOD 
                    SET quantity = ?
                    WHERE id = ?
                `,
                [currentFoodQuantity - order.quantity, order.food_id]
            );
        }

        res.status(201).json({
            message: "Order placed successfully",
            data: {
                id
            }
        });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).send({ message: "Error placing order to the database" });
    }
};

export const updateOrder = async (req: Request, res: Response) => {
    const { order_id, status } = req.body;
    try {
        const [orderDetailResult] = await pool.query<OrderDetail[]>(
            `
                SELECT id, food_id, quantity
                FROM ORDER_DETAIL
                WHERE order_id = ?                  
            `,
            [order_id]
        )

        // update food quantity if order failed
        if (status == "failed") {            
            for (let i = 0; i < orderDetailResult.length; i++) {
                let orderDetail = orderDetailResult[i];

                await pool.query(
                    `                
                    UPDATE FOOD
                    SET quantity = (
                        SELECT f.quantity
                        FROM (
                            SELECT quantity
                            FROM FOOD
                            WHERE id = ?
                        ) AS f
                    ) + ?
                    WHERE id = ?
                    `,
                    [orderDetail.food_id, orderDetail.quantity, orderDetail.food_id]
                );
            }
        } 

        // insert to order history
        await pool.query(
            `
                INSERT INTO ORDER_HISTORY
                SELECT *, ? AS status
                FROM ORDERS
                WHERE id = ?
            `,
            [status, order_id]
        );

        for (let i = 0; i < orderDetailResult.length; i++) {
            let orderDetailId = orderDetailResult[i].id;

            // insert to order history detail
            await pool.query(
                `
                    INSERT INTO ORDER_HISTORY_DETAIL
                    SELECT *
                    FROM ORDER_DETAIL
                    WHERE id = ?
                `,
                [orderDetailId]
            );

            // delete from order detail
            await pool.query(
                `
                    DELETE FROM ORDER_DETAIL
                    WHERE id = ?
                `,
                [orderDetailId]
            );
        }


        // delete from orders
        await pool.query(
            `
                DELETE FROM ORDERS
                WHERE id = ?
            `,
            [order_id]
        );
        res.status(201).json({
            "message": "Order updated successfully"
        });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).send({ message: "Error updating order to the database" });
    }
};

export const getAllOrderHistory = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query(
            `
                SELECT * 
                FROM ORDER_HISTORY
            `
        );
        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};

export const getOrderHistory = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query(
            `
                SELECT * 
                FROM ORDER_HISTORY
                WHERE user_id = ?
            `,
            [req.user.id]
        );
        
        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};

export const getOrderHistoryDetail = async (req: Request, res: Response) => {
    const orderHistoryId = req.params.order_history_id;
    
    try {
        const [rows] = await pool.query(
            `
                SELECT * 
                FROM ORDER_HISTORY_DETAIL
                WHERE order_history_id = ?
            `,
            [orderHistoryId]
        );
        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};

export const getAllSuccessfulOrderHistory = async (req: Request, res: Response) => {
    try {
        const foodDetailList : FoodDetail[] = [];

        const [orderHistoryRows] = await pool.query<Order[]>(
            `
                SELECT id
                FROM ORDER_HISTORY
                WHERE user_id = ?
                AND status = "success"
            `,
            [req.user.id]
        );

        for (const orderHistoryRow of orderHistoryRows) {
            console.log(orderHistoryRow);
            // search food id
            const [orderHistoryDetailRows] = await pool.query<OrderDetail[]>(
                `
                    SELECT food_id
                    FROM ORDER_HISTORY_DETAIL
                    WHERE order_history_id = ?
                `,
                [orderHistoryRow.id]
            )
            for (const orderHistoryDetailRow of orderHistoryDetailRows) {
                console.log(orderHistoryDetailRow)
                // search food name
                const [foodRows] = await pool.query<Food[]>(
                    `
                        SELECT name
                        FROM FOOD
                        WHERE id = ?
                    `,
                    [orderHistoryDetailRow.food_id]
                )

                let foodDetail : FoodDetail = {
                    id: orderHistoryDetailRow.food_id,
                    name: foodRows[0].name
                }
                foodDetailList.push(foodDetail);
            }
            
        }

        res.status(200).json({
            "message": "Success",
            "data": foodDetailList
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};