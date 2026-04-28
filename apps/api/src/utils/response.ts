import { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function ApiSuccess<T = unknown>(
  res: Response,
  data: T,
  status = 200
): Response {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  return res.status(status).json(body);
}

export function ApiError(
  res: Response,
  code: string,
  message: string,
  status = 400
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  return res.status(status).json(body);
}
