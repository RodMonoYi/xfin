import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { onboardingService } from './onboarding.service';

export class OnboardingController {
  async setInitialBalance(req: AuthRequest, res: Response) {
    try {
      const { initialBalance } = req.body;
      const user = await onboardingService.setInitialBalance(req.userId!, initialBalance);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const onboardingController = new OnboardingController();

