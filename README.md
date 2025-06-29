# Authentication System Backend

A secure authentication system built with Node.js, Express, TypeScript, and MySQL.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MySQL (with Prisma ORM)
- JWT for authentication
- bcrypt for password hashing
- Zod for validation

## Features

- User signup with input validation
- Secure login with JWT
- Protected routes with JWT authentication
- Role-based authorization
- Centralized error handling
- Input validation using Zod
- Password hashing using bcrypt
- MySQL database with Prisma ORM

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="mysql://user:password@localhost:3306/auth_db"
   JWT_SECRET="your-super-secret-key-here"
   PORT=3000
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Build the TypeScript code:
   ```bash
   npm run build
   ```

6. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Public Routes

- `POST /auth/signup`
  - Body: `{ name: string, email: string, password: string }`
  - Creates a new user account

- `POST /auth/login`
  - Body: `{ email: string, password: string }`
  - Returns JWT token on successful login

### Protected Routes

- `GET /auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns current user information

## Error Handling

The API uses a centralized error handling system with consistent error responses:

- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409)
- Internal server errors (500)

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Input validation and sanitization
- Role-based access control
- Secure password requirements
- Protection against common vulnerabilities 