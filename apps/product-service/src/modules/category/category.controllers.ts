import { Request, Response, NextFunction } from 'express';
import AppError from "@utils/AppError";
import { newCatagory } from './category.services';

export async function createCategory(req: Request, res: Response, next: NextFunction) {
    try {

        const catagoryData = await newCatagory(req.body);
        res.status(201).json(catagoryData);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        next(new AppError(message, 500));
    }
}


export async function getCategory(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('Getting category with ID:', req.params.id);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        next(new AppError(message, 500));
    }
}

export async function getAllCategory(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('Getting all categories');
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        next(new AppError(message, 500));
    }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('Updating category with ID:', req.params.id, 'and data:', req.body);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        next(new AppError(message, 500));
    }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
        console.log('Deleting category with ID:', req.params.id);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        next(new AppError(message, 500));
    }
}