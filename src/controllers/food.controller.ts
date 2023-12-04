import { type Request, type Response } from "express";
import { pool } from "../db/connection";
import { v4 as uuidv4 } from "uuid"; 

// interfaces/food.ts
export interface Food {
    id?: string;
    name: string;
    description: string;
    price: number;
    restaurant_id: string;
}

export const getFoods = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query("SELECT * FROM food");
        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};

export const createFood = async (req: Request, res: Response) => {
    const id = uuidv4();
    const { name, description, price, restaurant_id }: Food = req.body;

    const query = `
        INSERT INTO food (id, name, description, price, restaurant_id) 
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [id, name, description, price, restaurant_id]);
        res.status(201).json({
            message: "Food added successfully",
            data: {
                id, name, description, price, restaurant_id
            }
        });
    } catch (error) {
        console.error("Error adding restaurant:", error);
        res.status(500).send({ message: "Error adding restaurant to the database" });
    }
};

export const updateFood =async (req: Request, res: Response) => {
    const id = req.params.id;
    const { name, description, price}: Food = req.body;

    const query = `
        UPDATE food set
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            price = COALESCE(?, price)
        WHERE id = ?

    `;

    try {
        await pool.query(query, [name, description, price, id]);
        res.status(201).json({
            message: "Food updated successfully",
            data: {
                id, name, description, price, 
            }
        });
    } catch (error) {
        console.error("Error adding restaurant:", error);
        res.status(500).send({ message: "Error adding restaurant to the database" });
    }
};

// TODO
// getFoods by restaurant
// getFood by id
// deleteFood

export const searchFoodsByName = async (req: Request, res: Response) => {
    const name = req.params.food_name;

    const query = `
        SELECT * 
        FROM food 
        WHERE name LIKE ?
    `;

    try {
        const [rows] = await pool.query(query, [`%${name}%`]);

        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};