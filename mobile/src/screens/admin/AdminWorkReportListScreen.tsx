import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  ReportKindTabs,
  StaffRoleTabs,
  WorkReportCard,
  type ReportKindTab,
  type StaffRoleTab,
} from '../../components';
import { theme } from '../../constants/theme';
import { workReportApi } from '../../api/workReportApi';
import { getErrorMessage } from '../../utils/errors';
import type { WorkReport, WorkReportStatus } from '../../types';
import type { AdminReportsStackParamList, HrReportsStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

const FILTERS: Array<{ label: string; value?: WorkReportStatus }> = [
  { label: 'All', value: undefined },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Draft', value: 'draft' },
];

interface AdminWorkReportListScreenProps {
  embedded?: boolean;
  fixedRole?: StaffRoleTab;
}

export default function AdminWorkReportListScreen({
  embedded = false,
  fixedRole,
}: AdminWorkReportListScreenProps) {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AdminReportsStackParamList | HrReportsStackParamList>
    >();
  const [staffTab, setStaffTab] = useState<StaffRoleTab>(fixedRole || 'employee');
  const [reportKind, setReportKind] = useState<ReportKindTab>('daily');
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [filter, setFilter] = useState<WorkReportStatus | undefined>('submitted');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    moreHubFallback: true,
    enabled: !embedded,
    onBeforeBack: () => {
      setReports([]);
      setStaffTab(fixedRole || 'employee');
      setReportKind('daily');
      setFilter('submitted');
    },
  });

  const isEmployeeStaff = staffTab === 'employee';
  const isHourly = isEmployeeStaff && reportKind === 'hourly';
  const canSwitchStaffRole = !embedded && !fixedRole;

  const fetchReports = useCallback(
    async (
      isRefresh = false,
      statusFilter = filter,
      roleTab: StaffRoleTab = staffTab,
      kind: ReportKindTab = reportKind,
    ) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setReports([]);
      }
      setError('');
      try {
        const response = await workReportApi.list({
          page: 1,
          limit: 50,
          status: statusFilter,
          role: roleTab,
          reportType:
            roleTab === 'hr'
              ? 'attendance_summary'
              : kind === 'hourly'
                ? 'hourly_work'
                : 'daily_work',
        });
        setReports(response.data.items);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, staffTab, reportKind],
  );

  useEffect(() => {
    fetchReports(false, filter, staffTab, reportKind);
  }, [staffTab, fetchReports, filter, reportKind]);

  useFocusEffect(
    useCallback(() => {
      fetchReports(false, filter, staffTab, reportKind);
    }, [fetchReports, filter, staffTab, reportKind]),
  );

  const handleStaffTabChange = (tab: StaffRoleTab) => {
    setStaffTab(tab);
    if (tab === 'hr') {
      setReportKind('daily');
    }
  };

  const handleReportKindChange = (kind: ReportKindTab) => {
    setReportKind(kind);
  };

  const tabLabel = staffTab === 'employee' ? 'Employee' : 'HR';
  const listTitle = isHourly
    ? 'Employee Hourly Reports'
    : staffTab === 'hr'
      ? 'HR Attendance Reports'
      : 'Employee Daily Reports';

  const controlsHeader = (
    <View style={styles.controlsBlock}>
      {!embedded && !fixedRole ? (
        <StaffRoleTabs value={staffTab} onChange={handleStaffTabChange} />
      ) : null}

      {isEmployeeStaff || canSwitchStaffRole ? (
        <View style={styles.kindTabsSlot}>
          {isEmployeeStaff ? (
            <ReportKindTabs value={reportKind} onChange={handleReportKindChange} />
          ) : (
            <View style={styles.kindTabsPlaceholder} />
          )}
        </View>
      ) : null}

      <Text style={styles.listTitle} numberOfLines={1}>
        {listTitle}
      </Text>

      <View style={styles.filtersRow}>
        {FILTERS.map(item => (
          <Pressable
            key={item.label}
            style={[styles.chip, filter === item.value && styles.chipActive]}
            onPress={() => setFilter(item.value)}>
            <Text style={[styles.chipText, filter === item.value && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container} collapsable={false}>
      {!embedded ? (
        <AppHeader
          title="Work Reports"
          subtitle={
            isHourly
              ? 'Review employee hourly work updates'
              : `Review ${tabLabel.toLowerCase()} daily work reports`
          }
          showBack={showBack}
          onBack={showBack ? handleBack : undefined}
        />
      ) : null}

      {isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item._id}
          style={styles.listFlex}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(true)} />
          }
          ListHeaderComponent={controlsHeader}
          ListEmptyComponent={
            loading && !refreshing ? (
              <View style={styles.listLoader}>
                <LoadingIndicator />
              </View>
            ) : error ? (
              <View style={styles.center}>
                <ErrorMessage message={error} onRetry={() => fetchReports()} />
              </View>
            ) : (
              <EmptyState
                icon={isHourly ? 'clock-outline' : 'file-search-outline'}
                title={
                  isHourly
                    ? 'No hourly reports found'
                    : `No ${tabLabel.toLowerCase()} reports found`
                }
                message={
                  isHourly
                    ? 'Employee hourly reports will appear here after they submit them.'
                    : staffTab === 'hr'
                      ? 'HR attendance summary reports will appear here when submitted.'
                      : 'Try changing the status filter or check back later.'
                }
              />
            )
          }
          renderItem={({ item }) => (
            <WorkReportCard
              report={item}
              showEmployee
              onPress={() =>
                navigation.navigate('AdminWorkReportDetail', { reportId: item._id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  controlsBlock: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  kindTabsSlot: {
    minHeight: 48,
    justifyContent: 'center',
  },
  kindTabsPlaceholder: {
    height: 48,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    minHeight: 76,
  },
  listFlex: {
    flex: 1,
  },
  listLoader: {
    minHeight: 280,
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.semibold,
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
  center: {
    flex: 1,
    padding: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    flexGrow: 1,
  },
  listTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
});
