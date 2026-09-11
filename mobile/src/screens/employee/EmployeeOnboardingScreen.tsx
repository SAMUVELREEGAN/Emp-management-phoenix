import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { AppButton, AppHeader, AppInput, ErrorMessage, LoadingIndicator, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { onboardingApi } from '../../api/onboardingApi';
import { getErrorMessage } from '../../utils/errors';
import type { EmployeeOnboarding, OnboardingDocument } from '../../types';

const DOC_CATEGORIES = [
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'bank_proof', label: 'Bank Proof' },
  { value: 'education', label: 'Education Certificate' },
  { value: 'other', label: 'Other' },
] as const;

export default function EmployeeOnboardingScreen() {
  const [onboarding, setOnboarding] = useState<EmployeeOnboarding | null>(null);
  const [documents, setDocuments] = useState<OnboardingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [employeeNotes, setEmployeeNotes] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await onboardingApi.my();
      setOnboarding(response.data.onboarding);
      setDocuments(response.data.documents);
      if (response.data.onboarding) {
        setBankAccountNumber(response.data.onboarding.bankAccountNumber || '');
        setBankIfsc(response.data.onboarding.bankIfsc || '');
        setBankName(response.data.onboarding.bankName || '');
        setPanNumber(response.data.onboarding.panNumber || '');
        setEmployeeNotes(response.data.onboarding.employeeNotes || '');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const saveDetails = async () => {
    try {
      await onboardingApi.updateMy({
        bankAccountNumber,
        bankIfsc,
        bankName,
        panNumber,
        employeeNotes,
      });
      Alert.alert('Saved', 'Your onboarding details were saved.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const uploadDocument = async (category: string) => {
    const result = await launchImageLibrary({ mediaType: 'mixed', selectionLimit: 1 });
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      return;
    }
    try {
      await onboardingApi.uploadDocument(
        { uri: asset.uri, type: asset.type, name: asset.fileName },
        category,
        asset.fileName,
      );
      Alert.alert('Uploaded', 'Document uploaded successfully.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveDetails();
      await onboardingApi.submit();
      Alert.alert('Submitted', 'Your onboarding has been sent to HR for review.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = onboarding?.status !== 'approved';
  const canSubmit =
    canEdit && (onboarding?.status === 'pending_documents' || onboarding?.status === 'rejected');

  return (
    <View style={styles.container}>
      <AppHeader title="Employee Onboarding" subtitle="Submit documents and bank details" />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchData} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {onboarding ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Onboarding Status</Text>
              <StatusBadge status={onboarding.status} />
              <Text style={styles.meta}>
                Proposed salary: INR {onboarding.proposedMonthlySalary?.toLocaleString() || 0}
              </Text>
              {onboarding.hrNotes ? <Text style={styles.meta}>HR note: {onboarding.hrNotes}</Text> : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bank & Tax Details</Text>
            <AppInput label="Bank Account Number" value={bankAccountNumber} onChangeText={setBankAccountNumber} editable={canEdit} />
            <AppInput label="IFSC Code" value={bankIfsc} onChangeText={setBankIfsc} editable={canEdit} />
            <AppInput label="Bank Name" value={bankName} onChangeText={setBankName} editable={canEdit} />
            <AppInput label="PAN Number" value={panNumber} onChangeText={setPanNumber} editable={canEdit} />
            <AppInput label="Notes for HR" value={employeeNotes} onChangeText={setEmployeeNotes} multiline editable={canEdit} />
            {canEdit ? <AppButton title="Save Details" onPress={saveDetails} variant="outline" /> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upload Documents</Text>
            {DOC_CATEGORIES.map(item => (
              <AppButton
                key={item.value}
                title={`Upload ${item.label}`}
                variant="outline"
                onPress={() => uploadDocument(item.value)}
                style={styles.docButton}
                disabled={!canEdit}
              />
            ))}
            {documents.length ? (
              <View style={styles.docList}>
                {documents.map(doc => (
                  <View key={doc._id} style={styles.docRow}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <StatusBadge status={doc.status} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>No documents uploaded yet.</Text>
            )}
          </View>

          {canSubmit ? (
            <AppButton title="Submit to HR" onPress={handleSubmit} loading={submitting} />
          ) : null}
        </ScrollView>
      )}
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
  cardTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  meta: { marginTop: theme.spacing.xs, fontSize: theme.fonts.sizes.sm, color: theme.colors.textSecondary },
  docButton: { marginBottom: theme.spacing.sm },
  docList: { marginTop: theme.spacing.sm, gap: theme.spacing.sm },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docTitle: { flex: 1, fontSize: theme.fonts.sizes.sm, color: theme.colors.text },
  empty: { fontSize: theme.fonts.sizes.sm, color: theme.colors.textMuted },
});
