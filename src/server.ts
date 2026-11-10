import { getBindHost, getJwtSecret, getPort } from './config/env';
import { createApp } from './app';
import { prisma } from './lib/prisma';

try {
  getJwtSecret(); // fail fast on a missing or weak secret
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const host = getBindHost();
const port = getPort();

const server = createApp().listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

// Drain in-flight requests and close the Prisma pool when the platform replaces
// the container, so a deploy does not surface as 502s or leaked connections.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server };
