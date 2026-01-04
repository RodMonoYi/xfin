import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { receivablesService } from './receivables.service';

export class ReceivablesController {
  async list(req: AuthRequest, res: Response) {
    try {
      const receivables = await receivablesService.list(req.userId!);
      res.json(receivables);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const receivable = await receivablesService.create(req.userId!, req.body);
      res.status(201).json(receivable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const receivable = await receivablesService.update(req.userId!, req.params.id, req.body);
      res.json(receivable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await receivablesService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async markReceived(req: AuthRequest, res: Response) {
    try {
      const receivable = await receivablesService.markReceived(req.userId!, req.params.id);
      res.json(receivable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async unmarkReceived(req: AuthRequest, res: Response) {
    try {
      const receivable = await receivablesService.unmarkReceived(req.userId!, req.params.id);
      res.json(receivable);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const receivablesController = new ReceivablesController();

