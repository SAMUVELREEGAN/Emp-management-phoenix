import { Document, Types } from 'mongoose';
import { EmployeeOnboarding } from '../models/EmployeeOnboarding';
import { Attendance } from '../models/Attendance';
import { LeaveRequest } from '../models/LeaveRequest';
import { User } from '../models/User';
import { PayrollRun } from '../models/PayrollRun';
import { Payslip, IPayslip } from '../models/Payslip';
import { EmployeeCompensation } from '../models/EmployeeCompensation';
import { ApiError } from '../utils/ApiError';
import { endOfDay, isWeeklyHoliday, parseDateOnly, startOfDay } from '../utils/dateHelpers';
import { getPayrollPolicy } from './payrollPolicyService';
import { createNotification } from './notificationService';
import { findActiveAdmins } from '../utils/roleHelpers';

const userPopulateFields = 'fullName employeeId department designation';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function getMonthPeriod(month: number, year: number) {
  const periodStart = startOfDay(new Date(year, month - 1, 1));
  const periodEnd = endOfDay(new Date(year, month, 0));
  return { periodStart, periodEnd };
}

function countWorkingDaysInPeriod(
  periodStart: Date,
  periodEnd: Date,
  weeklyOffDays: number[],
): number {
  let count = 0;
  const cursor = new Date(periodStart);
  while (cursor <= periodEnd) {
    const day = cursor.getDay();
    if (!weeklyOffDays.includes(day) && !isWeeklyHoliday(cursor)) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

async function getActiveCompensation(employeeId: string, date: Date) {
  return EmployeeCompensation.findOne({
    employee: employeeId,
    isActive: true,
    effectiveFrom: { $lte: endOfDay(date) },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: startOfDay(date) } }],
  }).sort({ effectiveFrom: -1 });
}

export async function setEmployeeCompensation(
  employeeId: string,
  setBy: string,
  monthlySalary: number,
  notes = '',
) {
  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== 'employee') {
    throw ApiError.notFound('Employee not found');
  }

  await EmployeeCompensation.updateMany(
    { employee: employeeId, isActive: true },
    { $set: { isActive: false, effectiveTo: new Date() } },
  );

  const compensation = await EmployeeCompensation.create({
    employee: employeeId,
    monthlySalary,
    effectiveFrom: startOfDay(new Date()),
    setBy,
    notes,
    isActive: true,
  });

  return compensation;
}

export async function getEmployeeCompensation(employeeId: string) {
  const current = await getActiveCompensation(employeeId, new Date());
  const history = await EmployeeCompensation.find({ employee: employeeId })
    .sort({ effectiveFrom: -1 })
    .limit(20)
    .populate('setBy', 'fullName');
  return { current, history };
}

export async function calculatePayslipForEmployee(
  employeeId: string,
  month: number,
  year: number,
): Promise<Omit<IPayslip, keyof Document>> {
  const policy = await getPayrollPolicy();
  const { periodStart, periodEnd } = getMonthPeriod(month, year);
  const compensation = await getActiveCompensation(employeeId, periodEnd);

  if (!compensation) {
    throw ApiError.badRequest('Employee has no active salary configured');
  }

  const monthlySalary = compensation.monthlySalary;
  const totalWorkingDays = countWorkingDaysInPeriod(
    periodStart,
    periodEnd,
    policy.weeklyOffDays,
  );

  const [attendanceRecords, leaveRecords] = await Promise.all([
    Attendance.find({
      employee: employeeId,
      date: { $gte: periodStart, $lte: periodEnd },
    }),
    LeaveRequest.find({
      employee: employeeId,
      status: 'approved',
      fromDate: { $lte: periodEnd },
      toDate: { $gte: periodStart },
    }),
  ]);

  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let halfDays = 0;
  let totalLateMinutes = 0;
  let overtimeMinutes = 0;

  attendanceRecords.forEach(record => {
    if (record.attendanceStatus === 'present') {
      presentDays += 1;
    } else if (record.attendanceStatus === 'late') {
      presentDays += 1;
      lateDays += 1;
      totalLateMinutes += record.lateMinutes || 0;
    } else if (record.attendanceStatus === 'half_day') {
      halfDays += 1;
      presentDays += 0.5;
    } else if (record.attendanceStatus === 'absent') {
      absentDays += 1;
    }
    overtimeMinutes += record.overtimeMinutes || 0;
  });

  let leaveDays = 0;
  leaveRecords.forEach(leave => {
    leaveDays += leave.totalDays || (leave.leaveType === 'half_day' ? policy.halfDayLeaveFactor : 1);
  });

  const holidays = 0;
  const payableDays = Math.max(
    0,
    presentDays + halfDays * policy.halfDayLeaveFactor - Math.max(0, leaveDays - presentDays * 0),
  );

  const perDayRate = totalWorkingDays > 0 ? monthlySalary / totalWorkingDays : 0;
  const proRataFactor = policy.proRataJoiningExit
    ? Math.min(1, payableDays / totalWorkingDays)
    : 1;
  const baseGross = roundMoney(monthlySalary * proRataFactor);

  const earnings = [{ code: 'BASIC', label: 'Basic Salary', amount: baseGross, source: 'salary' }];
  const deductions: IPayslip['deductions'] = [];

  if (policy.leaveDeductionEnabled && leaveDays > 0) {
    const leaveDeduction = roundMoney(leaveDays * perDayRate);
    if (leaveDeduction > 0) {
      deductions.push({
        code: 'LEAVE',
        label: 'Leave Deduction',
        amount: leaveDeduction,
        source: 'leave',
      });
    }
  }

  if (absentDays > 0) {
    const absentDeduction = roundMoney(absentDays * perDayRate);
    deductions.push({
      code: 'ABSENT',
      label: 'Absent Deduction',
      amount: absentDeduction,
      source: 'attendance',
    });
  }

  if (lateDays > 0 && policy.lateDeductionPerDay > 0) {
    deductions.push({
      code: 'LATE_DAY',
      label: 'Late Arrival Deduction',
      amount: roundMoney(lateDays * policy.lateDeductionPerDay),
      source: 'late',
    });
  }

  if (totalLateMinutes > 0 && policy.lateDeductionPerMinute > 0) {
    deductions.push({
      code: 'LATE_MIN',
      label: 'Late Minutes Deduction',
      amount: roundMoney(totalLateMinutes * policy.lateDeductionPerMinute),
      source: 'late',
    });
  }

  let overtimePay = 0;
  if (policy.overtimeEnabled && overtimeMinutes > 0) {
    const hourlyRate = monthlySalary / (totalWorkingDays * policy.overtimeHourlyDivisor);
    overtimePay = roundMoney((overtimeMinutes / 60) * hourlyRate * policy.overtimeMultiplier);
    earnings.push({
      code: 'OT',
      label: 'Overtime Pay',
      amount: overtimePay,
      source: 'overtime',
    });
  }

  const grossPay = roundMoney(earnings.reduce((sum, item) => sum + item.amount, 0));
  const totalDeductions = roundMoney(deductions.reduce((sum, item) => sum + item.amount, 0));
  const netPay = roundMoney(Math.max(0, grossPay - totalDeductions));

  return {
    employee: new Types.ObjectId(employeeId),
    periodStart,
    periodEnd,
    month,
    year,
    workingDays: {
      totalWorkingDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      holidays,
      payableDays: roundMoney(payableDays),
    },
    attendanceSummary: {
      lateDays,
      totalLateMinutes,
      overtimeMinutes,
    },
    earnings,
    deductions,
    grossPay,
    totalDeductions,
    netPay,
    status: 'draft',
  } as Omit<IPayslip, keyof Document>;
}

export async function createPayrollRun(actorId: string, month: number, year: number) {
  const existing = await PayrollRun.findOne({ month, year });
  if (existing) {
    throw ApiError.conflict('Payroll run already exists for this month');
  }

  const { periodStart, periodEnd } = getMonthPeriod(month, year);
  const run = await PayrollRun.create({
    month,
    year,
    periodStart,
    periodEnd,
    status: 'draft',
    generatedBy: actorId,
  });

  return run;
}

export async function generatePayrollRun(runId: string) {
  const run = await PayrollRun.findById(runId);
  if (!run) {
    throw ApiError.notFound('Payroll run not found');
  }
  if (run.status === 'finalized') {
    throw ApiError.badRequest('Cannot regenerate a finalized payroll run');
  }

  await Payslip.deleteMany({ payrollRun: run._id });

  const employees = await User.find({ role: 'employee', status: 'active' });
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let employeeCount = 0;

  for (const employee of employees) {
    try {
      const calculated = await calculatePayslipForEmployee(
        employee._id.toString(),
        run.month,
        run.year,
      );
      const payslip = await Payslip.create({
        ...calculated,
        payrollRun: run._id,
        employee: employee._id,
      });
      totalGross += payslip.grossPay;
      totalDeductions += payslip.totalDeductions;
      totalNet += payslip.netPay;
      employeeCount += 1;
    } catch {
      // Skip employees without salary configured
    }
  }

  run.employeeCount = employeeCount;
  run.totalGross = roundMoney(totalGross);
  run.totalDeductions = roundMoney(totalDeductions);
  run.totalNet = roundMoney(totalNet);
  await run.save();

  return { run, employeeCount };
}

export async function finalizePayrollRun(runId: string, actorId: string) {
  const run = await PayrollRun.findById(runId);
  if (!run) {
    throw ApiError.notFound('Payroll run not found');
  }
  if (run.status === 'finalized') {
    throw ApiError.badRequest('Payroll run is already finalized');
  }

  const payslips = await Payslip.find({ payrollRun: run._id });
  if (!payslips.length) {
    throw ApiError.badRequest('Generate payslips before finalizing');
  }

  await Payslip.updateMany(
    { payrollRun: run._id },
    { $set: { status: 'published', publishedAt: new Date() } },
  );

  run.status = 'finalized';
  run.finalizedAt = new Date();
  await run.save();

  await Promise.all(
    payslips.map(payslip =>
      createNotification({
        recipient: payslip.employee,
        title: 'Payslip published',
        message: `Your payslip for ${run.month}/${run.year} is now available.`,
        type: 'payroll',
        relatedId: payslip._id as Types.ObjectId,
      }),
    ),
  );

  const admins = await findActiveAdmins();
  await Promise.all(
    admins.map(admin =>
      createNotification({
        recipient: admin._id,
        title: 'Payroll finalized',
        message: `Payroll for ${run.month}/${run.year} has been finalized.`,
        type: 'payroll',
        relatedId: run._id as Types.ObjectId,
      }),
    ),
  );

  return run;
}

export async function listPayrollRuns(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    PayrollRun.find().sort({ year: -1, month: -1 }).skip(skip).limit(limit),
    PayrollRun.countDocuments(),
  ]);
  return { items, total, page, limit };
}

export async function getPayrollRun(runId: string) {
  const run = await PayrollRun.findById(runId).populate('generatedBy', 'fullName');
  if (!run) {
    throw ApiError.notFound('Payroll run not found');
  }
  const payslips = await Payslip.find({ payrollRun: run._id })
    .populate('employee', userPopulateFields)
    .sort({ 'employee.fullName': 1 });
  return { run, payslips };
}

export async function listMyPayslips(employeeId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Payslip.find({ employee: employeeId, status: 'published' })
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit),
    Payslip.countDocuments({ employee: employeeId, status: 'published' }),
  ]);
  return { items, total, page, limit };
}

export async function getPayslip(payslipId: string, viewerId: string, viewerRole: string) {
  const payslip = await Payslip.findById(payslipId)
    .populate('employee', userPopulateFields)
    .populate('payrollRun');
  if (!payslip) {
    throw ApiError.notFound('Payslip not found');
  }

  if (viewerRole === 'employee') {
    const employeeRef = payslip.employee as Types.ObjectId | { _id: Types.ObjectId };
    const employeeId =
      typeof employeeRef === 'object' && employeeRef !== null && '_id' in employeeRef
        ? employeeRef._id.toString()
        : String(employeeRef);
    if (employeeId !== viewerId) {
      throw ApiError.forbidden('You can only view your own payslips');
    }
    if (payslip.status !== 'published') {
      throw ApiError.forbidden('Payslip is not published yet');
    }
  }

  return payslip;
}

export function buildPayslipText(payslip: IPayslip & { employee?: { fullName?: string; employeeId?: string; department?: string } }): string {
  const employeeName =
    typeof payslip.employee === 'object' && payslip.employee
      ? payslip.employee.fullName
      : 'Employee';
  const lines = [
    'PAYSLIP',
    '======',
    `Employee: ${employeeName}`,
    `Period: ${payslip.month}/${payslip.year}`,
    '',
    'Working Days',
    `- Total: ${payslip.workingDays.totalWorkingDays}`,
    `- Present: ${payslip.workingDays.presentDays}`,
    `- Absent: ${payslip.workingDays.absentDays}`,
    `- Leave: ${payslip.workingDays.leaveDays}`,
    `- Payable: ${payslip.workingDays.payableDays}`,
    '',
    'Attendance',
    `- Late days: ${payslip.attendanceSummary.lateDays}`,
    `- Late minutes: ${payslip.attendanceSummary.totalLateMinutes}`,
    `- Overtime minutes: ${payslip.attendanceSummary.overtimeMinutes}`,
    '',
    'Earnings',
    ...payslip.earnings.map(item => `- ${item.label}: INR ${item.amount.toFixed(2)}`),
    '',
    'Deductions',
    ...payslip.deductions.map(item => `- ${item.label}: INR ${item.amount.toFixed(2)}`),
    '',
    `Gross Pay: INR ${payslip.grossPay.toFixed(2)}`,
    `Total Deductions: INR ${payslip.totalDeductions.toFixed(2)}`,
    `Net Pay: INR ${payslip.netPay.toFixed(2)}`,
  ];
  return lines.join('\n');
}

export async function getPayrollSummary() {
  const [activeEmployees, withSalary, latestRun, pendingOnboarding] = await Promise.all([
    User.countDocuments({ role: 'employee', status: 'active' }),
    EmployeeCompensation.distinct('employee', { isActive: true }),
    PayrollRun.findOne().sort({ year: -1, month: -1 }),
    EmployeeOnboarding.countDocuments({ status: { $in: ['submitted', 'hr_review'] } }),
  ]);

  return {
    activeEmployees,
    employeesWithSalary: withSalary.length,
    latestPayrollRun: latestRun,
    pendingOnboardingReviews: pendingOnboarding,
  };
}
