export type Role = 'USER' | 'ADMIN';

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/** Claims stored in the JWT */
export interface TokenPayload {
  id: number;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
