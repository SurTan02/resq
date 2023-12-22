import { type Request, type Response } from "express";
import { pool } from "../db/connection";
import { v4 as uuidv4 } from "uuid"; 

// interfaces/food.ts
export interface Food {
    id?: string;
    name: string;
    description: string;
    price: number;
    discount_price: number;
    quantity: number;
    image: string;
    restaurant_id: string;
    type?: string;
}

export const getFoods = async (req: Request, res: Response) => {
    try {
        const { name } = req.query;
        let rows = null;

        if (name != null) {
            [rows] = await pool.query("SELECT * FROM FOOD WHERE name LIKE ?", [`%${name}%`]);
        } else {
            [rows] = await pool.query("SELECT * FROM FOOD");
        }

        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};

export const getFoodById = async (req: Request, res: Response) => {
    const id = req.params.id;
    const query = `
        SELECT * FROM FOOD WHERE id = ?
    `;
    try {
        const [rows] = await pool.query(query, [id]);
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
    const { name, description, price, discount_price, quantity, image, restaurant_id }: Food = req.body;

    const query = `
        INSERT INTO FOOD (id, name, description, price, discount_price, quantity, image, restaurant_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [id, name, description, price, discount_price, quantity, image, restaurant_id]);
        res.status(201).json({
            message: "Food added successfully",
            data: {
                id, name, description, price, discount_price, quantity, image, restaurant_id
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
        UPDATE FOOD set
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
export const getFoodsByRestaurant = async (req: Request, res: Response) => {
    const restaurant_id = req.params.restaurant_id;
    const query = `
        SELECT * FROM FOOD WHERE restaurant_id = ?
    `;
    try {
        const [rows] = await pool.query(query, [restaurant_id]);
        res.status(200).json({
            "message": "Success",
            "data": rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error in query" });
    }
};
