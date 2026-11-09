import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

export const authRouter = Router();

// Slow down password guessing: 20 attempts per IP per 15 minutes on login/signup
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many attempts, please try again later' },
});

// Public routes
authRouter.post('/signup', credentialsLimiter, AuthController.signup);
authRouter.post('/login', credentialsLimiter, AuthController.login);

// Protected routes
authRouter.get('/me', authenticateToken, AuthController.getCurrentUser);
