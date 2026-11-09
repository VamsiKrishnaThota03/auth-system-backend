# Auth System Backend

A JWT authentication REST API built with Express, TypeScript, Prisma and MySQL.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)

## Overview

This is a small backend that handles user sign-up, login, fetching the current user and an admin-only user list. Passwords are hashed with bcrypt, request bodies are checked with Zod, and successful sign-up or login returns a signed JWT (HS256, 24 hours by default). Users are stored in MySQL through Prisma.

## Features

- **Sign-up** with strict Zod validation: name of 2-100 characters, a valid email (trimmed and lower-cased), and a password of 8-72 characters with at least one uppercase letter, one lowercase letter and one number. Unknown fields such as `role` are rejected, so new users are always `USER`.
- **Login** with email and password; returns a JWT (`id`, `email`, `role` claims). Unknown emails and wrong passwords get the same `401` response.
- **Protected route** (`GET /auth/me`) that checks the `Authorization: Bearer <token>` header
- **Role-based access:** `authorizeRole([...])` middleware, used by the admin-only `GET /users`
- **Rate limiting** on `/auth/signup` and `/auth/login` (20 requests per IP per 15 minutes by default)
- **Fail-fast config:** the server will not start without a `JWT_SECRET` of at least 16 characters; there is no built-in fallback secret
- **Centralized error handling** with consistent JSON errors:
  - `400` for validation errors and malformed JSON
  - `401` for missing, invalid or expired tokens and bad credentials; `403` for insufficient role
  - `404` for unknown routes or a missing user
  - `409` for a duplicate email (Prisma `P2002`)
  - `429` when the rate limit is hit
  - `500` for anything else
- **Password hashing** with bcrypt (salt rounds: 10)
- **Tests:** Jest + supertest API tests with a mocked Prisma client (no database needed)

## Tech stack

| Layer      | Technology                      |
|------------|---------------------------------|
| Runtime    | Node.js, TypeScript             |
| Framework  | Express 4, CORS, express-rate-limit |
| Database   | MySQL via Prisma ORM 5          |
| Auth       | jsonwebtoken, bcrypt            |
| Validation | Zod                             |
| Testing    | Jest, ts-jest, supertest        |

## Project structure

```
.
├── prisma/
│   ├── schema.prisma          # User model + Role enum
│   └── migrations/            # Initial migration
├── src/
│   ├── server.ts              # entry point: checks config, starts listening
│   ├── app.ts                 # createApp(): middleware, routes, error handling
│   ├── config/env.ts          # JWT_SECRET / CORS settings
│   ├── lib/prisma.ts          # shared Prisma client
│   ├── routes/                # /auth and /users routers
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic (hashing, JWT, Prisma)
│   ├── middlewares/           # JWT auth, role check, error handler
│   ├── types/                 # Shared TypeScript types
│   └── utils/validation.ts    # Zod schemas
├── tests/                     # supertest API tests
├── .env.example
├── package.json
└── tsconfig.json
```

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A running MySQL server

### Install

```bash
git clone https://github.com/VamsiKrishnaThota03/auth-system-backend.git
cd auth-system-backend
npm install
```

### Environment variables

Copy `.env.example` to `.env`:

| Variable          | Required | Description                                  | Example |
|-------------------|----------|----------------------------------------------|---------|
| `DATABASE_URL`    | Yes | MySQL connection string used by Prisma       | `mysql://<user>:<password>@localhost:3306/<db>` |
| `JWT_SECRET`      | Yes | Secret used to sign and verify JWTs, at least 16 characters | `openssl rand -hex 32` |
| `PORT`            | No  | HTTP port (default `3000`)                   | `3000` |
| `JWT_EXPIRES_IN`  | No  | Token lifetime (default `24h`)               | `2h` |
| `CORS_ORIGIN`     | No  | Comma-separated allowed origins; unset allows any origin | `https://app.example.com` |
| `AUTH_RATE_LIMIT` | No  | Login/sign-up requests per IP per 15 minutes (default `20`) | `20` |

### Database

```bash
npx prisma migrate dev      # development
npm run migrate             # production: prisma migrate deploy
```

To make someone an admin, update their row (for example `UPDATE User SET role = 'ADMIN' WHERE email = '...';`) and have them log in again so the token carries the new role.

### Run

```bash
# Development (auto-reload)
npm run dev

# Production build
npm run build
npm start

# Tests and type checking
npm test
npm run typecheck
```

## API

All responses are JSON in the form `{ "status": "success" | "error", ... }`.

| Method | Path           | Auth          | Purpose                                                       |
|--------|----------------|---------------|---------------------------------------------------------------|
| POST   | `/auth/signup` | None          | Create a user. Body: `{ name, email, password }`. Returns `{ user, token }` |
| POST   | `/auth/login`  | None          | Log in. Body: `{ email, password }`. Returns `{ user, token }` |
| GET    | `/auth/me`     | Bearer token  | Return the user who owns the token                            |
| GET    | `/users`       | Bearer token, `ADMIN` role | List all users (newest first)                    |
| GET    | `/health`      | None          | Health check                                                  |

Example:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Passw0rd"}'

curl http://localhost:3000/auth/me -H "Authorization: Bearer <token>"
```

## Known limitations

- Tokens are stateless: there is no logout, refresh token or revocation list, and a role change only takes effect on the next login.
- The rate limiter keeps counts in memory, so limits are per process and reset on restart.
- The tests mock Prisma; the MySQL migration itself is not exercised in CI.
