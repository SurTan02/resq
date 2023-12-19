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
    restaurant_id: string;
    food_id: string;
    quantity: number;
}

export interface Restaurant extends RowDataPacket {
    open_time: string;
    close_time: string;
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
    const { restaurant_id, food_id, quantity }: OrderRequest = req.body;
    const id = uuidv4();
    const date = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Jakarta' });
    const time = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Jakarta', hour12: false });

    const [month, day, year] = date.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`).toISOString().split('T')[0];
  
    try {
        // check the pickup time of restaurant
        const [pickupTimeResult] = await pool.query<Restaurant[]>(
            `
                SELECT open_time, close_time
                FROM RESTAURANT
                WHERE ID = ?
            `,
            [restaurant_id]
        );
        const openTimeStr = pickupTimeResult[0].open_time;
        const closeTimeStr = pickupTimeResult[0].close_time;

        const openTimeParts = openTimeStr.split(":");
        let openTimeDate = new Date();
        openTimeDate.setHours(parseInt(openTimeParts[0], 10));
        openTimeDate.setMinutes(parseInt(openTimeParts[1], 10));
        openTimeDate.setSeconds(parseInt(openTimeParts[2], 10));
        let openTime = openTimeDate.toLocaleTimeString();

        const closeTimeParts = closeTimeStr.split(":");
        let closeTimeDate = new Date();
        closeTimeDate.setHours(parseInt(closeTimeParts[0], 10));
        closeTimeDate.setMinutes(parseInt(closeTimeParts[1], 10));
        closeTimeDate.setSeconds(parseInt(closeTimeParts[2], 10));
        let closeTime = closeTimeDate.toLocaleTimeString();
        
        if (time < openTime || time > closeTime) {
            return res.status(400).json({
                message: "Restaurant is closed"
            })
        }

        // check the quantity of food ordered
        const [foodQuantityResult] = await pool.query <Food[]>(
            `
                SELECT quantity
                FROM FOOD
                WHERE id = ?
            `,
            [food_id]
        );
        const foodQuantity = foodQuantityResult[0].quantity;

        if (foodQuantity < quantity) {
            return res.status(400).json({
                message: "Out of stock"
            })
        }

        // check if user is subscribed
        let hasOrdered = false;
        const [membershipTypeResult] = await pool.query<MembershipTypeUser[]>("SELECT membership_type FROM USER WHERE id = ?", [req.user.id]);
        const isSubscribed = membershipTypeResult[0].membership_type == "premium" ? true : false;

        // check if user has placed an order today
        const [countOrdersResult] = await pool.query<CountOrders[]>(
            `
                SELECT COUNT(*) as count 
                FROM ORDERS 
                WHERE user_id = ? 
                AND order_date = ?
            `,
            [req.user.id, formattedDate]
        );

        if (!isSubscribed) {
            const [countOrderHistoryResult] = await pool.query<CountOrders[]>(
                `
                    SELECT COUNT(*) as count 
                    FROM ORDER_HISTORY
                    WHERE user_id = ? 
                    AND order_date = ?
                `,
                [req.user.id, formattedDate]
            );
            hasOrdered = countOrdersResult[0].count > 0 || countOrderHistoryResult[0].count > 0;
        }

        if (!isSubscribed && hasOrdered) {
            return res.status(400).json({
                message: "Exceeds order quota"
            })
        }
        
        // insert into orders and order_detail table   
        let orderId = "";   
        // check if the user has placed order
        if (countOrdersResult[0].count == 0) {
            orderId = id;
            await pool.query(
                `
                    INSERT INTO ORDERS (id, user_id, restaurant_id, order_date)
                    VALUES (?, ?, ?, ?)
                `,
                [orderId, req.user.id, restaurant_id, formattedDate]
            );

            // set expired when exceeds pickup time
            // calculate delay time
            const currentDate = new Date().toLocaleDateString('en-US');
            const targetCurrentTime = currentDate + ' ' + time;
            const targetCloseTime = currentDate + ' ' + closeTime;

            const currentTimeInMs = new Date(targetCurrentTime).getTime();
            const closeTimeInMs = new Date(targetCloseTime).getTime();

            const delay = closeTimeInMs - currentTimeInMs;

            // start the asynchronous function after the delay
            setTimeout(async () => {
                await updateOrderProcess(orderId, "failed");
            }, delay);

        } else {
            const [orderIdResult] = await pool.query<Order[]>(
                `
                    SELECT id
                    FROM ORDERS 
                    WHERE user_id = ? 
                    AND order_date = ?
                `,
                [req.user.id, formattedDate]
            );
            orderId = orderIdResult[0].id;
        }
        
        const detailId = uuidv4();
        await pool.query(
            `
                INSERT INTO ORDER_DETAIL (id, order_id, food_id, quantity)
                VALUES (?, ?, ?, ?)
            `,
            [detailId, orderId, food_id, quantity]
        );

        // update food quantity
        await pool.query(
            `
                UPDATE FOOD 
                SET quantity = ?
                WHERE id = ?
            `,
            [foodQuantity - quantity, food_id]
        );

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
        await updateOrderProcess(order_id, status);
        res.status(201).json({
            "message": "Order updated successfully"
        });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).send({ message: "Error updating order to the database" });
    }
};

const updateOrderProcess = async (orderId: string, status: string) => {
    const [orderDetailResult] = await pool.query<OrderDetail[]>(
        `
            SELECT id, food_id, quantity
            FROM ORDER_DETAIL
            WHERE order_id = ?                  
        `,
        [orderId]
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
        [status, orderId]
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
        [orderId]
    );
}

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