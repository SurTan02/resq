import { Request, Response, NextFunction } from "express";
import { JwtPayload, verify } from "jsonwebtoken";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401); // No token provided

    try {
        verify(token, process.env.JWT_SECRET!, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user as JwtPayload;
            next();
        });
    } catch (error) {
        res.sendStatus(403); // Invalid token
    }
};
