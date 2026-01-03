import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authenticate } from '../../middlewares/auth';

export const categoriesRouter = Router();

categoriesRouter.get('/', authenticate, categoriesController.list.bind(categoriesController));
categoriesRouter.post('/', authenticate, categoriesController.create.bind(categoriesController));
categoriesRouter.put('/:id', authenticate, categoriesController.update.bind(categoriesController));
categoriesRouter.delete('/:id', authenticate, categoriesController.delete.bind(categoriesController));

