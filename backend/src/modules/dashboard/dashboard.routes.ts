import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/auth';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', authenticate, dashboardController.getSummary.bind(dashboardController));

