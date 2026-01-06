import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { transactionsService } from './transactions.service';

export class TransactionsController {
  async list(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, categoryId, type, isImportant } = req.query;
      const transactions = await transactionsService.list(req.userId!, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        categoryId: categoryId as string | undefined,
        type: type as string | undefined,
        isImportant: isImportant ? isImportant === 'true' : undefined,
      });
      res.json(transactions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const transaction = await transactionsService.create(req.userId!, req.body);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const transaction = await transactionsService.update(req.userId!, req.params.id, req.body);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await transactionsService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const transactionsController = new TransactionsController();

