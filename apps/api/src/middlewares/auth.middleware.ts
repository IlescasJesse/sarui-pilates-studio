import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { ApiError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiError(res, 'UNAUTHORIZED', 'No token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    ApiError(res, 'UNAUTHORIZED', 'Invalid authorization header format', 401);
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    ApiError(res, 'TOKEN_INVALID', 'Token is invalid or expired', 401);
  }
}
