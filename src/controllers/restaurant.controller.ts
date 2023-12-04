// routes/restaurantRoutes.ts
import { Request, Response } from "express";
import { pool } from "../db/connection";
import { v4 as uuidv4 } from "uuid"; 

// interfaces/restaurant.ts
export interface Restaurant {
    id?: string;
    name: string;
    address: string;
    phone_number: string;
    rating: number;
}

export const createRestaurant = async (req: Request, res: Response) => {
    const id = uuidv4();
    const { name, address, phone_number, rating }: Restaurant = req.body;

    const query = `
        INSERT INTO restaurant (id, name, address, phone_number, rating) 
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [id, name, address, phone_number, rating]);
        res.status(201).json({ message: "Restaurant added successfully", restaurantId: id });
    } catch (error) {
        console.error("Error adding restaurant:", error);
        res.status(500).send({ message: "Error adding restaurant to the database" });
    }
};

// TODO
// getRestaurants
// updateRestaurant
// deleteRestaurant