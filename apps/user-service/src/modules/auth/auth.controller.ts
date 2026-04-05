import { register, login } from "./auth.service";
// import { AppError } from "@ecommerce/utils";
import { Request, Response, NextFunction } from "express";

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await register(req.body);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = await login(req.body);
        res.json({ token });
    } catch (error) {
        next(error);
    }
};