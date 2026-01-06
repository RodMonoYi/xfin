import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../../middlewares/auth';
import { piggyBanksService } from './piggy-banks.service';

export class PiggyBanksController {
  async list(req: AuthRequest, res: Response) {
    try {
      const items = await piggyBanksService.list(req.userId!);
      res.json(items);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async findById(req: AuthRequest, res: Response) {
    try {
      const item = await piggyBanksService.findById(req.userId!, req.params.id);
      res.json(item);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      console.log('Arquivo recebido:', req.file);
      console.log('Body recebido:', req.body);
      
      const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const item = await piggyBanksService.create(req.userId!, {
        name: req.body.name,
        description: req.body.description || null,
        photoUrl,
        targetAmount: req.body.targetAmount ? parseFloat(req.body.targetAmount) : null,
        amountPerPeriod: parseFloat(req.body.amountPerPeriod),
        periodType: req.body.periodType,
      });
      res.status(201).json(item);
    } catch (error: any) {
      console.error('Erro ao criar caixinha:', error);
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
      console.log('Arquivo recebido (update):', req.file);
      console.log('Body recebido (update):', req.body);
      
      const currentPiggyBank = await piggyBanksService.findById(req.userId!, req.params.id);
      
      const photoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.photoUrl;
      
      if (req.file && currentPiggyBank.photoUrl) {
        const oldFilePath = path.join(process.cwd(), 'uploads', path.basename(currentPiggyBank.photoUrl));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.description !== undefined) updateData.description = req.body.description || null;
      updateData.photoUrl = photoUrl;
      if (req.body.targetAmount !== undefined) updateData.targetAmount = req.body.targetAmount ? parseFloat(req.body.targetAmount) : null;
      if (req.body.amountPerPeriod) updateData.amountPerPeriod = parseFloat(req.body.amountPerPeriod);
      if (req.body.periodType) updateData.periodType = req.body.periodType;

      const item = await piggyBanksService.update(req.userId!, req.params.id, updateData);
      res.json(item);
    } catch (error: any) {
      console.error('Erro ao atualizar caixinha:', error);
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
      await piggyBanksService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async addTransaction(req: AuthRequest, res: Response) {
    try {
      const transaction = await piggyBanksService.addTransaction(
        req.userId!,
        req.params.id,
        req.body
      );
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const transactions = await piggyBanksService.getTransactions(
        req.userId!,
        req.params.id
      );
      res.json(transactions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const piggyBanksController = new PiggyBanksController();

