import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppHeader,
  AttendanceCard,
  AttendanceExportModal,
  DatePickerField,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  StaffRoleTabs,
  StatCard,
  type StaffRoleTab,
} from '../../components';
import { theme } from '../../constants/theme';
import { attendanceApi } from '../../api/attendanceApi';
import { settingsApi } from '../../api/settingsApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { saveAndShareBase64File } from '../../utils/fileExport';
import { formatDate, isWeeklyHoliday, toDateInputValue } from '../../utils/dates';
import { normalizeOfficeHours } from '../../utils/officeHours';
import type {
  Attendance,
  AttendanceBreakdownCategory,
  AttendanceRoleSummary,
  AttendanceSummary,
} from '../../types';
import type {
  AdminAttendanceStackParamList,
  HrAttendanceStackParamList,
} from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

type AttendanceOverviewStack =
  | AdminAttendanceStackParamList
  | HrAttendanceStackParamList;

type CategoryFilter = 'all' | AttendanceBreakdownCategory;

const CATEGORY_LABELS: Record<AttendanceBreakdownCategory, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  checked_out: 'Checked Out',
};

function getEmployeeName(employee: Attendance['employee']): string {
  if (typeof employee === 'string') {
    return 'Staff member';
  }
  return `${employee.fullName} (${employee.employeeId})`;
}

function getEmployeeId(attendance: Attendance): string {
  if (attendance._id.startsWith('absent-')) {
    return attendance._id.replace('absent-', '');
  }
  if (typeof attendance.employee === 'string') {
    return attendance.employee;
  }
  return attendance.employee._id;
}

function RoleSummaryCards({
  summary,
  interactive = false,
  selectedCategory = 'all',
  onSelectCategory,
}: {
  summary?: AttendanceRoleSummary;
  interactive?: boolean;
  selectedCategory?: CategoryFilter;
  onSelectCategory?: (category: AttendanceBreakdownCategory) => void;
}) {
  const makePress = (category: AttendanceBreakdownCategory) =>
    interactive && onSelectCategory
      ? () => onSelectCategory(category)
      : undefined;

  return (
    <View style={styles.summaryBlock}>
      <View style={styles.statsRow}>
        <StatCard
          title="Present"
          value={summary?.present || 0}
          icon="check-circle-outline"
          onPress={makePress('present')}
          selected={selectedCategory === 'present'}
        />
        <StatCard
          title="Absent"
          value={summary?.absent || 0}
          icon="close-circle-outline"
          color={theme.colors.error}
          backgroundColor={theme.colors.errorLight}
          onPress={makePress('absent')}
          selected={selectedCategory === 'absent'}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          title="Late"
          value={summary?.late || 0}
          icon="clock-alert-outline"
          color={theme.colors.warning}
          backgroundColor={theme.colors.warningLight}
          onPress={makePress('late')}
          selected={selectedCategory === 'late'}
        />
        <StatCard
          title="Checked Out"
          value={summary?.checkedOut || 0}
          icon="logout"
          onPress={makePress('checked_out')}
          selected={selectedCategory === 'checked_out'}
        />
      </View>
      {interactive ? (
        <Text style={styles.tapHint}>Tap a card to see who is in that category</Text>
      ) : null}
    </View>
  );
}

interface AttendanceOverviewScreenProps {
  embedded?: boolean;
  fixedRole?: StaffRoleTab;
  enableDateFilter?: boolean;
  enableExport?: boolean;
}

export default function AttendanceOverviewScreen({
  embedded = false,
  fixedRole,
  enableDateFilter = false,
  enableExport = false,
}: AttendanceOverviewScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AttendanceOverviewStack>>();
  const userRole = useAuthStore(state => state.user?.role);
  const isHr = userRole === 'hr';
  const [staffTab, setStaffTab] = useState<StaffRoleTab>(fixedRole || 'employee');
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [officeStartTime, setOfficeStartTime] = useState<string | undefined>();

  const clearScreenState = useCallback(() => {
    setRecords([]);
    setSummary(null);
    setLoading(false);
    setRefreshing(false);
    setSelectedCategory('all');
  }, []);

  const { showBack, handleBack, leavingRef, isLeaving } = useQuickAccessBack({
    onBeforeBack: clearScreenState,
    enabled: !embedded,
  });
  const showRoleTabs = !embedded && !fixedRole;
  const interactiveStats = enableDateFilter;

  const activeSummary = staffTab === 'employee' ? summary?.employees : summary?.hr;

  const fetchData = useCallback(
    async (
      isRefresh = false,
      roleTab: StaffRoleTab = staffTab,
      dateValue: string = selectedDate,
      category: CategoryFilter = selectedCategory,
    ) => {
      if (leavingRef.current) {
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const summaryResponse = await attendanceApi.summary(
          enableDateFilter ? dateValue : undefined,
        );

        let listItems: Attendance[] = [];
        if (enableDateFilter && category !== 'all') {
          const breakdownResponse = await attendanceApi.breakdown({
            date: dateValue,
            role: roleTab,
            category,
          });
          listItems = breakdownResponse.data.items;
        } else {
          const listParams = {
            page: 1,
            limit: 50,
            role: roleTab,
            ...(enableDateFilter
              ? { fromDate: dateValue, toDate: dateValue }
              : {}),
          };
          const listResponse = await attendanceApi.list(listParams);
          listItems = listResponse.data.items;
        }

        if (!leavingRef.current) {
          setRecords(listItems);
          setSummary(summaryResponse.data.summary);
        }
      } catch (err) {
        if (!leavingRef.current) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!leavingRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enableDateFilter, selectedCategory, selectedDate, staffTab],
  );

  useEffect(() => {
    fetchData(false, staffTab, selectedDate, selectedCategory);
  }, [staffTab, selectedDate, selectedCategory, fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData(false, staffTab, selectedDate, selectedCategory);
    }, [fetchData, staffTab, selectedDate, selectedCategory]),
  );

  useEffect(() => {
    settingsApi
      .getOfficeHours()
      .then(response => {
        setOfficeStartTime(normalizeOfficeHours(response.data.officeHours).officeStartTime);
      })
      .catch(() => {
        setOfficeStartTime(undefined);
      });
  }, []);

  const handleSelectCategory = (category: AttendanceBreakdownCategory) => {
    setSelectedCategory(current => (current === category ? 'all' : category));
  };

  const openDetail = (attendanceId: string) => {
    if (attendanceId.startsWith('absent-')) {
      return;
    }
    navigation.navigate('AttendanceDetail', { attendanceId });
  };

  const openCorrection = (item: Attendance) => {
    navigation.navigate('AttendanceCorrection', {
      employeeId: getEmployeeId(item),
      employeeName: getEmployeeName(item.employee),
      date: toDateInputValue(item.date),
      attendanceId: item._id.startsWith('absent-') ? undefined : item._id,
      checkInTime: item.checkInTime,
      checkOutTime: item.checkOutTime,
    });
  };

  const handleExportReport = async (fromDate: string, toDate: string) => {
    try {
      const response = await attendanceApi.exportReport({
        fromDate,
        toDate,
        role: staffTab,
      });
      await saveAndShareBase64File(
        response.data.base64,
        response.data.filename,
        response.data.mimeType,
      );
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const tabLabel = staffTab === 'employee' ? 'Employee' : 'HR';

  const listTitle =
    selectedCategory !== 'all'
      ? `${CATEGORY_LABELS[selectedCategory]} ${tabLabel}s (${records.length})`
      : `${tabLabel} Records${enableDateFilter ? ` (${formatDate(selectedDate)})` : ''}`;

  const emptyMessage =
    selectedCategory === 'absent' && isWeeklyHoliday(selectedDate)
      ? `Sunday is a weekly holiday. No employees are marked absent on ${formatDate(selectedDate)}.`
      : selectedCategory !== 'all'
      ? `No ${tabLabel.toLowerCase()}s marked as ${CATEGORY_LABELS[selectedCategory].toLowerCase()} on ${formatDate(selectedDate)}.`
      : enableDateFilter
        ? `No ${tabLabel.toLowerCase()} attendance found for ${formatDate(selectedDate)}.`
        : `${tabLabel} check-in records will appear here with location and working hours.`;

  return (
    <View style={styles.container} collapsable={false}>
      {!embedded ? (
        <AppHeader
          title={isHr ? 'Team Attendance Report' : 'Attendance'}
          subtitle={`${tabLabel} check-in, check-out, working hours, and GPS locations`}
          showBack={showBack}
          onBack={showBack ? handleBack : undefined}
        />
      ) : null}

      {showRoleTabs ? (
        <StaffRoleTabs
          value={staffTab}
          onChange={tab => {
            setStaffTab(tab);
            setSelectedCategory('all');
          }}
        />
      ) : null}

      {enableDateFilter ? (
        <View style={styles.dateFilterWrap}>
          <DatePickerField
            label="Select Date"
            value={selectedDate}
            onChange={date => {
              setSelectedDate(date);
              setSelectedCategory('all');
            }}
          />
          {enableExport ? (
            <Pressable
              style={styles.exportButton}
              onPress={() => setExportModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Export attendance report">
              <MaterialCommunityIcons name="file-export-outline" size={20} color={theme.colors.white} />
              <Text style={styles.exportButtonText}>Export Excel</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <AttendanceExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onExport={handleExportReport}
      />

      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchData()} />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
          }
          ListHeaderComponent={
            <View style={styles.summary}>
              <Text style={styles.sectionTitle}>
                {tabLabel} Attendance Summary
                {enableDateFilter ? ` • ${formatDate(selectedDate)}` : ''}
              </Text>
              <RoleSummaryCards
                summary={activeSummary}
                interactive={interactiveStats}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
              />
              <View style={styles.listTitleRow}>
                <Text style={styles.listTitle}>{listTitle}</Text>
                {selectedCategory !== 'all' ? (
                  <Pressable onPress={() => setSelectedCategory('all')}>
                    <Text style={styles.clearFilter}>Show all</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-blank-outline"
              title={
                selectedCategory !== 'all'
                  ? `No ${CATEGORY_LABELS[selectedCategory].toLowerCase()} ${tabLabel.toLowerCase()}s`
                  : `No ${tabLabel.toLowerCase()} attendance records`
              }
              message={emptyMessage}
            />
          }
          renderItem={({ item }) => {
            const isAbsent = item._id.startsWith('absent-');
            return (
              <View style={styles.recordItem}>
                <AttendanceCard
                  attendance={item}
                  showEmployee
                  officeStartTime={officeStartTime}
                  onPress={isAbsent ? undefined : () => openDetail(item._id)}
                />
                <Pressable
                  style={styles.correctionButton}
                  onPress={() => openCorrection(item)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isAbsent ? 'Mark attendance for absent employee' : 'Correct attendance'
                  }
                >
                  <MaterialCommunityIcons
                    name={isAbsent ? 'account-check-outline' : 'calendar-edit'}
                    size={18}
                    color={theme.colors.primaryDark}
                  />
                  <Text style={styles.correctionButtonText}>
                    {isAbsent ? 'Mark Attendance' : 'Correct Attendance'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, padding: theme.spacing.md },
  dateFilterWrap: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm + 2,
    marginBottom: theme.spacing.sm,
  },
  exportButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
  },
  list: { padding: theme.spacing.md, flexGrow: 1 },
  recordItem: {
    marginBottom: theme.spacing.sm,
  },
  correctionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  correctionButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primaryDark,
  },
  summary: { marginBottom: theme.spacing.sm },
  summaryBlock: { marginBottom: theme.spacing.md },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tapHint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: -theme.spacing.xs,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  listTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
  },
  clearFilter: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  statsRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.sm },
});
