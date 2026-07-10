import { PrismaClient } from "../../../prisma/generated/prisma";
import AppError from "@utils/AppError";

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
    const existingCategory = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existingCategory) {
        throw new AppError("Category with this slug already exists", 400);
    }
    const category = await prisma.category.create({ data });
    return category;

}

export const getCategoryById = async (id: string) => {
    if(!id){
         throw new AppError("Category ID is required", 400);
    }
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
        throw new AppError("Category not found", 404);
    }
    return category;
};

export const getAll = async () => {
    const categories = await prisma.category.findMany();
    return categories;
}

export const categoryUpdate = async (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if(!id){
        throw new AppError("Category ID is required", 400);
   }
    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
        throw new AppError("Category not found", 404);
    }
    const updatedCategory = await prisma.category.update({
        where: { id },
        data,
    });
    return updatedCategory;
}

export const categoryDelete = async (id: string) => {
    if(!id){
        throw new AppError("Category ID is required", 400);
    }
    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
        throw new AppError("Category not found", 404);
    }
    await prisma.category.delete({ where: { id } });
}