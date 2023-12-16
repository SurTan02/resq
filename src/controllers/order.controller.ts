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

export interface MembershipTypeUser extends RowDataPacket {
    membership_type: string
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
    const { food_id }: Order = req.body;
  
    try {
        // check if user is subscribed
        const [membershipTypeResult] = await pool.query<MembershipTypeUser[]>("SELECT membership_type FROM user WHERE id = ?", [req.user.id]);
        const membershipType = membershipTypeResult[0].membership_type == "premium" ? true : false;

        // check if user has placed an order today
        const [countOrdersResult] = await pool.query<CountOrders[]>(
            `
                SELECT COUNT(*) as count 
                FROM orders 
                WHERE user_id = ? 
                AND order_date = ?
            `,
            [req.user.id, date]
        );
        const hasOrdered = countOrdersResult[0].count > 0;

        if (!membershipType && hasOrdered) {
            return res.status(400).json({
                message: "Exceeds order quota"
            })
        }
        
        await pool.query(
            `
                INSERT INTO orders (id, user_id, food_id, order_date)
                VALUES (?, ?, ?, ?)
            `,
            [id, req.user.id, food_id, date]
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
        await pool.query(
            `
                INSERT INTO order_history
                SELECT *, ? AS status
                FROM orders
                WHERE id = ?
            `,
            [status, order_id]
        );
        await pool.query(
            `
                DELETE FROM orders
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
                FROM order_history
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
        const userId = req.params.user_id;
        const [rows] = await pool.query(
            `
                SELECT * 
                FROM order_history
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