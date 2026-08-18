import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { attendanceApi } from '../api/attendanceApi';
import { useAuthStore } from '../store/authStore';
import { navigationRef } from '../navigation/navigationRef';
import { isOnBreak } from '../utils/attendanceHours';
import { getMinutesFromDate, parseTimeToMinutes } from '../utils/dates';
import {
  formatReminderIntervalLabel,
  normalizeReminderIntervalMinutes,
} from '../utils/reminderInterval';

function isWithinOfficeHours(
  now: Date,
  officeStartTime: string,
  officeEndTime: string,
): boolean {
  const minutes = getMinutesFromDate(now);
  return (
    minutes >= parseTimeToMinutes(officeStartTime) &&
    minutes <= parseTimeToMinutes(officeEndTime)
  );
}

function openHourlyReportForm(periodStart: string, periodEnd: string) {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Employee',
      params: {
        screen: 'Reports',
        params: {
          screen: 'HourlyReportForm',
          params: { periodStart, periodEnd },
        },
      },
    }),
  );
}

export function useHourlyReportReminder() {
  const userRole = useAuthStore(state => state.user?.role);
  const lastPromptAtRef = useRef(0);

  useEffect(() => {
    if (userRole !== 'employee') {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const checkReminder = async () => {
      try {
        const response = await attendanceApi.today();
        if (cancelled) {
          return;
        }

        const { attendance, officeHours } = response.data;
        if (!officeHours.hourlyReportReminderEnabled) {
          return;
        }
        if (!attendance?.checkInTime || attendance.checkOutTime) {
          return;
        }
        if (isOnBreak(attendance)) {
          return;
        }

        const now = new Date();
        if (
          !isWithinOfficeHours(
            now,
            officeHours.officeStartTime,
            officeHours.officeEndTime,
          )
        ) {
          return;
        }

        const intervalMinutes = normalizeReminderIntervalMinutes(
          officeHours.hourlyReportReminderIntervalMinutes,
          (officeHours as { hourlyReportReminderIntervalHours?: number })
            .hourlyReportReminderIntervalHours,
        );
        const intervalMs = intervalMinutes * 60 * 1000;
        const checkInMs = new Date(attendance.checkInTime).getTime();
        const lastReminderMs = attendance.lastHourlyReminderAt
          ? new Date(attendance.lastHourlyReminderAt).getTime()
          : checkInMs;
        const anchorMs = Math.max(checkInMs, lastReminderMs);
        const nowMs = now.getTime();

        if (nowMs - anchorMs < intervalMs) {
          return;
        }
        if (nowMs - lastPromptAtRef.current < intervalMs) {
          return;
        }

        lastPromptAtRef.current = nowMs;
        const periodStart = new Date(anchorMs).toISOString();
        const periodEnd = now.toISOString();
        const intervalLabel = formatReminderIntervalLabel(intervalMinutes);

        Alert.alert(
          'Hourly Report Due',
          `Kindly send your hourly work report to Admin and HR. It has been ${intervalLabel} since your last update.`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Submit Report',
              onPress: () => openHourlyReportForm(periodStart, periodEnd),
            },
          ],
        );
      } catch {
        // Ignore polling errors while offline.
      }
    };

    void checkReminder();
    timer = setInterval(() => {
      void checkReminder();
    }, 60_000);

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void checkReminder();
      }
    });

    return () => {
      cancelled = true;
      if (timer) {
        clearInterval(timer);
      }
      subscription.remove();
    };
  }, [userRole]);
}
