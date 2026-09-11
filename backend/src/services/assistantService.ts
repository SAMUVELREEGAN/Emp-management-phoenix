import { Types } from 'mongoose';
import { Attendance } from '../models/Attendance';
import { LeaveRequest } from '../models/LeaveRequest';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import {
  endOfDay,
  formatWorkingHours,
  startOfDay,
} from '../utils/dateHelpers';
import { UserRole } from '../types';

const DEFAULT_ANNUAL_LEAVE_DAYS = 18;

export type AssistantQuestionId =
  | 'leave-balance'
  | 'check-in-yesterday'
  | 'hours-this-month'
  | 'pending-tasks'
  | 'frequent-late'
  | 'increasing-absenteeism'
  | 'low-task-completion'
  | 'excessive-overtime';

export interface AssistantQuestion {
  id: AssistantQuestionId;
  label: string;
  category: 'employee' | 'hr';
}

const EMPLOYEE_QUESTIONS: AssistantQuestion[] = [
  { id: 'leave-balance', label: 'How many leaves do I have?', category: 'employee' },
  { id: 'check-in-yesterday', label: 'What time did I check in yesterday?', category: 'employee' },
  { id: 'hours-this-month', label: 'How many hours did I work this month?', category: 'employee' },
  { id: 'pending-tasks', label: 'Show my pending tasks.', category: 'employee' },
];

const HR_QUESTIONS: AssistantQuestion[] = [
  { id: 'frequent-late', label: 'Detect frequent late arrivals', category: 'hr' },
  { id: 'increasing-absenteeism', label: 'Detect increasing absenteeism', category: 'hr' },
  { id: 'low-task-completion', label: 'Detect low task completion', category: 'hr' },
  { id: 'excessive-overtime', label: 'Detect excessive overtime', category: 'hr' },
];

export interface AssistantAnswer {
  questionId: AssistantQuestionId;
  question: string;
  answer: string;
  generatedAt: string;
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const getYesterdayBounds = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return { start: startOfDay(yesterday), end: endOfDay(yesterday), date: yesterday };
};

const getMonthBounds = (month: number, year: number) => ({
  start: startOfDay(new Date(year, month - 1, 1)),
  end: endOfDay(new Date(year, month, 0)),
});

export const getAssistantQuestions = (role: UserRole): AssistantQuestion[] => {
  if (role === 'employee') {
    return EMPLOYEE_QUESTIONS;
  }
  if (role === 'hr' || role === 'admin') {
    return HR_QUESTIONS;
  }
  return [];
};

const answerLeaveBalance = async (employeeId: string): Promise<string> => {
  const yearStart = startOfDay(new Date(new Date().getFullYear(), 0, 1));
  const yearEnd = endOfDay(new Date(new Date().getFullYear(), 11, 31));

  const [approvedLeaves, pendingLeaves] = await Promise.all([
    LeaveRequest.find({
      employee: employeeId,
      status: 'approved',
      fromDate: { $lte: yearEnd },
      toDate: { $gte: yearStart },
    }),
    LeaveRequest.find({ employee: employeeId, status: 'pending' }),
  ]);

  const usedDays = approvedLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);
  const pendingDays = pendingLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);
  const remaining = Math.max(0, DEFAULT_ANNUAL_LEAVE_DAYS - usedDays);

  const lines = [
    `You have **${remaining} leave day${remaining === 1 ? '' : 's'} remaining** this year.`,
    '',
    `Annual entitlement: ${DEFAULT_ANNUAL_LEAVE_DAYS} days`,
    `Used (approved): ${usedDays} day${usedDays === 1 ? '' : 's'}`,
    `Pending requests: ${pendingLeaves.length} (${pendingDays} day${pendingDays === 1 ? '' : 's'})`,
  ];

  if (pendingLeaves.length > 0) {
    lines.push('');
    lines.push('Pending leave requests:');
    pendingLeaves.slice(0, 5).forEach((leave, index) => {
      lines.push(
        `${index + 1}. ${formatDate(leave.fromDate)} – ${formatDate(leave.toDate)} (${leave.totalDays} day${leave.totalDays === 1 ? '' : 's'})`,
      );
    });
  }

  return lines.join('\n');
};

const answerCheckInYesterday = async (employeeId: string): Promise<string> => {
  const { start, end, date } = getYesterdayBounds();

  const record = await Attendance.findOne({
    employee: employeeId,
    date: { $gte: start, $lte: end },
  });

  if (!record) {
    return `No attendance was recorded for **yesterday (${formatDate(date)})**.`;
  }

  const lines = [`**Yesterday (${formatDate(date)})**`];

  if (record.checkInTime) {
    lines.push(`Check-in: ${formatTime(record.checkInTime)}`);
  } else {
    lines.push('Check-in: Not recorded');
  }

  if (record.checkOutTime) {
    lines.push(`Check-out: ${formatTime(record.checkOutTime)}`);
  }

  lines.push(`Status: ${record.attendanceStatus.replace('_', ' ')}`);

  if (record.lateMinutes > 0) {
    lines.push(`Late by: ${record.lateMinutes} minute${record.lateMinutes === 1 ? '' : 's'}`);
  }

  if (record.totalWorkingMinutes > 0) {
    lines.push(`Working hours: ${formatWorkingHours(record.totalWorkingMinutes)}`);
  }

  if (record.overtimeMinutes > 0) {
    lines.push(`Overtime: ${formatWorkingHours(record.overtimeMinutes)}`);
  }

  return lines.join('\n');
};

const answerHoursThisMonth = async (employeeId: string): Promise<string> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start, end } = getMonthBounds(month, year);
  const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: start, $lte: end },
  });

  let totalMinutes = 0;
  let overtimeMinutes = 0;
  let present = 0;
  let late = 0;
  let absent = 0;

  records.forEach(record => {
    totalMinutes += record.totalWorkingMinutes || 0;
    overtimeMinutes += record.overtimeMinutes || 0;
    if (record.attendanceStatus === 'present') present += 1;
    if (record.attendanceStatus === 'late') late += 1;
    if (record.attendanceStatus === 'absent') absent += 1;
  });

  const workedDays = records.filter(r => (r.totalWorkingMinutes || 0) > 0).length;

  return [
    `**${monthLabel}** — you worked **${formatWorkingHours(totalMinutes)}** across ${workedDays} day${workedDays === 1 ? '' : 's'}.`,
    '',
    `Present: ${present} | Late: ${late} | Absent: ${absent}`,
    overtimeMinutes > 0 ? `Overtime: ${formatWorkingHours(overtimeMinutes)}` : 'Overtime: None',
  ]
    .filter(Boolean)
    .join('\n');
};

const answerPendingTasks = async (employeeId: string): Promise<string> => {
  const tasks = await Task.find({ assignedTo: employeeId, status: 'assigned' })
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(10);

  if (!tasks.length) {
    return 'You have **no pending tasks**. Great job staying on top of your work!';
  }

  const lines = [
    `You have **${tasks.length} pending task${tasks.length === 1 ? '' : 's'}**:`,
    '',
  ];

  tasks.forEach((task, index) => {
    const due = task.dueDate ? ` (Due: ${formatDate(task.dueDate)})` : '';
    lines.push(`${index + 1}. ${task.title}${due}`);
    if (task.description) {
      const snippet = task.description.length > 80
        ? `${task.description.slice(0, 77)}...`
        : task.description;
      lines.push(`   ${snippet}`);
    }
  });

  return lines.join('\n');
};

const getActiveEmployeeIds = async () => {
  const employees = await User.find({ role: 'employee', status: 'active' }).select('_id fullName employeeId');
  return employees;
};

const answerFrequentLate = async (): Promise<string> => {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStart = startOfDay(since);

  const records = await Attendance.find({
    date: { $gte: sinceStart },
    attendanceStatus: 'late',
  }).populate('employee', 'fullName employeeId');

  const lateMap = new Map<string, { name: string; empId: string; count: number; minutes: number }>();

  records.forEach(record => {
    const emp = record.employee as unknown as { _id: Types.ObjectId; fullName: string; employeeId?: string };
    if (!emp?._id) return;
    const key = emp._id.toString();
    const existing = lateMap.get(key) || {
      name: emp.fullName,
      empId: emp.employeeId || '—',
      count: 0,
      minutes: 0,
    };
    existing.count += 1;
    existing.minutes += record.lateMinutes || 0;
    lateMap.set(key, existing);
  });

  const flagged = Array.from(lateMap.values())
    .filter(item => item.count >= 3)
    .sort((a, b) => b.count - a.count);

  if (!flagged.length) {
    return 'No employees with **frequent late arrivals** detected in the last 30 days (threshold: 3+ late days).';
  }

  const lines = [
    `**${flagged.length} employee${flagged.length === 1 ? '' : 's'}** with frequent late arrivals (3+ late days in last 30 days):`,
    '',
  ];

  flagged.slice(0, 10).forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} (${item.empId}) — ${item.count} late days, ${item.minutes} total late minutes`,
    );
  });

  return lines.join('\n');
};

const answerIncreasingAbsenteeism = async (): Promise<string> => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const currentBounds = getMonthBounds(currentMonth, currentYear);
  const prevBounds = getMonthBounds(prevMonth, prevYear);
  const employees = await getActiveEmployeeIds();

  const [currentRecords, prevRecords] = await Promise.all([
    Attendance.find({
      date: { $gte: currentBounds.start, $lte: currentBounds.end },
      attendanceStatus: 'absent',
    }),
    Attendance.find({
      date: { $gte: prevBounds.start, $lte: prevBounds.end },
      attendanceStatus: 'absent',
    }),
  ]);

  const countByEmployee = (records: typeof currentRecords) => {
    const map = new Map<string, number>();
    records.forEach(record => {
      const key = record.employee.toString();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  };

  const currentCounts = countByEmployee(currentRecords);
  const prevCounts = countByEmployee(prevRecords);

  const flagged = employees
    .map(emp => {
      const id = emp._id.toString();
      const current = currentCounts.get(id) || 0;
      const previous = prevCounts.get(id) || 0;
      const increase = current - previous;
      const percentIncrease = previous > 0 ? (increase / previous) * 100 : current > 0 ? 100 : 0;
      return {
        name: emp.fullName,
        empId: emp.employeeId || '—',
        current,
        previous,
        increase,
        percentIncrease,
      };
    })
    .filter(item => item.current >= 2 && item.increase >= 1 && (item.percentIncrease >= 50 || item.increase >= 2))
    .sort((a, b) => b.increase - a.increase);

  const currentLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const prevLabel = new Date(prevYear, prevMonth - 1, 1).toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  if (!flagged.length) {
    return `No **increasing absenteeism** detected comparing ${currentLabel} vs ${prevLabel}.`;
  }

  const lines = [
    `**${flagged.length} employee${flagged.length === 1 ? '' : 's'}** showing increased absenteeism (${currentLabel} vs ${prevLabel}):`,
    '',
  ];

  flagged.slice(0, 10).forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} (${item.empId}) — ${item.previous} → ${item.current} absent days (+${item.increase})`,
    );
  });

  return lines.join('\n');
};

const answerLowTaskCompletion = async (): Promise<string> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const overdueTasks = await Task.find({
    status: 'assigned',
    $or: [
      { dueDate: { $lt: startOfDay() } },
      { dueDate: { $exists: false }, createdAt: { $lt: cutoff } },
      { createdAt: { $lt: cutoff } },
    ],
  })
    .populate('assignedTo', 'fullName employeeId')
    .sort({ dueDate: 1, createdAt: 1 });

  const employeeMap = new Map<
    string,
    { name: string; empId: string; tasks: string[] }
  >();

  overdueTasks.forEach(task => {
    const emp = task.assignedTo as unknown as {
      _id: Types.ObjectId;
      fullName: string;
      employeeId?: string;
    };
    if (!emp?._id) return;
    const key = emp._id.toString();
    const existing = employeeMap.get(key) || {
      name: emp.fullName,
      empId: emp.employeeId || '—',
      tasks: [],
    };
    existing.tasks.push(task.title);
    employeeMap.set(key, existing);
  });

  const flagged = Array.from(employeeMap.values()).sort(
    (a, b) => b.tasks.length - a.tasks.length,
  );

  if (!flagged.length) {
    return 'No employees with **low task completion** detected. All assigned tasks are on track.';
  }

  const lines = [
    `**${flagged.length} employee${flagged.length === 1 ? '' : 's'}** with overdue or long-pending tasks:`,
    '',
  ];

  flagged.slice(0, 10).forEach((item, index) => {
    const taskList = item.tasks.slice(0, 3).join(', ');
    const extra = item.tasks.length > 3 ? ` (+${item.tasks.length - 3} more)` : '';
    lines.push(`${index + 1}. ${item.name} (${item.empId}) — ${item.tasks.length} pending: ${taskList}${extra}`);
  });

  return lines.join('\n');
};

const answerExcessiveOvertime = async (): Promise<string> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { start, end } = getMonthBounds(month, year);
  const monthLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const OT_THRESHOLD_MINUTES = 600; // 10 hours

  const records = await Attendance.find({
    date: { $gte: start, $lte: end },
    overtimeMinutes: { $gt: 0 },
  }).populate('employee', 'fullName employeeId');

  const otMap = new Map<string, { name: string; empId: string; minutes: number; days: number }>();

  records.forEach(record => {
    const emp = record.employee as unknown as {
      _id: Types.ObjectId;
      fullName: string;
      employeeId?: string;
    };
    if (!emp?._id) return;
    const key = emp._id.toString();
    const existing = otMap.get(key) || {
      name: emp.fullName,
      empId: emp.employeeId || '—',
      minutes: 0,
      days: 0,
    };
    existing.minutes += record.overtimeMinutes || 0;
    existing.days += 1;
    otMap.set(key, existing);
  });

  const flagged = Array.from(otMap.values())
    .filter(item => item.minutes >= OT_THRESHOLD_MINUTES)
    .sort((a, b) => b.minutes - a.minutes);

  if (!flagged.length) {
    return `No **excessive overtime** detected in ${monthLabel} (threshold: ${formatWorkingHours(OT_THRESHOLD_MINUTES)}).`;
  }

  const lines = [
    `**${flagged.length} employee${flagged.length === 1 ? '' : 's'}** with excessive overtime in ${monthLabel}:`,
    '',
  ];

  flagged.slice(0, 10).forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} (${item.empId}) — ${formatWorkingHours(item.minutes)} across ${item.days} day${item.days === 1 ? '' : 's'}`,
    );
  });

  return lines.join('\n');
};

export const askAssistant = async (
  userId: string,
  role: UserRole,
  questionId: AssistantQuestionId,
): Promise<AssistantAnswer> => {
  const questions = getAssistantQuestions(role);
  const question = questions.find(item => item.id === questionId);

  if (!question) {
    throw ApiError.forbidden('This question is not available for your role');
  }

  let answer: string;

  switch (questionId) {
    case 'leave-balance':
      answer = await answerLeaveBalance(userId);
      break;
    case 'check-in-yesterday':
      answer = await answerCheckInYesterday(userId);
      break;
    case 'hours-this-month':
      answer = await answerHoursThisMonth(userId);
      break;
    case 'pending-tasks':
      answer = await answerPendingTasks(userId);
      break;
    case 'frequent-late':
      answer = await answerFrequentLate();
      break;
    case 'increasing-absenteeism':
      answer = await answerIncreasingAbsenteeism();
      break;
    case 'low-task-completion':
      answer = await answerLowTaskCompletion();
      break;
    case 'excessive-overtime':
      answer = await answerExcessiveOvertime();
      break;
    default:
      throw ApiError.badRequest('Unknown question');
  }

  return {
    questionId,
    question: question.label,
    answer,
    generatedAt: new Date().toISOString(),
  };
};
