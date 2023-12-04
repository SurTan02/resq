import { type Request, type Response } from "express";
import * as admin from "firebase-admin";

export const register = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password
        });
        res.status(201).send({ userId: userRecord.uid });
    } catch (error) {
        if (error instanceof Error) {
            // Now 'error' is of type 'Error', and you can access 'error.message'
            res.status(400).send(error.message);
        } else {
            // Handle cases where the error is not an instance of Error
            res.status(500).send("An unknown error occurred");
        }
    }
};

// login
// Client hit directly hit firebase