import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { signupSchema, loginSchema } from '../utils/validation';
import { AppError } from '../middlewares/error.middleware';

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedInput = signupSchema.parse(req.body);
      const result = await AuthService.signup(validatedInput);
      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedInput);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'Authentication required');
      }

      const user = await AuthService.getCurrentUser(req.user.id);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await AuthService.listUsers();
      res.status(200).json({ status: 'success', data: { users } });
    } catch (error) {
      next(error);
    }
  }
}
