import { PrismaClient } from '@prisma/client';

/** Single shared Prisma client. Tests replace this module with a mock. */
export const prisma = new PrismaClient();
