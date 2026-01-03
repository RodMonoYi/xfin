import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { authenticate } from '../../middlewares/auth';

export const onboardingRouter = Router();

onboardingRouter.post('/initial-balance', authenticate, onboardingController.setInitialBalance.bind(onboardingController));

