import { PrismaClient } from "../../../prisma/generated/prisma";

const prisma = new PrismaClient();

export interface Category {
    id: number;
    name: string;
    description?: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}
export const newCatagory = async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const category = await prisma.category.create({ data });
        return category;

    } catch (error) {
        console.error("Error creating category:", error);
        throw new Error("Failed to create category");
    }
}