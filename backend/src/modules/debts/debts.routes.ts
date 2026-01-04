import { Router } from 'express';
import { debtsController } from './debts.controller';
import { authenticate } from '../../middlewares/auth';

export const debtsRouter = Router();

debtsRouter.get('/', authenticate, debtsController.list.bind(debtsController));
debtsRouter.post('/', authenticate, debtsController.create.bind(debtsController));
debtsRouter.put('/:id', authenticate, debtsController.update.bind(debtsController));
debtsRouter.delete('/:id', authenticate, debtsController.delete.bind(debtsController));
debtsRouter.patch('/:id/mark-paid', authenticate, debtsController.markPaid.bind(debtsController));
debtsRouter.patch('/:id/unmark-paid', authenticate, debtsController.unmarkPaid.bind(debtsController));

