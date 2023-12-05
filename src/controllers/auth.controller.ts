import { type Request, type Response } from "express";
import { pool } from "../db/connection";
import { v4 as uuidv4 } from "uuid"; 
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        
        const [isEmailUsed] = await pool.query(
            "SELECT email from USER where email = ?",
            [email]
        );

        if (isEmailUsed){
            return res.status(400).send({
                message: "Email already in use"
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        await pool.query(
            "INSERT INTO User (id, name, email, password) VALUE (?, ?, ?, ?)",
            [id, name, email, hashedPassword]
        );
  
        res.status(201).json({ message: "User created successfully"});

    } catch (error) {
        console.error("Error registering new user:", error);
        res.status(500).send({ message: "Error registering new user" });
    }
};
  
// login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT * from USER where email = ?",
            [email]
        );

        if (!users || users.length === 0){
            return res.status(401).send({
                message: "Invalid Credential"
            });
        }

        // Compare provided password with hashed password in database
        const validPassword = await bcrypt.compare(password, users[0].password);
        if (!validPassword) {
            return res.status(401).send({
                message: "Invalid credentials"
            });
        }
        
        const accessToken = sign({
            id: users[0].id,
            email: users[0].email,
            name: users[0].name,

        },
            (process.env.JWT_SECRET) as string,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            message: "Success",
            token: accessToken
        });

    } catch (error) {
        console.error("Error registering new user:", error);
        res.status(500).send({ message: "Error registering new user" });
    }
};