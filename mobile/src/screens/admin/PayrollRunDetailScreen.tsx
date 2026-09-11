import React, { useCallback, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { AppButton, AppHeader, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { payrollApi } from '../../api/payrollApi';
import { getErrorMessage } from '../../utils/errors';
import type { PayrollRun, Payslip, UserSummary } from '../../types';
import type { PayrollStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

export default function PayrollRunDetailScreen() {
  const route = useRoute<RouteProp<PayrollStackParamList, 'PayrollRunDetail'>>();
  const { runId } = route.params;
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'HrPayrollHub' }], index: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await payrollApi.getRun(runId);
      setRun(response.data.run);
      setPayslips(response.data.payslips);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const generate = async () => {
    setWorking(true);
    try {
      const response = await payrollApi.generateRun(runId);
      Alert.alert('Generated', `Calculated payslips for ${response.data.employeeCount} employees.`);
      fetchData();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const finalize = async () => {
    setWorking(true);
    try {
      await payrollApi.finalizeRun(runId);
      Alert.alert('Finalized', 'Payslips published to employees.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Payroll Run" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchData} />
        </View>
      ) : run ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{run.month}/{run.year}</Text>
            <StatusBadge status={run.status} />
            <Text style={styles.meta}>Employees: {run.employeeCount}</Text>
            <Text style={styles.meta}>Gross: INR {run.totalGross.toLocaleString()}</Text>
            <Text style={styles.meta}>Deductions: INR {run.totalDeductions.toLocaleString()}</Text>
            <Text style={styles.meta}>Net: INR {run.totalNet.toLocaleString()}</Text>
          </View>

          {run.status === 'draft' ? (
            <>
              <AppButton title="Generate Payslips" onPress={generate} loading={working} />
              <AppButton title="Finalize & Publish" variant="outline" onPress={finalize} loading={working} />
            </>
          ) : null}

          <Text style={styles.section}>Employee Payslips</Text>
          <FlatList
            data={payslips}
            keyExtractor={item => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const employee = typeof item.employee === 'object' ? (item.employee as UserSummary) : null;
              return (
                <View style={styles.payslipRow}>
                  <Text style={styles.payslipName}>{employee?.fullName || 'Employee'}</Text>
                  <Text style={styles.payslipNet}>INR {item.netPay.toLocaleString()}</Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>Generate payslips to see calculations.</Text>}
          />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.radii.lg, padding: theme.spacing.md, marginBottom: theme.spacing.md, ...theme.shadows.card },
  title: { fontSize: theme.fonts.sizes.lg, fontWeight: theme.fonts.weights.bold, color: theme.colors.text },
  meta: { marginTop: 4, fontSize: theme.fonts.sizes.sm, color: theme.colors.textSecondary },
  section: { marginTop: theme.spacing.md, marginBottom: theme.spacing.sm, fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.bold, color: theme.colors.text },
  payslipRow: { backgroundColor: theme.colors.white, borderRadius: theme.radii.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, flexDirection: 'row', justifyContent: 'space-between' },
  payslipName: { fontSize: theme.fonts.sizes.sm, color: theme.colors.text },
  payslipNet: { fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.semibold, color: theme.colors.primary },
  empty: { color: theme.colors.textMuted, fontSize: theme.fonts.sizes.sm },
});
