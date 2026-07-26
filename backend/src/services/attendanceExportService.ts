import ExcelJS from 'exceljs';
import { Attendance } from '../models/Attendance';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import {
  calculateWorkingMinutes,
  eachDayInRange,
  endOfDay,
  formatShortDateLabel,
  formatWorkingHours,
  parseDateOnly,
  toDateKey,
} from '../utils/dateHelpers';

const PRESENT_STATUSES = new Set(['present', 'late', 'half_day']);

function isPresentRecord(record?: {
  checkInTime?: Date;
  attendanceStatus?: string;
}): boolean {
  if (!record?.checkInTime) {
    return false;
  }
  return PRESENT_STATUSES.has(record.attendanceStatus || '');
}

function getWorkingMinutes(record?: {
  checkInTime?: Date;
  checkOutTime?: Date;
  totalWorkingMinutes?: number;
}): number {
  if (!record?.checkInTime) {
    return 0;
  }
  if (record.totalWorkingMinutes && record.totalWorkingMinutes > 0) {
    return record.totalWorkingMinutes;
  }
  if (record.checkOutTime) {
    return calculateWorkingMinutes(
      new Date(record.checkInTime),
      new Date(record.checkOutTime),
    );
  }
  return 0;
}

function getDayCellLabel(record?: {
  checkInTime?: Date;
  checkOutTime?: Date;
  attendanceStatus?: string;
  totalWorkingMinutes?: number;
}): { label: string; isPresent: boolean; workingMinutes: number } {
  if (!isPresentRecord(record)) {
    return { label: 'Absent', isPresent: false, workingMinutes: 0 };
  }

  const minutes = getWorkingMinutes(record);
  const hoursLabel = formatWorkingHours(minutes);
  const status = record?.attendanceStatus;

  if (status === 'late') {
    return {
      label: `Late (${hoursLabel})`,
      isPresent: true,
      workingMinutes: minutes,
    };
  }

  if (status === 'half_day') {
    return {
      label: `Half Day (${hoursLabel})`,
      isPresent: true,
      workingMinutes: minutes,
    };
  }

  return {
    label: `Present (${hoursLabel})`,
    isPresent: true,
    workingMinutes: minutes,
  };
}

export const exportAttendanceReport = async (
  fromDateInput: string,
  toDateInput: string,
  staffRole: 'employee' | 'hr',
) => {
  const fromDate = parseDateOnly(fromDateInput);
  const toDate = parseDateOnly(toDateInput);

  if (fromDate.getTime() > toDate.getTime()) {
    throw ApiError.badRequest('From date must be on or before to date');
  }

  const days = eachDayInRange(fromDate, toDate);
  if (days.length > 366) {
    throw ApiError.badRequest('Date range cannot exceed 366 days');
  }

  const employees = await User.find({
    role: staffRole,
    status: 'active',
  })
    .sort({ fullName: 1 })
    .select('fullName employeeId department');

  const employeeIds = employees.map((employee) => employee._id);

  const records = await Attendance.find({
    date: { $gte: fromDate, $lte: endOfDay(toDate) },
    employee: { $in: employeeIds },
  }).select('employee date checkInTime checkOutTime attendanceStatus totalWorkingMinutes');

  const recordMap = new Map<string, Map<string, (typeof records)[number]>>();
  for (const record of records) {
    const employeeId = String(record.employee);
    const dateKey = toDateKey(record.date);
    if (!recordMap.has(employeeId)) {
      recordMap.set(employeeId, new Map());
    }
    recordMap.get(employeeId)!.set(dateKey, record);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Employee Management App';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Attendance Report');
  const dateLabels = days.map((day) => formatShortDateLabel(day));
  const headers = [
    'Employee ID',
    'Employee Name',
    'Department',
    ...dateLabels,
    'Total Present',
    'Total Absent',
    'Total Working Hours',
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  for (const employee of employees) {
    const employeeRecords = recordMap.get(employee._id.toString());
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalWorkingMinutes = 0;
    const rowValues: (string | number)[] = [
      employee.employeeId,
      employee.fullName,
      employee.department || '-',
    ];

    for (const day of days) {
      const dateKey = toDateKey(day);
      const record = employeeRecords?.get(dateKey);
      const cell = getDayCellLabel(record);
      if (cell.isPresent) {
        totalPresent += 1;
      } else {
        totalAbsent += 1;
      }
      totalWorkingMinutes += cell.workingMinutes;
      rowValues.push(cell.label);
    }

    rowValues.push(totalPresent, totalAbsent, formatWorkingHours(totalWorkingMinutes));
    sheet.addRow(rowValues);
  }

  sheet.columns = [
    { width: 14 },
    { width: 24 },
    { width: 16 },
    ...days.map(() => ({ width: 14 })),
    { width: 14 },
    { width: 14 },
    { width: 18 },
  ];

  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 3 }];

  const roleLabel = staffRole === 'hr' ? 'HR' : 'Employee';
  sheet.getCell('A1').note = `${roleLabel} attendance from ${fromDateInput} to ${toDateInput}`;

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const filename = `${staffRole}-attendance-${fromDateInput}-to-${toDateInput}.xlsx`;

  return {
    buffer,
    filename,
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};
