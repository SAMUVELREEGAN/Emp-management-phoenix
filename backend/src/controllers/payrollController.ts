import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { getParam } from '../utils/helpers';
import * as payrollService from '../services/payrollService';
import { getPayrollPolicy, updatePayrollPolicy } from '../services/payrollPolicyService';

export const getPolicy = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const policy = await getPayrollPolicy();
  return sendSuccess(res, 'Payroll policy fetched', { policy });
});

export const updatePolicy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const policy = await updatePayrollPolicy(req.body);
  return sendSuccess(res, 'Payroll policy updated', { policy });
});

export const getSummary = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const summary = await payrollService.getPayrollSummary();
  return sendSuccess(res, 'Payroll summary fetched', { summary });
});

export const getCompensation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await payrollService.getEmployeeCompensation(getParam(req.params.employeeId));
  return sendSuccess(res, 'Compensation fetched', data);
});

export const setCompensation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const compensation = await payrollService.setEmployeeCompensation(
    getParam(req.params.employeeId),
    req.user!._id.toString(),
    req.body.monthlySalary,
    req.body.notes,
  );
  return sendSuccess(res, 'Compensation updated', { compensation });
});

export const createRun = asyncHandler(async (req: AuthRequest, res: Response) => {
  const run = await payrollService.createPayrollRun(
    req.user!._id.toString(),
    Number(req.body.month),
    Number(req.body.year),
  );
  return sendSuccess(res, 'Payroll run created', { run }, 201);
});

export const listRuns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await payrollService.listPayrollRuns(
    Number(req.query.page) || 1,
    Number(req.query.limit) || 20,
  );
  return sendSuccess(res, 'Payroll runs fetched', result);
});

export const getRun = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await payrollService.getPayrollRun(getParam(req.params.id));
  return sendSuccess(res, 'Payroll run fetched', result);
});

export const generateRun = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await payrollService.generatePayrollRun(getParam(req.params.id));
  return sendSuccess(res, 'Payslips generated', result);
});

export const finalizeRun = asyncHandler(async (req: AuthRequest, res: Response) => {
  const run = await payrollService.finalizePayrollRun(
    getParam(req.params.id),
    req.user!._id.toString(),
  );
  return sendSuccess(res, 'Payroll run finalized', { run });
});

export const listMyPayslips = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await payrollService.listMyPayslips(
    req.user!._id.toString(),
    Number(req.query.page) || 1,
    Number(req.query.limit) || 20,
  );
  return sendSuccess(res, 'Payslips fetched', result);
});

export const getPayslip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payslip = await payrollService.getPayslip(
    getParam(req.params.id),
    req.user!._id.toString(),
    req.user!.role,
  );
  return sendSuccess(res, 'Payslip fetched', { payslip });
});

export const downloadPayslip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payslip = await payrollService.getPayslip(
    getParam(req.params.id),
    req.user!._id.toString(),
    req.user!.role,
  );
  const text = payrollService.buildPayslipText(payslip);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="payslip-${payslip.month}-${payslip.year}.txt"`,
  );
  return res.send(text);
});
