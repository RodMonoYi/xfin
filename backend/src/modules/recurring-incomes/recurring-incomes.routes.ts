import { Router } from 'express';
import { recurringIncomesController } from './recurring-incomes.controller';
import { authenticate } from '../../middlewares/auth';

export const recurringIncomesRouter = Router();

recurringIncomesRouter.get('/', authenticate, recurringIncomesController.list.bind(recurringIncomesController));
recurringIncomesRouter.post('/', authenticate, recurringIncomesController.create.bind(recurringIncomesController));
recurringIncomesRouter.put('/:id', authenticate, recurringIncomesController.update.bind(recurringIncomesController));
recurringIncomesRouter.delete('/:id', authenticate, recurringIncomesController.delete.bind(recurringIncomesController));

