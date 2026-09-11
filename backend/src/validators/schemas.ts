import { z } from 'zod';
import { isValidLoginIdentifier } from '../utils/phoneHelpers';

const nonEmpty = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => v.length > 0, `${label} cannot be empty`);

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Email or mobile number is required')
    .refine(isValidLoginIdentifier, 'Enter a valid email or mobile number'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyCodeSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or mobile number is required'),
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

export const resendVerificationSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or mobile number is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'New password must contain letters and numbers',
    ),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      'New password must contain letters and numbers',
    ),
});

export const updateProfileSchema = z.object({
  fullName: nonEmpty('Full name').optional(),
});

export const createEmployeeSchema = z.object({
  employeeId: nonEmpty('Employee ID'),
  fullName: nonEmpty('Full name'),
  email: z.string().trim().email('Valid email is required'),
  phone: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: nonEmpty('Department'),
  designation: nonEmpty('Designation'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  address: z.string().trim().optional().default(''),
  role: z.enum(['employee', 'hr']).default('employee'),
  status: z.enum(['active', 'inactive']).default('inactive'),
  isFieldEmployee: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform(value => value === true || value === 'true')
    .default(false),
  monthlySalary: z.coerce.number().min(0).optional().default(0),
  enableOnboarding: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform(value => value === true || value === 'true')
    .default(true),
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ password: true })
  .partial()
  .extend({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional(),
  });

export const statusSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  accuracy: z.number().positive().optional(),
  locationTimestamp: z.string().optional(),
  isMocked: z.boolean().optional(),
});

export const checkInSchema = z.object({
  location: locationSchema,
  deviceTimestamp: z.string().optional(),
  deviceTimezoneOffset: z.number().optional(),
  workFromHome: z.coerce.boolean().optional().default(false),
});

export const checkOutSchema = z.object({
  location: locationSchema,
  deviceTimestamp: z.string().optional(),
  deviceTimezoneOffset: z.number().optional(),
  earlyCheckoutRemark: z.string().trim().optional().default(''),
});

export const breakActionSchema = z.object({
  deviceTimestamp: z.string().optional(),
});

export const officeHoursSchema = z
  .object({
    officeStartTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Office start time must be HH:mm'),
    officeEndTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Office end time must be HH:mm'),
    geofenceEnabled: z.boolean().optional().default(false),
    officeLatitude: z.coerce.number().min(-90).max(90).optional(),
    officeLongitude: z.coerce.number().min(-180).max(180).optional(),
    geofenceRadiusMeters: z.coerce
      .number()
      .min(25, 'Minimum geofence radius is 25 meters')
      .max(5000, 'Maximum geofence radius is 5000 meters')
      .optional()
      .default(200),
    officeLocationName: z.string().trim().optional().default(''),
    hourlyReportReminderEnabled: z.boolean().optional().default(true),
    hourlyReportReminderIntervalMinutes: z.coerce
      .number()
      .int()
      .min(15, 'Minimum reminder interval is 15 minutes')
      .max(480, 'Maximum reminder interval is 480 minutes (8 hours)')
      .optional()
      .default(60),
  })
  .refine(
    (data) =>
      parseTimeToMinutes(data.officeStartTime) <
      parseTimeToMinutes(data.officeEndTime),
    'Office start time must be before office end time',
  )
  .refine(
    (data) =>
      !data.geofenceEnabled ||
      (data.officeLatitude != null && data.officeLongitude != null),
  {
    message: 'Office latitude and longitude are required when geofencing is enabled',
    path: ['officeLatitude'],
  });

/** Partial update — merges with existing settings on the server. */
export const updateOfficeSettingsSchema = z.object({
  officeStartTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Office start time must be HH:mm')
    .optional(),
  officeEndTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Office end time must be HH:mm')
    .optional(),
  geofenceEnabled: z.coerce.boolean().optional(),
  officeLatitude: z.coerce.number().min(-90).max(90).optional(),
  officeLongitude: z.coerce.number().min(-180).max(180).optional(),
  geofenceRadiusMeters: z.coerce
    .number()
    .min(25, 'Minimum geofence radius is 25 meters')
    .max(5000, 'Maximum geofence radius is 5000 meters')
    .optional(),
  officeLocationName: z.string().trim().optional(),
  hourlyReportReminderEnabled: z.coerce.boolean().optional(),
  hourlyReportReminderIntervalMinutes: z.coerce
    .number()
    .int()
    .min(15, 'Minimum reminder interval is 15 minutes')
    .max(480, 'Maximum reminder interval is 480 minutes (8 hours)')
    .optional(),
});

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export const workReportSchema = z.object({
  reportDate: z.string().min(1, 'Report date is required'),
  title: nonEmpty('Title'),
  workSummary: nonEmpty('Work summary'),
  completedTasks: z.string().trim().optional().default(''),
  pendingTasks: z.string().trim().optional().default(''),
  blockers: z.string().trim().optional().default(''),
  tomorrowPlan: z.string().trim().optional().default(''),
  workingHours: z.coerce
    .number()
    .min(0, 'Working hours must be 0 or more')
    .max(24, 'Working hours cannot exceed 24'),
  status: z.enum(['draft', 'submitted']).optional().default('draft'),
});

export const hourlyWorkReportSchema = z.object({
  workSummary: z.string().trim().optional().default(''),
  reportPeriodStart: z.string().optional(),
  reportPeriodEnd: z.string().optional(),
  workingHours: z.coerce.number().min(0.5).max(24).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().trim().optional().default(''),
  accuracy: z.coerce.number().positive().optional(),
  capturedAt: z.string().optional(),
});

export const reviewReportSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminComment: z.string().trim().optional().default(''),
});

export const hrAttendanceReportSchema = z.object({
  reportDate: z.string().min(1, 'Report date is required'),
  workSummary: z.string().trim().optional().default(''),
  attendanceSummary: z.object({
    present: z.coerce.number().min(0),
    absent: z.coerce.number().min(0),
    late: z.coerce.number().min(0),
    checkedOut: z.coerce.number().min(0),
    activeEmployees: z.coerce.number().min(0),
  }),
  status: z.enum(['draft', 'submitted']).optional().default('submitted'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  employeeId: z.string().optional(),
  attendanceStatus: z.string().optional(),
  role: z.enum(['employee', 'hr']).optional(),
  reportType: z.enum(['daily_work', 'attendance_summary']).optional(),
});

export const attendanceBreakdownSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  role: z.enum(['employee', 'hr']),
  category: z.enum(['present', 'absent', 'late', 'checked_out']),
});

export const attendanceExportSchema = z.object({
  fromDate: z.string().min(1, 'From date is required'),
  toDate: z.string().min(1, 'To date is required'),
  role: z.enum(['employee', 'hr']),
});

export const attendanceCorrectionSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    checkInTime: z.string().min(1, 'Check-in time is required'),
    checkOutTime: z.string().optional(),
    correctionRemark: z
      .string()
      .trim()
      .min(3, 'Please enter a reason for this correction'),
    attendanceId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.checkOutTime) {
      return;
    }

    const checkIn = new Date(data.checkInTime);
    const checkOut = new Date(data.checkOutTime);

    if (Number.isNaN(checkIn.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid check-in time',
        path: ['checkInTime'],
      });
    }

    if (Number.isNaN(checkOut.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid check-out time',
        path: ['checkOutTime'],
      });
      return;
    }

    if (checkOut <= checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Check-out must be after check-in',
        path: ['checkOutTime'],
      });
    }
  });

export const assignTaskSchema = z.object({
  assignedTo: z.string().min(1, 'Employee is required'),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  dueDate: z.string().optional(),
});

export const submitTaskSchema = z.object({
  completionStatus: z.enum(['completed', 'partial']),
  employeeRemark: z.string().trim().min(1, 'Remark is required'),
});

export const createLeaveSchema = z
  .object({
    leaveType: z.enum(['full_day', 'half_day']),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    halfDayHours: z.coerce.number().min(1).max(8).optional(),
    reason: z.string().trim().min(1, 'Reason is required'),
  })
  .superRefine((data, ctx) => {
    if (data.leaveType === 'half_day' && !data.halfDayHours) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Half day leave requires hours (1-8)',
        path: ['halfDayHours'],
      });
    }
  });

export const leavePreviewSchema = z.object({
  leaveType: z.enum(['full_day', 'half_day']),
  fromDate: z.string().min(1),
  toDate: z.string().min(1),
  halfDayHours: z.coerce.number().min(1).max(8).optional(),
});

export const reviewLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminComment: z.string().trim().optional().default(''),
});

export const appendRoutePointsSchema = z.object({
  points: z
    .array(
      z.object({
        latitude: z.coerce.number(),
        longitude: z.coerce.number(),
        address: z.string().optional(),
        recordedAt: z.string().optional(),
      }),
    )
    .min(1)
    .max(50),
});

export const routeHistoryDateSchema = z.object({
  date: z.string().min(1, 'Date is required'),
});

export const createAnnouncementSchema = z.object({
  title: nonEmpty('Title'),
  message: nonEmpty('Message'),
  audience: z.enum(['all', 'employees', 'hr']),
});

export const createChatGroupSchema = z.object({
  name: nonEmpty('Group name'),
  memberIds: z.array(z.string().min(1)).min(1, 'Select at least one member'),
  photo: z.string().trim().optional().default(''),
});

export const updateChatGroupSchema = z.object({
  name: nonEmpty('Group name').optional(),
  memberIds: z.array(z.string().min(1)).optional(),
  photo: z.string().trim().optional(),
});

export const sendChatMessageSchema = z.object({
  content: nonEmpty('Message'),
});

export const chatMessageUploadSchema = z.object({
  content: z.string().trim().optional().default(''),
  messageType: z.enum(['image', 'file', 'voice']).optional(),
  voiceDuration: z.coerce.number().min(0).optional(),
});

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format');

export const createShiftSchema = z.object({
  name: nonEmpty('Shift name'),
  code: nonEmpty('Shift code'),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  workingDays: z
    .array(z.coerce.number().min(0).max(6))
    .min(1, 'Select at least one working day'),
  graceMinutes: z.coerce.number().min(0).max(120).optional(),
  breakDurationMinutes: z.coerce.number().min(0).max(240).optional(),
  description: z.string().trim().optional().default(''),
  color: z.string().trim().optional(),
});

export const updateShiftSchema = createShiftSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const assignShiftSchema = z.object({
  shiftId: z.string().min(1, 'Shift is required'),
  employeeIds: z.array(z.string().min(1)).min(1, 'Select at least one employee'),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveTo: z.string().optional(),
  notes: z.string().trim().optional().default(''),
});

export const createShiftChangeRequestSchema = z.object({
  requestedShiftId: z.string().min(1, 'Requested shift is required'),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  reason: nonEmpty('Reason'),
});

export const reviewShiftChangeRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminComment: z.string().trim().optional().default(''),
});

export const submitShiftReportSchema = z.object({
  periodFrom: z.string().min(1, 'Period start is required'),
  periodTo: z.string().min(1, 'Period end is required'),
  title: nonEmpty('Report title'),
  notes: z.string().trim().optional().default(''),
});

export const shiftAttendanceQuerySchema = z.object({
  date: z.string().min(1, 'Date is required'),
});

export const updatePayrollPolicySchema = z.object({
  standardWorkingDaysPerMonth: z.coerce.number().min(1).max(31).optional(),
  weeklyOffDays: z.array(z.coerce.number().min(0).max(6)).optional(),
  lateDeductionPerDay: z.coerce.number().min(0).optional(),
  lateDeductionPerMinute: z.coerce.number().min(0).optional(),
  leaveDeductionEnabled: z.boolean().optional(),
  halfDayLeaveFactor: z.coerce.number().min(0).max(1).optional(),
  overtimeEnabled: z.boolean().optional(),
  overtimeMultiplier: z.coerce.number().min(1).optional(),
  overtimeHourlyDivisor: z.coerce.number().min(1).optional(),
  proRataJoiningExit: z.boolean().optional(),
});

export const setCompensationSchema = z.object({
  monthlySalary: z.coerce.number().min(1, 'Monthly salary is required'),
  notes: z.string().trim().optional().default(''),
});

export const createPayrollRunSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
});

export const onboardingUpdateSchema = z.object({
  bankAccountNumber: z.string().trim().optional(),
  bankIfsc: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  panNumber: z.string().trim().optional(),
  employeeNotes: z.string().trim().optional(),
});

export const onboardingDocumentSchema = z.object({
  category: z.enum(['id_proof', 'address_proof', 'bank_proof', 'education', 'other']),
  title: z.string().trim().optional(),
});

export const onboardingReviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'hr_review']),
  approvedMonthlySalary: z.coerce.number().min(0).optional(),
  hrNotes: z.string().trim().optional().default(''),
});

export const onboardingSalarySchema = z.object({
  monthlySalary: z.coerce.number().min(1, 'Monthly salary is required'),
  notes: z.string().trim().optional().default(''),
});

export const assistantAskSchema = z.object({
  questionId: z.enum([
    'leave-balance',
    'check-in-yesterday',
    'hours-this-month',
    'pending-tasks',
    'frequent-late',
    'increasing-absenteeism',
    'low-task-completion',
    'excessive-overtime',
  ]),
});
