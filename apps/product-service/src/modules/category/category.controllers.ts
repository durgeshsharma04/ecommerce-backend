import { Request, Response, NextFunction } from 'express';

export function createCategory(req: Request, res: Response, next: NextFunction) {
    console.log('Creating category with data:', req.body);
}


export function getCategory(req: Request, res: Response, next: NextFunction) {
    console.log('Getting category with ID:', req.params.id);
}

export function updateCategory(req: Request, res: Response, next: NextFunction) {
    console.log('Updating category with ID:', req.params.id, 'and data:', req.body);
}

export function deleteCategory(req: Request, res: Response, next: NextFunction) {
    console.log('Deleting category with ID:', req.params.id);
}