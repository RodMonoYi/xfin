import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  async getSummary(req: AuthRequest, res: Response) {
    try {
      const summary = await dashboardService.getSummary(req.userId!);
      res.json(summary);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const dashboardController = new DashboardController();

