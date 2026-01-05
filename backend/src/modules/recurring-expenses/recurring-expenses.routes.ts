import { Router } from 'express';
import { recurringExpensesController } from './recurring-expenses.controller';
import { authenticate } from '../../middlewares/auth';

export const recurringExpensesRouter = Router();

recurringExpensesRouter.get('/', authenticate, recurringExpensesController.list.bind(recurringExpensesController));
recurringExpensesRouter.post('/', authenticate, recurringExpensesController.create.bind(recurringExpensesController));
recurringExpensesRouter.put('/:id', authenticate, recurringExpensesController.update.bind(recurringExpensesController));
recurringExpensesRouter.delete('/:id', authenticate, recurringExpensesController.delete.bind(recurringExpensesController));
recurringExpensesRouter.post('/create-all-transactions', authenticate, recurringExpensesController.createAllAsTransactions.bind(recurringExpensesController));
recurringExpensesRouter.post('/:id/create-transaction', authenticate, recurringExpensesController.createTransactionFromExpense.bind(recurringExpensesController));

