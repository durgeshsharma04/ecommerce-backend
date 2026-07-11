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
            const validationErrors = result.error.issues.map((err) => ({
                field: err.path.length > 0 ? err.path.join(".") : "request",
                message: err.message,
            }));

            res.status(400).json({
                error: "Validation failed",
                details: validationErrors,
            });
        }
    };
};   
     