import { Request, Response } from "express";
import { pool } from "../db/connection";
import { v4 as uuidv4 } from "uuid"; 

export interface Restaurant {
    id?: string;
    name: string;
    address: string;
    phone_number: string;
    rating: number;
    open_time: string;
    close_time: string;
}

export const createRestaurant = async (req: Request, res: Response) => {
    const id = uuidv4();
    const { name, address, phone_number, rating, open_time, close_time }: Restaurant = req.body;

    const query = `
        INSERT INTO RESTAURANT (id, name, address, phone_number, rating, open_time, close_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [id, name, address, phone_number, rating, open_time, close_time]);
        res.status(201).json({ message: "Restaurant added successfully", restaurantId: id });
    } catch (error) {
        console.error("Error adding restaurant:", error);
        res.status(500).send({ message: "Error adding restaurant to the database" });
    }
};

export const getRestaurants =async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query("SELECT * FROM RESTAURANT");
        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error("Error adding restaurant:", error);
        res.status(500).send({ message: "Error adding restaurant to the database" });
    }
};
