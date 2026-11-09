import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email format')
  .max(191, 'Email is too long');

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    email,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      // bcrypt only uses the first 72 bytes
      .max(72, 'Password must be at most 72 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  })
  .strict(); // reject unknown fields such as "role"

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72, 'Password must be at most 72 characters'),
});
