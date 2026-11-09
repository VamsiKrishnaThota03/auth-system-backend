import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { getJwtSecret } from '../config/env';
import { TokenPayload } from '../types/auth.types';

export const authenticateToken = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;

  if (!token) {
    return next(new AppError(401, 'Authentication token is required'));
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as TokenPayload;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
};

/** Allow only users whose role is in `roles`. Use after authenticateToken. */
export const authorizeRole = (roles: Array<TokenPayload['role']>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }
    next();
  };
};
