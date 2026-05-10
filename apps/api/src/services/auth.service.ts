import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { comparePassword } from '../utils/bcrypt';
import { signToken, TokenPayload } from '../utils/jwt';
import { LoginInput } from '../validators/auth.validator';
import { createError } from '../middlewares/error.middleware';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  tokens: AuthTokens;
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

export async function loginService(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      instructor: {
        select: { firstName: true, lastName: true },
      },
      client: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  if (!user) {
    throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw createError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
  }

  const isValid = await comparePassword(input.password, user.password);
  if (!isValid) {
    throw createError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signToken(payload);
  const refreshToken = uuidv4();

  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    tokens: { accessToken, refreshToken },
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.instructor?.firstName ?? user.client?.firstName,
      lastName: user.instructor?.lastName ?? user.client?.lastName,
    },
  };
}

export async function refreshTokenService(
  refreshToken: string
): Promise<{ accessToken: string }> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw createError('Refresh token not found', 401, 'TOKEN_NOT_FOUND');
  }

  if (storedToken.isRevoked) {
    throw createError('Refresh token has been revoked', 401, 'TOKEN_REVOKED');
  }

  if (storedToken.expiresAt < new Date()) {
    throw createError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
  }

  const { user } = storedToken;

  if (!user.isActive) {
    throw createError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
  }

  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signToken(payload);
  return { accessToken };
}

export async function logoutService(refreshToken: string): Promise<void> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    return;
  }

  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: { isRevoked: true },
  });
}
