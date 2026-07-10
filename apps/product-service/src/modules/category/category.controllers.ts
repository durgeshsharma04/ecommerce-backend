import { Request, Response, NextFunction } from 'express';
import AppError from "@utils/AppError";
import { newCatagory, getCategoryById, getAll, categoryUpdate, categoryDelete } from './category.services';

export async function createCategory(req: Request, res: Response, next: NextFunction) {
    try {
        const catagoryData = await newCatagory(req.body);
        res.status(201).json(catagoryData);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        next(new AppError(message, statusCode));
    }
}


export async function getCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const categoryId = req.params.id;
        const category = await getCategoryById(categoryId);
        res.status(200).json(category);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        next(new AppError(message, statusCode));
    }
}

export async function getAllCategory(req: Request, res: Response, next: NextFunction) {
    try {
       const categories = await getAll();
       res.status(200).json(categories);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        next(new AppError(message, statusCode));
    }
}

export async function updateCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const categoryId = req.params.id;
        const updatedData = req.body;
        const updatedCategory = await categoryUpdate(categoryId, updatedData);
        res.status(200).json(updatedCategory);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        next(new AppError(message, statusCode));
    }
}

export async function deleteCategory(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        const categoryId = req.params.id;
        const category = await categoryDelete(categoryId);
        res.status(200).json({ message: `Category with id: ${categoryId} was deleted successfully` });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const statusCode = error instanceof AppError ? error.statusCode : 500;
        next(new AppError(message, statusCode));
    }
}