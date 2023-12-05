import { type Request, type Response } from "express";
import { pool } from "../db/connection";
import { v4 as uuidv4 } from "uuid"; 
import { RowDataPacket } from "mysql2";

// interfaces/order.ts
export interface Order {
    id?: string;
    user_id: string;
    food_id: string;
    order_date?: Date;
};

export interface IsSubscribedUser extends RowDataPacket {
    is_subscribed: boolean
};

export interface CountOrders extends RowDataPacket {
    count: number
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query(
            `
                SELECT * 
                FROM orders
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
        const userId = req.params.user_id;
        const [rows] = await pool.query(
            `
                SELECT * 
                FROM orders 
                WHERE user_id = ?
            `,
            [userId]
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

export const placeOrder = async (req: Request, res: Response) => {
    const id = uuidv4();
    const date = new Date().toISOString().split('T')[0];
    const { user_id, food_id }: Order = req.body;
  
    try {
        // check if user is subscribed
        const [isSubscribedResult] = await pool.query<IsSubscribedUser[]>("SELECT is_subscribed FROM user WHERE id = ?", [user_id]);
        const isSubscribed = isSubscribedResult[0].is_subscribed

        // check if user has placed an order today
        const [countOrdersResult] = await pool.query<CountOrders[]>(
            `
                SELECT COUNT(*) as count 
                FROM orders 
                WHERE user_id = ? 
                AND order_date = ?
            `,
            [user_id, date]
        );
        const hasOrdered = countOrdersResult[0].count > 0;

        if (!isSubscribed && hasOrdered) {
            return res.status(400).json({
                message: "Exceeds order quota"
            })
        }
        
        await pool.query(
            `
                INSERT INTO orders (id, user_id, food_id, order_date)
                VALUES (?, ?, ?, ?)
            `,
            [id, user_id, food_id, date]
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