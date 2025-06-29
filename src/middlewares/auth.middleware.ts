import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { UserResponse } from '../types/auth.types';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError(401, 'Authentication token is required');
  }

  try {
    const user = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as UserResponse;
    req.user = user;
    next();
  } catch (error) {
    throw new AppError(403, 'Invalid or expired token');
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    next();
  };
}; 