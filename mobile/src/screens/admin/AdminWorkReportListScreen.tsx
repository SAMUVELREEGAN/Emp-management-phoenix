import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  StaffRoleTabs,
  WorkReportCard,
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
      setFilter('submitted');
    },
  });

  const fetchReports = useCallback(
    async (
      isRefresh = false,
      statusFilter = filter,
      roleTab: StaffRoleTab = staffTab,
    ) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const response = await workReportApi.list({
          page: 1,
          limit: 50,
          status: statusFilter,
          role: roleTab,
        });
        setReports(response.data.items);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, staffTab],
  );

  useEffect(() => {
    fetchReports(false, filter, staffTab);
  }, [staffTab, fetchReports, filter]);

  useFocusEffect(
    useCallback(() => {
      fetchReports(false, filter, staffTab);
    }, [fetchReports, filter, staffTab]),
  );

  const tabLabel = staffTab === 'employee' ? 'Employee' : 'HR';

  return (
    <View style={styles.container} collapsable={false}>
      {!embedded ? (
        <AppHeader
          title="Work Reports"
          subtitle={`Review ${tabLabel.toLowerCase()} daily work reports`}
          showBack={showBack}
          onBack={showBack ? handleBack : undefined}
        />
      ) : null}

      {isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : (
        <>
          {!embedded && !fixedRole ? (
            <StaffRoleTabs value={staffTab} onChange={setStaffTab} />
          ) : null}

          <View style={styles.filters} collapsable={false}>
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

          {loading ? (
            <LoadingIndicator fullScreen />
          ) : error ? (
            <View style={styles.center}>
              <ErrorMessage message={error} onRetry={() => fetchReports()} />
            </View>
          ) : (
            <FlatList
              data={reports}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.list}
              removeClippedSubviews={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(true)} />
              }
              ListHeaderComponent={
                <Text style={styles.listTitle}>{tabLabel} Reports</Text>
              }
              ListEmptyComponent={
                <EmptyState
                  icon="file-search-outline"
                  title={`No ${tabLabel.toLowerCase()} reports found`}
                  message={
                    staffTab === 'hr'
                      ? 'HR attendance summary reports will appear here when submitted.'
                      : 'Try changing the status filter or check back later.'
                  }
                />
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  center: { flex: 1, padding: theme.spacing.md },
  list: { padding: theme.spacing.md, flexGrow: 1 },
  listTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
});
