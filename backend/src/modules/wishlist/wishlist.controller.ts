import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { wishlistService } from './wishlist.service';

export class WishlistController {
  async list(req: AuthRequest, res: Response) {
    try {
      const items = await wishlistService.list(req.userId!);
      res.json(items);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const item = await wishlistService.create(req.userId!, req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const item = await wishlistService.update(req.userId!, req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await wishlistService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const wishlistController = new WishlistController();

