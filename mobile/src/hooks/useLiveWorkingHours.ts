import { useEffect, useState } from 'react';
import {
  formatAttendanceWorkingHours,
  getWorkingMinutes,
  isAttendanceSessionActive,
} from '../utils/attendanceHours';
import type { Attendance } from '../types';

export function useLiveWorkingHours(attendance?: Attendance | null) {
  const [now, setNow] = useState(() => new Date());
  const isActive = isAttendanceSessionActive(attendance);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [isActive, attendance?.checkInTime, attendance?.checkOutTime]);

  return {
    isActive,
    minutes: getWorkingMinutes(attendance, now),
    label: formatAttendanceWorkingHours(attendance, now),
  };
}
