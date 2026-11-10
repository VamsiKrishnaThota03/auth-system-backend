import dotenv from 'dotenv';

dotenv.config();

/** JWT signing secret. There is deliberately no fallback value. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET must be set to a random string of at least 16 characters (see .env.example).',
    );
  }
  return secret;
}

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Address to bind the HTTP listener to.
 *
 * Loopback by default, so a development server is never reachable from the
 * local network. Managed platforms route traffic into the container and need
 * an all-interfaces bind, so they are detected by their own env markers;
 * `HOST` overrides both. Inside a container the published port — not this
 * bind — is the security boundary.
 */
export function getBindHost(): string {
  if (process.env.HOST) return process.env.HOST;
  const managedPlatform =
    process.env.RENDER ||
    process.env.FLY_APP_NAME ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.DYNO;
  return managedPlatform ? '0.0.0.0' : '127.0.0.1';
}

/** Port for the HTTP listener. Validated rather than silently coerced. */
export function getPort(): number {
  const raw = process.env.PORT;
  if (!raw) return 3000;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value ${JSON.stringify(raw)}; expected an integer 1-65535.`);
  }
  return port;
}

/**
 * CORS_ORIGIN: comma-separated allowlist.
 *
 * Unset means any origin. That is deliberate and safe here specifically because
 * this API authenticates with a bearer token and sets no cookies, so a hostile
 * page cannot ride along on a user's ambient credentials — there are none. If
 * cookie auth is ever added, this must become an explicit allowlist and
 * `credentials: true` must never be paired with reflecting the caller's origin.
 */
export function corsOrigin(): string[] | boolean {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return true;
  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}
