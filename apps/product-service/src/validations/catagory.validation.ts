import { z } from "zod";

export const categorySchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(3, "Category name must be at least 3 characters")
            .max(100),

        description: z
            .string()
            .max(500)
            .optional(),

        slug: z
            .string()
            .min(3)
            .regex(/^[a-z0-9-]+$/)
    })
});