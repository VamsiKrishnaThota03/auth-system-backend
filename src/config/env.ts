import dotenv from 'dotenv';

dotenv.config();

/** JWT signing secret. There is deliberately no fallback value. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set to a random string of at least 16 characters (see .env.example).');
  }
  return secret;
}

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/** CORS_ORIGIN: comma-separated allowlist. Unset means any origin (fine for a bearer-token API). */
export function corsOrigin(): string[] | boolean {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return true;
  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}
