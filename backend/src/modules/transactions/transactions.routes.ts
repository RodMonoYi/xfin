import { Router } from 'express';
import { transactionsController } from './transactions.controller';
import { authenticate } from '../../middlewares/auth';

export const transactionsRouter = Router();

transactionsRouter.get('/', authenticate, transactionsController.list.bind(transactionsController));
transactionsRouter.post('/', authenticate, transactionsController.create.bind(transactionsController));
transactionsRouter.put('/:id', authenticate, transactionsController.update.bind(transactionsController));
transactionsRouter.delete('/:id', authenticate, transactionsController.delete.bind(transactionsController));

