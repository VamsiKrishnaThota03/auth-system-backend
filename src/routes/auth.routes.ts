import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

export const authRouter = Router();

// Public routes
authRouter.post('/signup', AuthController.signup);
authRouter.post('/login', AuthController.login);

// Protected routes
authRouter.get('/me', authenticateToken, AuthController.getCurrentUser); 