import {Router} from 'express';
import { createCategory, getCategory, updateCategory, deleteCategory } from './category.controllers';

const categoryRouter = Router();

categoryRouter.post('/', createCategory);
categoryRouter.get('/:id', getCategory);
categoryRouter.put('/:id', updateCategory);
categoryRouter.delete('/:id', deleteCategory);

export default categoryRouter;