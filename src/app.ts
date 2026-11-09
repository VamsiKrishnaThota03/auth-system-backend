import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { corsOrigin } from './config/env';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs for rate limiting behind Render/Heroku-style proxies
  app.use(cors({ origin: corsOrigin() }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler as ErrorRequestHandler);

  return app;
}
