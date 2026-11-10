import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
};

export const errorHandler = (
  err: Error & { type?: string; status?: number },
  _req: Request,
  res: Response,

  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ status: 'error', message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  // Malformed or oversized JSON bodies from express.json()
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ status: 'error', message: 'Request body is not valid JSON' });
    return;
  }
  if (err.type === 'entity.too.large') {
    res.status(413).json({ status: 'error', message: 'Request body is too large' });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ status: 'error', message: 'A user with this email already exists' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
};
