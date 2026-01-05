import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { recurringIncomesService } from './recurring-incomes.service';

export class RecurringIncomesController {
  async list(req: AuthRequest, res: Response) {
    try {
      const items = await recurringIncomesService.list(req.userId!);
      res.json(items);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const item = await recurringIncomesService.create(req.userId!, req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const item = await recurringIncomesService.update(req.userId!, req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await recurringIncomesService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createAllAsTransactions(req: AuthRequest, res: Response) {
    try {
      const result = await recurringIncomesService.createAllAsTransactions(req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async createTransactionFromIncome(req: AuthRequest, res: Response) {
    try {
      const transaction = await recurringIncomesService.createTransactionFromIncome(req.userId!, req.params.id);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const recurringIncomesController = new RecurringIncomesController();

