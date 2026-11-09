import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getJwtSecret, JWT_EXPIRES_IN } from '../config/env';
import { SignupInput, LoginInput, UserResponse, AuthResponse, TokenPayload } from '../types/auth.types';
import { AppError } from '../middlewares/error.middleware';

const SALT_ROUNDS = 10;
// Compared against when the email is unknown, so login timing doesn't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', SALT_ROUNDS);

export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class AuthService {
  static generateToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    return jwt.sign(payload, getJwtSecret(), {
      algorithm: 'HS256',
      expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }

  static async signup(input: SignupInput): Promise<AuthResponse> {
    const password = await bcrypt.hash(input.password, SALT_ROUNDS);
    // Only whitelisted fields are passed; role always defaults to USER
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password },
    });
    return { user: toUserResponse(user), token: this.generateToken(user) };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const valid = await bcrypt.compare(input.password, user?.password ?? DUMMY_HASH);
    if (!user || !valid) {
      throw new AppError(401, 'Invalid email or password');
    }
    return { user: toUserResponse(user), token: this.generateToken(user) };
  }

  static async getCurrentUser(userId: number): Promise<UserResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return toUserResponse(user);
  }

  static async listUsers(): Promise<UserResponse[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(toUserResponse);
  }
}
