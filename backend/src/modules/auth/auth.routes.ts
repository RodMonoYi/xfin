import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth';
import { loginRateLimiter } from '../../middlewares/rateLimiter';

export const authRouter = Router();

authRouter.post('/register', authController.register.bind(authController));
authRouter.post('/login', loginRateLimiter, authController.login.bind(authController));
authRouter.post('/refresh', authController.refresh.bind(authController));
authRouter.post('/logout', authenticate, authController.logout.bind(authController));
authRouter.get('/me', authenticate, authController.me.bind(authController));

