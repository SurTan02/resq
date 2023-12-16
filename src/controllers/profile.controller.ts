import { type Request, type Response } from "express";
import { pool } from "../db/connection";
import { RowDataPacket } from "mysql2";

export const profile = async (req: Request, res: Response) => {
    try {
        
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT email, name, membership_type from USER where id = ?",
            [req.user.id]
        );

        res.status(200).json({
            message: "Success",
            data: rows[0]
        });

    } catch (error) {
        console.error("Error registering new user:", error);
        res.status(500).send({ message: "Error registering new user" });
    }
};