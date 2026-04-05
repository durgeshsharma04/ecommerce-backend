import { Request, Response, NextFunction } from "express";
import AppError from "@utils/AppError";

export const roleMiddleware = (requiredRole: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) {
            return next(new AppError("Unauthorized", 401));
        }
        if (!requiredRole.includes(user.role)) {
            return next(new AppError("Forbidden", 403));
        }
        next();
    };  
}