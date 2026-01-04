import { Response } from 'express';
import path from 'path';
import fs from 'fs';
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
      const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const purchaseLinks = req.body.purchaseLinks 
        ? (typeof req.body.purchaseLinks === 'string' ? JSON.parse(req.body.purchaseLinks) : req.body.purchaseLinks)
        : null;

      const item = await wishlistService.create(req.userId!, {
        ...req.body,
        photoUrl,
        purchaseLinks,
      });
      res.status(201).json(item);
    } catch (error: any) {
      // Se houver erro e um arquivo foi enviado, deletar o arquivo
      if (req.file) {
        const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      // Buscar item atual para deletar foto antiga se necessário
      const currentItem = await wishlistService.findById(req.userId!, req.params.id);
      
      const photoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.photoUrl;
      const purchaseLinks = req.body.purchaseLinks 
        ? (typeof req.body.purchaseLinks === 'string' ? JSON.parse(req.body.purchaseLinks) : req.body.purchaseLinks)
        : req.body.purchaseLinks === null ? null : undefined;
      
      // Se uma nova foto foi enviada e havia uma foto antiga, deletar a antiga
      if (req.file && currentItem.photoUrl) {
        const oldFilePath = path.join(process.cwd(), 'uploads', path.basename(currentItem.photoUrl));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const updateData: any = { ...req.body };
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (purchaseLinks !== undefined) updateData.purchaseLinks = purchaseLinks;

      const item = await wishlistService.update(req.userId!, req.params.id, updateData);
      res.json(item);
    } catch (error: any) {
      // Se houver erro e um arquivo foi enviado, deletar o arquivo
      if (req.file) {
        const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      // Buscar item para deletar foto se existir
      const item = await wishlistService.findById(req.userId!, req.params.id);
      
      if (item.photoUrl) {
        const filePath = path.join(process.cwd(), 'uploads', path.basename(item.photoUrl));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await wishlistService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const wishlistController = new WishlistController();

