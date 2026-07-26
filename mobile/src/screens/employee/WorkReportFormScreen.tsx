import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { AppButton, AppHeader, AppInput, ErrorMessage, LoadingIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { workReportApi } from '../../api/workReportApi';
import { getErrorMessage } from '../../utils/errors';
import { toDateInputValue } from '../../utils/dates';
import { validateRequired } from '../../validations';
import type { EmployeeReportsStackParamList } from '../../navigation/types';
import { useStackBackTo } from '../../navigation/safeStackBack';

type Props = NativeStackScreenProps<EmployeeReportsStackParamList, 'WorkReportForm'>;

interface WorkReportFormValues {
  reportDate: string;
  title: string;
  workSummary: string;
  completedTasks: string;
  pendingTasks: string;
  blockers: string;
  tomorrowPlan: string;
  workingHours: string;
}

export default function WorkReportFormScreen({ navigation, route }: Props) {
  const reportId = route.params?.reportId;
  const [loading, setLoading] = useState(!!reportId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string; type?: string; name?: string } | undefined>();

  const { handleBack, isLeaving } = useStackBackTo('WorkReportList');

  const { control, handleSubmit, reset } = useForm<WorkReportFormValues>({
    defaultValues: {
      reportDate: toDateInputValue(),
      title: '',
      workSummary: '',
      completedTasks: '',
      pendingTasks: '',
      blockers: '',
      tomorrowPlan: '',
      workingHours: '8',
    },
  });

  useEffect(() => {
    if (!reportId) {
      return;
    }
    const loadReport = async () => {
      setLoading(true);
      try {
        const response = await workReportApi.getById(reportId);
        const report = response.data.report;
        reset({
          reportDate: toDateInputValue(report.reportDate),
          title: report.title,
          workSummary: report.workSummary,
          completedTasks: report.completedTasks,
          pendingTasks: report.pendingTasks,
          blockers: report.blockers,
          tomorrowPlan: report.tomorrowPlan,
          workingHours: String(report.workingHours),
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadReport();
  }, [reportId, reset]);

  const pickAttachment = async () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri) {
        setAttachment({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'attachment.jpg',
        });
      }
    });
  };

  const saveReport = async (values: WorkReportFormValues, submit = false) => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        reportDate: values.reportDate,
        title: values.title.trim(),
        workSummary: values.workSummary.trim(),
        completedTasks: values.completedTasks.trim(),
        pendingTasks: values.pendingTasks.trim(),
        blockers: values.blockers.trim(),
        tomorrowPlan: values.tomorrowPlan.trim(),
        workingHours: Number(values.workingHours),
        status: submit ? ('submitted' as const) : ('draft' as const),
      };

      let savedId = reportId;
      if (reportId) {
        await workReportApi.update(reportId, payload, attachment);
      } else {
        const response = await workReportApi.create(payload, attachment);
        savedId = response.data.report._id;
      }

      if (submit && savedId) {
        await workReportApi.submit(savedId);
      }

      Alert.alert('Success', submit ? 'Report submitted successfully' : 'Report saved as draft', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isLeaving) {
    return (
      <View style={styles.container}>
        <AppHeader title={reportId ? 'Edit Report' : 'New Report'} showBack onBack={handleBack} />
        <LoadingIndicator fullScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={reportId ? 'Edit Report' : 'New Report'} showBack onBack={handleBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <ErrorMessage message={error} /> : null}

          <Controller
            control={control}
            name="reportDate"
            rules={{ validate: v => validateRequired(v, 'Report date') }}
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <AppInput label="Report Date (YYYY-MM-DD)" value={value} onChangeText={onChange} error={fieldError?.message} />
            )}
          />

          <Controller
            control={control}
            name="title"
            rules={{ validate: v => validateRequired(v, 'Title') }}
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <AppInput label="Title" value={value} onChangeText={onChange} error={fieldError?.message} />
            )}
          />

          <Controller
            control={control}
            name="workSummary"
            rules={{ validate: v => validateRequired(v, 'Work summary') }}
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <AppInput
                label="Work Summary"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
                style={styles.multiline}
                error={fieldError?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="completedTasks"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Completed Tasks" value={value} onChangeText={onChange} multiline numberOfLines={3} style={styles.multiline} />
            )}
          />

          <Controller
            control={control}
            name="pendingTasks"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Pending Tasks" value={value} onChangeText={onChange} multiline numberOfLines={3} style={styles.multiline} />
            )}
          />

          <Controller
            control={control}
            name="blockers"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Blockers" value={value} onChangeText={onChange} multiline numberOfLines={3} style={styles.multiline} />
            )}
          />

          <Controller
            control={control}
            name="tomorrowPlan"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Tomorrow Plan" value={value} onChangeText={onChange} multiline numberOfLines={3} style={styles.multiline} />
            )}
          />

          <Controller
            control={control}
            name="workingHours"
            rules={{
              validate: v => {
                const num = Number(v);
                if (Number.isNaN(num) || num < 0 || num > 24) {
                  return 'Working hours must be between 0 and 24';
                }
                return true;
              },
            }}
            render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <AppInput
                label="Working Hours"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                error={fieldError?.message}
              />
            )}
          />

          <Pressable style={styles.attachmentBtn} onPress={pickAttachment}>
            <Text style={styles.attachmentText}>
              {attachment ? 'Attachment selected' : 'Add Attachment (optional)'}
            </Text>
          </Pressable>

          <AppButton
            title="Save Draft"
            variant="outline"
            onPress={handleSubmit(values => saveReport(values, false))}
            loading={submitting}
            style={styles.button}
          />
          <AppButton
            title="Submit Report"
            onPress={handleSubmit(values => saveReport(values, true))}
            loading={submitting}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  attachmentBtn: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  attachmentText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  button: {
    marginBottom: theme.spacing.sm,
  },
});
