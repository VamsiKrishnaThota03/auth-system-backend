import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOrigin } from './config/env';
import { prisma } from './lib/prisma';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs for rate limiting behind Render/Heroku-style proxies

  app.use(
    helmet({
      // A JSON API on a different origin from any client: nothing here is ever
      // loaded as a subresource, so deny everything.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': ["'none'"],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'none'"],
          'form-action': ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
      hsts: { maxAge: 31_536_000, includeSubDomains: true },
    }),
  );

  app.use(cors({ origin: corsOrigin() }));
  app.use(express.json({ limit: '10kb' }));

  // Liveness: the process is accepting connections. Independent of the
  // database, so a transient DB blip does not trigger a restart.
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Readiness: the process can actually serve traffic.
  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready' });
    } catch {
      res.set('Retry-After', '30');
      res.status(503).json({ status: 'unavailable', message: 'Database unreachable' });
    }
  });

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler as ErrorRequestHandler);

  return app;
}
