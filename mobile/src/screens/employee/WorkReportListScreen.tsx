import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppButton,
  AppHeader,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
  ReportKindTabs,
  WorkReportCard,
  type ReportKindTab,
} from '../../components';
import { theme } from '../../constants/theme';
import { workReportApi } from '../../api/workReportApi';
import { getErrorMessage } from '../../utils/errors';
import type { WorkReport } from '../../types';
import type { EmployeeReportsStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

export default function WorkReportListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<EmployeeReportsStackParamList>>();
  const route = useRoute<RouteProp<EmployeeReportsStackParamList, 'WorkReportList'>>();
  const [reportKind, setReportKind] = useState<ReportKindTab>(
    route.params?.reportKind === 'hourly' ? 'hourly' : 'daily',
  );
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    moreHubFallback: true,
    onBeforeBack: () => setReports([]),
  });

  const isHourly = reportKind === 'hourly';

  const fetchReports = useCallback(
    async (isRefresh = false, kind: ReportKindTab = reportKind) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const response = await workReportApi.myReports({
          page: 1,
          limit: 50,
          reportType: kind === 'hourly' ? 'hourly_work' : 'daily_work',
        });
        setReports(response.data.items);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [reportKind],
  );

  useFocusEffect(
    useCallback(() => {
      if (route.params?.reportKind) {
        setReportKind(route.params.reportKind);
      }
      fetchReports(false, route.params?.reportKind ?? reportKind);
    }, [fetchReports, reportKind, route.params?.reportKind]),
  );

  const handleKindChange = (kind: ReportKindTab) => {
    setReportKind(kind);
    setReports([]);
    void fetchReports(false, kind);
  };

  const openCreate = () => {
    if (isHourly) {
      navigation.navigate('HourlyReportForm', {
        periodEnd: new Date().toISOString(),
      });
      return;
    }
    navigation.navigate('WorkReportForm', {});
  };

  const showInitialLoader = (loading || isLeaving) && reports.length === 0 && !refreshing;

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Work Reports"
        subtitle={isHourly ? 'Hourly updates for Admin & HR' : 'Your daily work reports'}
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
        rightAction={
          <Pressable onPress={openCreate} hitSlop={8} style={styles.headerAction}>
            <MaterialCommunityIcons name="plus" size={28} color={theme.colors.text} />
          </Pressable>
        }
      />

      <ReportKindTabs value={reportKind} onChange={handleKindChange} />

      {isHourly ? (
        <View style={styles.hourlyAction}>
          <AppButton title="Submit Hourly Report" onPress={openCreate} />
        </View>
      ) : null}

      {isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchReports(true)} />
          }
          ListEmptyComponent={
            showInitialLoader ? (
              <LoadingIndicator />
            ) : error ? (
              <ErrorMessage message={error} onRetry={() => fetchReports()} />
            ) : (
              <EmptyState
                icon={isHourly ? 'clock-outline' : 'file-document-outline'}
                title={isHourly ? 'No hourly reports yet' : 'No daily reports yet'}
                message={
                  isHourly
                    ? 'Submit what you worked on each hour. You can also open this from reminders.'
                    : 'Create your first daily work report.'
                }
                actionLabel={isHourly ? 'Submit Hourly Report' : 'Create Daily Report'}
                onAction={openCreate}
              />
            )
          }
          renderItem={({ item }) => (
            <WorkReportCard
              report={item}
              onPress={() => navigation.navigate('WorkReportDetail', { reportId: item._id })}
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
    backgroundColor: theme.colors.surface,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourlyAction: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
});
