import { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T = {} as T,
  statusCode = 200,
): Response => {
  const body: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(body);
};
