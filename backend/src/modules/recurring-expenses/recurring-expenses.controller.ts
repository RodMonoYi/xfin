import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { recurringExpensesService } from './recurring-expenses.service';

export class RecurringExpensesController {
  async list(req: AuthRequest, res: Response) {
    try {
      const items = await recurringExpensesService.list(req.userId!);
      res.json(items);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const item = await recurringExpensesService.create(req.userId!, req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const item = await recurringExpensesService.update(req.userId!, req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await recurringExpensesService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createAllAsTransactions(req: AuthRequest, res: Response) {
    try {
      const result = await recurringExpensesService.createAllAsTransactions(req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createTransactionFromExpense(req: AuthRequest, res: Response) {
    try {
      const transaction = await recurringExpensesService.createTransactionFromExpense(req.userId!, req.params.id);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const recurringExpensesController = new RecurringExpensesController();

