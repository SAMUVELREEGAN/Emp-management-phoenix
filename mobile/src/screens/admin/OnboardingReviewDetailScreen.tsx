import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { AppButton, AppHeader, AppInput, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { UPLOADS_BASE_URL } from '../../constants/config';
import { theme } from '../../constants/theme';
import { onboardingApi } from '../../api/onboardingApi';
import { getErrorMessage } from '../../utils/errors';
import type { EmployeeOnboarding, OnboardingDocument, UserSummary } from '../../types';
import type { PayrollStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

export default function OnboardingReviewDetailScreen() {
  const route = useRoute<RouteProp<PayrollStackParamList, 'OnboardingReviewDetail'>>();
  const { employeeId } = route.params;
  const [onboarding, setOnboarding] = useState<EmployeeOnboarding | null>(null);
  const [documents, setDocuments] = useState<OnboardingDocument[]>([]);
  const [salary, setSalary] = useState('');
  const [hrNotes, setHrNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'HrPayrollHub' }], index: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await onboardingApi.getByEmployee(employeeId);
      setOnboarding(response.data.onboarding);
      setDocuments(response.data.documents);
      setSalary(
        String(
          response.data.onboarding.approvedMonthlySalary ||
            response.data.onboarding.proposedMonthlySalary ||
            '',
        ),
      );
      setHrNotes(response.data.onboarding.hrNotes || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const employee =
    onboarding && typeof onboarding.employee === 'object'
      ? (onboarding.employee as UserSummary)
      : null;

  const review = async (status: 'approved' | 'rejected' | 'hr_review') => {
    setSubmitting(true);
    try {
      await onboardingApi.review(employeeId, {
        status,
        approvedMonthlySalary: Number(salary),
        hrNotes,
      });
      Alert.alert('Updated', `Onboarding marked as ${status}.`);
      fetchData();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const updateSalary = async () => {
    setSubmitting(true);
    try {
      await onboardingApi.updateSalary(employeeId, Number(salary), hrNotes);
      Alert.alert('Saved', 'Salary updated.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Onboarding Review" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchData} />
        </View>
      ) : onboarding ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{employee?.fullName}</Text>
            <Text style={styles.meta}>{employee?.department} • {employee?.designation}</Text>
            <StatusBadge status={onboarding.status} />
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Bank Details</Text>
            <Text style={styles.meta}>Account: {onboarding.bankAccountNumber || '-'}</Text>
            <Text style={styles.meta}>IFSC: {onboarding.bankIfsc || '-'}</Text>
            <Text style={styles.meta}>Bank: {onboarding.bankName || '-'}</Text>
            <Text style={styles.meta}>PAN: {onboarding.panNumber || '-'}</Text>
            {onboarding.employeeNotes ? <Text style={styles.meta}>Employee note: {onboarding.employeeNotes}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Documents</Text>
            {documents.map(doc => (
              <Text key={doc._id} style={styles.meta}>
                {doc.title} ({doc.category}) - {UPLOADS_BASE_URL}{doc.fileUrl}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <AppInput label="Monthly Salary (INR)" value={salary} onChangeText={setSalary} keyboardType="numeric" />
            <AppInput label="HR Notes" value={hrNotes} onChangeText={setHrNotes} multiline />
            <AppButton title="Save Salary" variant="outline" onPress={updateSalary} loading={submitting} />
          </View>

          <AppButton title="Approve Onboarding" onPress={() => review('approved')} loading={submitting} />
          <AppButton title="Request Changes" variant="outline" onPress={() => review('rejected')} loading={submitting} />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.radii.lg, padding: theme.spacing.md, ...theme.shadows.card },
  title: { fontSize: theme.fonts.sizes.lg, fontWeight: theme.fonts.weights.bold, color: theme.colors.text },
  section: { fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.bold, marginBottom: theme.spacing.sm, color: theme.colors.text },
  meta: { fontSize: theme.fonts.sizes.sm, color: theme.colors.textSecondary, marginTop: 4 },
});
