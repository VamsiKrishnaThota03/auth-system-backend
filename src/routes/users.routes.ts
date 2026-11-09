import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';

export const usersRouter = Router();

// Admin-only example of role-based access control
usersRouter.get('/', authenticateToken, authorizeRole(['ADMIN']), AuthController.listUsers);
