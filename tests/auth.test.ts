import request from 'supertest';
import jwt from 'jsonwebtoken';

// In-memory stand-in for the Prisma user table
type Row = { id: number; name: string; email: string; password: string; role: 'USER' | 'ADMIN'; createdAt: Date; updatedAt: Date };
const users: Row[] = [];

jest.mock('../src/lib/prisma', () => {
  const { Prisma } = jest.requireActual('@prisma/client');
  return {
    prisma: {
      user: {
        create: jest.fn(async ({ data }: { data: Omit<Row, 'id' | 'role' | 'createdAt' | 'updatedAt'> & { role?: Row['role'] } }) => {
          if (users.some((u) => u.email === data.email)) {
            throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });
          }
          const now = new Date();
          const row: Row = { id: users.length + 1, role: 'USER', createdAt: now, updatedAt: now, ...data };
          users.push(row);
          return row;
        }),
        findUnique: jest.fn(async ({ where }: { where: { id?: number; email?: string } }) =>
          users.find((u) => (where.id !== undefined ? u.id === where.id : u.email === where.email)) ?? null
        ),
        findMany: jest.fn(async () => [...users]),
      },
    },
  };
});

process.env.JWT_SECRET = 'test-secret-that-is-long-enough';
process.env.AUTH_RATE_LIMIT = '1000';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('../src/app');
const app = createApp();

const jane = { name: 'Jane Doe', email: 'Jane@Example.com', password: 'Passw0rd!' };

describe('auth API', () => {
  let token: string;

  it('GET /health', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' });
  });

  it('signs up, hashes the password and normalises the email', async () => {
    const res = await request(app).post('/auth/signup').send(jane).expect(201);
    expect(res.body.data.user.email).toBe('jane@example.com');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(users[0].password).not.toBe(jane.password);
    expect(users[0].password.startsWith('$2')).toBe(true);
    token = res.body.data.token;
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/auth/signup').send(jane).expect(409);
  });

  it('rejects weak passwords and unknown fields such as role', async () => {
    await request(app).post('/auth/signup').send({ ...jane, email: 'a@b.co', password: 'weak' }).expect(400);
    const res = await request(app).post('/auth/signup').send({ ...jane, email: 'x@y.co', role: 'ADMIN' }).expect(400);
    expect(res.body.message).toBe('Validation error');
  });

  it('logs in with the right password only', async () => {
    await request(app).post('/auth/login').send({ email: 'jane@example.com', password: 'wrong' }).expect(401);
    await request(app).post('/auth/login').send({ email: 'nobody@example.com', password: 'Passw0rd!' }).expect(401);
    const res = await request(app).post('/auth/login').send({ email: 'JANE@example.com', password: jane.password }).expect(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it('GET /auth/me requires a valid token', async () => {
    await request(app).get('/auth/me').expect(401);
    await request(app).get('/auth/me').set('Authorization', 'Bearer not-a-jwt').expect(401);
    const forged = jwt.sign({ id: 1, email: 'jane@example.com', role: 'ADMIN' }, 'some-other-secret');
    await request(app).get('/auth/me').set('Authorization', `Bearer ${forged}`).expect(401);
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.data.user.name).toBe('Jane Doe');
  });

  it('GET /users is admin-only', async () => {
    await request(app).get('/users').set('Authorization', `Bearer ${token}`).expect(403);
    users[0].role = 'ADMIN';
    const admin = jwt.sign({ id: 1, email: 'jane@example.com', role: 'ADMIN' }, process.env.JWT_SECRET as string);
    const res = await request(app).get('/users').set('Authorization', `Bearer ${admin}`).expect(200);
    expect(res.body.data.users).toHaveLength(1);
  });

  it('returns 400 for malformed JSON and 404 for unknown routes', async () => {
    await request(app).post('/auth/login').set('Content-Type', 'application/json').send('{"email":').expect(400);
    await request(app).get('/nope').expect(404);
  });
});

describe('config', () => {
  it('refuses to sign tokens without a strong JWT_SECRET', () => {
    const { getJwtSecret } = jest.requireActual('../src/config/env');
    const saved = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'short';
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = saved;
  });
});
