import { Request, Response, NextFunction } from 'express';
import {
  loginService,
  refreshTokenService,
  logoutService,
} from '../services/auth.service';
import { loginSchema } from '../validators/auth.validator';
import { ApiSuccess } from '../utils/response';

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginService(input);

    ApiSuccess(
      res,
      {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        user: result.user,
      },
      200
    );
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
        },
      });
      return;
    }

    const result = await refreshTokenService(refreshToken);
    ApiSuccess(res, { accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
        },
      });
      return;
    }

    await logoutService(refreshToken);
    ApiSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
