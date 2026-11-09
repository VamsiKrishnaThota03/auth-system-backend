# Auth System Backend

A JWT authentication REST API built with Express, TypeScript, Prisma and MySQL.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)

## Overview

This is a small backend that handles user sign-up, login and fetching the current user. Passwords are hashed with bcrypt, request bodies are checked with Zod, and successful sign-up or login returns a signed JWT that is valid for 24 hours. Users are stored in MySQL through Prisma.

## Features

- **Sign-up** with Zod validation: name of at least 2 characters, a valid email, and a password of at least 8 characters with at least one uppercase letter, one lowercase letter and one number
- **Login** with email and password; returns a JWT (`id`, `email`, `role` claims, 24h expiry)
- **Protected route** (`GET /auth/me`) that checks the `Authorization: Bearer <token>` header
- **Roles**: a `Role` enum (`USER`, `ADMIN`) on the user model, plus an `authorizeRole([...])` middleware you can attach to routes (no route uses it yet)
- **Centralized error handling** with consistent JSON errors:
  - `400` for Zod validation errors
  - `401` / `403` for authentication problems
  - `404` when the user is not found
  - `409` for a duplicate email (Prisma `P2002`)
  - `500` for anything else
- **Password hashing** with bcrypt (salt rounds: 10)

## Tech stack

| Layer      | Technology                      |
|------------|---------------------------------|
| Runtime    | Node.js, TypeScript             |
| Framework  | Express 4, CORS                 |
| Database   | MySQL via Prisma ORM 5          |
| Auth       | jsonwebtoken, bcrypt            |
| Validation | Zod                             |

## Project structure

```
.
├── prisma/
│   ├── schema.prisma          # User model + Role enum
│   └── migrations/            # Initial migration
├── src/
│   ├── app.ts                 # Express app entry point
│   ├── routes/                # /auth router
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic (hashing, JWT, Prisma)
│   ├── middlewares/           # JWT auth, role check, error handler
│   ├── types/                 # Shared TypeScript types
│   └── utils/validation.ts    # Zod schemas
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

Create a `.env` file in the project root:

| Variable       | Description                                  | Example                                            |
|----------------|----------------------------------------------|----------------------------------------------------|
| `DATABASE_URL` | MySQL connection string used by Prisma       | `mysql://<user>:<password>@localhost:3306/<db>`    |
| `JWT_SECRET`   | Secret used to sign and verify JWTs          | `<a-long-random-string>`                           |
| `PORT`         | HTTP port (defaults to `3000`)               | `3000`                                             |

> If `JWT_SECRET` is not set, the code falls back to a hard-coded default. Always set it outside of local testing.

### Database

```bash
npx prisma migrate dev
```

### Run

```bash
# Development (auto-reload)
npm run dev

# Production build
npm run build
npm start
```

## API

All responses are JSON in the form `{ "status": "success" | "error", ... }`.

| Method | Path           | Auth          | Purpose                                                       |
|--------|----------------|---------------|---------------------------------------------------------------|
| POST   | `/auth/signup` | None          | Create a user. Body: `{ name, email, password }`. Returns `{ user, token }` |
| POST   | `/auth/login`  | None          | Log in. Body: `{ email, password }`. Returns `{ user, token }` |
| GET    | `/auth/me`     | Bearer token  | Return the user who owns the token                            |

Example:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Passw0rd"}'

curl http://localhost:3000/auth/me -H "Authorization: Bearer <token>"
```
