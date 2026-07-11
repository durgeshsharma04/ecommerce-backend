import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate = <T extends z.ZodType>(schema: T) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (result.success) {
            next();
        } else {
            const errorMessages = result.error.issues.map((err) => err.message).join(", ");
            res.status(400).json({ error: errorMessages });
        }
    };
};   
     