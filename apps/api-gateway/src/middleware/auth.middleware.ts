import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppError from "@utils/AppError";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Unauthorized", 401));
    }
    const token = authHeader.substring(7); 
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = decoded;
        next();
    } catch (error) {
        next(new AppError("Invalid token", 401));
    }
}