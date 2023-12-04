import { type Request, type Response, type NextFunction } from "express";

// TODO
export const checkFirebaseToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    if (token == null) {
        return res.status(401).send("No token provided");
    }

    admin.auth().verifyIdToken(token)
        .then((decodedToken) => {
            req.user = decodedToken;
            next();
        })
        .catch(() => {
            res.status(403).send("Unauthorized");
        });
};
