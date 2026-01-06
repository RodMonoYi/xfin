import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { categoriesService } from './categories.service';

export class CategoriesController {
  async list(req: AuthRequest, res: Response) {
    try {
      const categories = await categoriesService.list(req.userId!);
      res.json(categories);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const category = await categoriesService.create(req.userId!, req.body);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const category = await categoriesService.update(req.userId!, req.params.id, req.body);
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await categoriesService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const categoriesController = new CategoriesController();

