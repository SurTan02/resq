import { Request, Response } from "express";
import { pool } from "../db/connection";
import { v4 as uuidv4 } from "uuid"; 
import { RowDataPacket } from "mysql2";

export interface Restaurant {
    id?: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone_number: string;
    rating: number;
    open_time: string;
    close_time: string;
}

export const createRestaurant = async (req: Request, res: Response) => {
    const id = uuidv4();
    const { 
        name, 
        address, 
        latitude,
        longitude,
        phone_number, 
        rating, 
        open_time, 
        close_time }: Restaurant = req.body;

    const query = `
        INSERT INTO RESTAURANT (id, name, address, latitude, longitude, phone_number, rating, open_time, close_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(query, [id, name, address, latitude, longitude, phone_number, rating, open_time, close_time]);
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

export const getRestaurantById =async (req: Request, res: Response) => {
    const id = req.params.id;
    const restaurant_query = `
        SELECT * FROM RESTAURANT WHERE id = ?
    `;
    const food_query = `
        SELECT 
        id, name, description, price, discount_price, quantity, image
        FROM FOOD WHERE restaurant_id = ?
    `;
    try {
        const [restaurant] = await pool.query<RowDataPacket[]>(restaurant_query, [id]);

        if (!restaurant || restaurant.length === 0){
            return res.status(404).send({
                message: `There is no restaurant with ID ${id}`
            });
        }

        const [foods] = await pool.query<RowDataPacket[]>(food_query, [id]);
        res.status(200).json({
            "message": "Success",
            "data": {
                ...restaurant[0],
                "foods": foods
            },
        });
    } catch (error) {
        console.error("Error adding restaurant:", error);
        res.status(500).send({ message: "Error adding restaurant to the database" });
    }
};
