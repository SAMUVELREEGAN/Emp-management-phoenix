import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { getParam } from '../utils/helpers';
import * as onboardingService from '../services/onboardingService';
import { employeeNeedsOnboarding } from '../services/onboardingService';

export const getMyOnboarding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await onboardingService.getMyOnboarding(req.user!._id.toString());
  return sendSuccess(res, 'Onboarding fetched', data);
});

export const updateMyDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const onboarding = await onboardingService.updateMyOnboardingDetails(
    req.user!._id.toString(),
    req.body,
  );
  return sendSuccess(res, 'Onboarding details updated', { onboarding });
});

export const uploadDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('Document file is required');
  }
  const document = await onboardingService.addOnboardingDocument(req.user!._id.toString(), {
    category: req.body.category,
    title: req.body.title || req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
  });
  return sendSuccess(res, 'Document uploaded', { document }, 201);
});

export const submitOnboarding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const onboarding = await onboardingService.submitOnboarding(req.user!._id.toString());
  return sendSuccess(res, 'Onboarding submitted for HR review', { onboarding });
});

export const listForReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await onboardingService.listOnboardingForReview(
    Number(req.query.page) || 1,
    Number(req.query.limit) || 50,
    req.query.status as string | undefined,
  );
  return sendSuccess(res, 'Onboarding list fetched', result);
});

export const getByEmployee = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await onboardingService.getOnboardingByEmployeeId(getParam(req.params.employeeId));
  return sendSuccess(res, 'Onboarding fetched', data);
});

export const reviewOnboarding = asyncHandler(async (req: AuthRequest, res: Response) => {
  const onboarding = await onboardingService.reviewOnboarding(
    req.user!._id.toString(),
    getParam(req.params.employeeId),
    req.body,
  );
  return sendSuccess(res, 'Onboarding reviewed', { onboarding });
});

export const updateSalary = asyncHandler(async (req: AuthRequest, res: Response) => {
  const onboarding = await onboardingService.updateOnboardingSalary(
    req.user!._id.toString(),
    getParam(req.params.employeeId),
    Number(req.body.monthlySalary),
    req.body.notes,
  );
  return sendSuccess(res, 'Salary updated', { onboarding });
});

export const shareWithAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const roster = await onboardingService.shareSalaryRosterWithAdmin(req.user!._id.toString());
  return sendSuccess(res, 'Salary roster shared with admin', { roster });
});

export const getSalaryRoster = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const roster = await onboardingService.getAdminSalaryRoster();
  return sendSuccess(res, 'Salary roster fetched', { roster });
});

export const getOnboardingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const needsOnboarding = await employeeNeedsOnboarding(req.user!._id.toString());
  const data = needsOnboarding
    ? await onboardingService.getMyOnboarding(req.user!._id.toString())
    : { onboarding: null, documents: [] };
  return sendSuccess(res, 'Onboarding status fetched', { needsOnboarding, ...data });
});
