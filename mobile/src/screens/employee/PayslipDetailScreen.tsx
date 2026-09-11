import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Share from 'react-native-share';
import { AppButton, AppHeader, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { payrollApi } from '../../api/payrollApi';
import { getErrorMessage } from '../../utils/errors';
import type { Payslip } from '../../types';
import type { EmployeePayrollStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

export default function PayslipDetailScreen() {
  const route = useRoute<RouteProp<EmployeePayrollStackParamList, 'PayslipDetail'>>();
  const { payslipId } = route.params;
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'PayslipList' }], index: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await payrollApi.getPayslip(payslipId);
      setPayslip(response.data.payslip);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [payslipId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleDownload = async () => {
    try {
      const text = await payrollApi.downloadPayslip(payslipId);
      await Share.open({
        title: `Payslip ${payslip?.month}/${payslip?.year}`,
        message: text,
      });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Payslip Detail" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchData} />
        </View>
      ) : payslip ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{payslip.month}/{payslip.year}</Text>
            <StatusBadge status={payslip.status} />
            <Text style={styles.net}>Net Pay: INR {payslip.netPay.toLocaleString()}</Text>
          </View>

          <Section title="Working Days">
            <Row label="Total working days" value={payslip.workingDays.totalWorkingDays} />
            <Row label="Present days" value={payslip.workingDays.presentDays} />
            <Row label="Absent days" value={payslip.workingDays.absentDays} />
            <Row label="Leave days" value={payslip.workingDays.leaveDays} />
            <Row label="Payable days" value={payslip.workingDays.payableDays} />
          </Section>

          <Section title="Attendance">
            <Row label="Late days" value={payslip.attendanceSummary.lateDays} />
            <Row label="Late minutes" value={payslip.attendanceSummary.totalLateMinutes} />
            <Row label="Overtime minutes" value={payslip.attendanceSummary.overtimeMinutes} />
          </Section>

          <Section title="Earnings">
            {payslip.earnings.map(item => (
              <Row key={item.code} label={item.label} value={`INR ${item.amount.toLocaleString()}`} />
            ))}
          </Section>

          <Section title="Deductions">
            {payslip.deductions.length ? (
              payslip.deductions.map(item => (
                <Row key={item.code} label={item.label} value={`INR ${item.amount.toLocaleString()}`} />
              ))
            ) : (
              <Text style={styles.empty}>No deductions</Text>
            )}
          </Section>

          <View style={styles.card}>
            <Row label="Gross pay" value={`INR ${payslip.grossPay.toLocaleString()}`} />
            <Row label="Total deductions" value={`INR ${payslip.totalDeductions.toLocaleString()}`} />
            <Row label="Net pay" value={`INR ${payslip.netPay.toLocaleString()}`} bold />
          </View>

          <AppButton title="Download / Share Payslip" onPress={handleDownload} />
        </ScrollView>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string | number; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl, gap: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  title: { fontSize: theme.fonts.sizes.lg, fontWeight: theme.fonts.weights.bold, color: theme.colors.text },
  net: { marginTop: theme.spacing.sm, fontSize: theme.fonts.sizes.md, color: theme.colors.primary, fontWeight: theme.fonts.weights.semibold },
  sectionTitle: { fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.bold, marginBottom: theme.spacing.sm, color: theme.colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: theme.colors.textSecondary, fontSize: theme.fonts.sizes.sm },
  rowValue: { color: theme.colors.text, fontSize: theme.fonts.sizes.sm },
  bold: { fontWeight: theme.fonts.weights.bold },
  empty: { color: theme.colors.textMuted, fontSize: theme.fonts.sizes.sm },
});
