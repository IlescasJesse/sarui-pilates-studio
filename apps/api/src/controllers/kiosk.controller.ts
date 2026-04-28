import { Request, Response, NextFunction } from 'express';
import { checkIn } from '../services/kiosk.service';
import { checkInSchema } from '../validators/kiosk.validator';
import { ApiSuccess } from '../utils/response';

export async function checkin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = checkInSchema.parse(req.body);
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      'unknown';

    const result = await checkIn(input, ip);
    ApiSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
