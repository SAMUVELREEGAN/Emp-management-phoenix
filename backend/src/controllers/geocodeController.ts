import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { resolveLocationAddress } from '../utils/geocoding';

export const reverseGeocode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw ApiError.badRequest('Valid latitude and longitude are required');
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw ApiError.badRequest('Latitude or longitude is out of range');
  }

  const location = await resolveLocationAddress({
    latitude,
    longitude,
    accuracy: Number.isFinite(Number(req.query.accuracy))
      ? Number(req.query.accuracy)
      : undefined,
  });

  return sendSuccess(res, 'Address resolved successfully', { location });
});
