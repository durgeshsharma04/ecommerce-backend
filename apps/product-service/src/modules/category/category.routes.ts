import {Router} from 'express';
import { createCategory, getCategory, updateCategory, deleteCategory, getAllCategory } from './category.controllers';
import {validate}  from '@utils/validate';
import {categorySchema} from '../../validations/catagory.validation'
const categoryRouter = Router();

categoryRouter.post('/', validate(categorySchema), createCategory);
categoryRouter.get('/', getAllCategory);
categoryRouter.get('/:id', getCategory);
categoryRouter.put('/:id', updateCategory);
categoryRouter.delete('/:id', deleteCategory);

export default categoryRouter;