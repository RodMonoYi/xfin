import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { debtsService } from './debts.service';

export class DebtsController {
  async list(req: AuthRequest, res: Response) {
    try {
      const debts = await debtsService.list(req.userId!);
      res.json(debts);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const debt = await debtsService.create(req.userId!, req.body);
      res.status(201).json(debt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const debt = await debtsService.update(req.userId!, req.params.id, req.body);
      res.json(debt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await debtsService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markPaid(req: AuthRequest, res: Response) {
    try {
      const debt = await debtsService.markPaid(req.userId!, req.params.id);
      res.json(debt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async unmarkPaid(req: AuthRequest, res: Response) {
    try {
      const debt = await debtsService.unmarkPaid(req.userId!, req.params.id);
      res.json(debt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const debtsController = new DebtsController();

