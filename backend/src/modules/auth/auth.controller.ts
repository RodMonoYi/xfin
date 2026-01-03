import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import { authService } from './auth.service';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register({ name, email, password });
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === 'Email já cadastrado') {
        return res.status(409).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password, rememberMe } = req.body;
      const result = await authService.login(email, password, rememberMe || false);
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Credenciais inválidas') {
        return res.status(401).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }
      const refreshToken = authHeader.substring(7);
      const result = await authService.refresh(refreshToken);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const refreshToken = authHeader.substring(7);
        await authService.logout(refreshToken);
      }
      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async me(req: AuthRequest, res: Response) {
    try {
      const user = await authService.getUserById(req.userId!);
      res.json(user);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();

