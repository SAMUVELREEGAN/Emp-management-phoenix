import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import {
  formatDate,
  getMonthStartDateInput,
  getPreviousMonthRange,
  toDateInputValue,
} from '../utils/dates';
import { AppButton } from './AppButton';
import { DatePickerField } from './DatePickerField';
import { ErrorMessage } from './ErrorMessage';

interface AttendanceExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (fromDate: string, toDate: string) => Promise<void>;
}

export function AttendanceExportModal({
  visible,
  onClose,
  onExport,
}: AttendanceExportModalProps) {
  const [fromDate, setFromDate] = useState(getMonthStartDateInput());
  const [toDate, setToDate] = useState(toDateInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    setFromDate(getMonthStartDateInput());
    setToDate(toDateInputValue());
    setError('');
    setLoading(false);
  }, [visible]);

  const applyThisMonth = () => {
    setFromDate(getMonthStartDateInput());
    setToDate(toDateInputValue());
    setError('');
  };

  const applyLastMonth = () => {
    const range = getPreviousMonthRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    setError('');
  };

  const handleExport = async () => {
    if (fromDate > toDate) {
      setError('From date must be on or before to date.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onExport(fromDate, toDate);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export attendance report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
          <Text style={styles.title}>Export Attendance Report</Text>
          <Text style={styles.subtitle}>
            Choose a date range. The Excel file lists each employee with daily status, working
            hours, and totals. Sundays are weekly holidays and shown as "-".
          </Text>

          <View style={styles.presets}>
            <Pressable style={styles.presetChip} onPress={applyThisMonth}>
              <Text style={styles.presetText}>This Month</Text>
            </Pressable>
            <Pressable style={styles.presetChip} onPress={applyLastMonth}>
              <Text style={styles.presetText}>Last Month</Text>
            </Pressable>
          </View>

          <DatePickerField label="From Date" value={fromDate} onChange={setFromDate} />
          <DatePickerField label="To Date" value={toDate} onChange={setToDate} />

          <Text style={styles.preview}>
            Exporting {formatDate(fromDate)} to {formatDate(toDate)}
          </Text>

          {error ? <ErrorMessage message={error} /> : null}

          <View style={styles.actions}>
            <AppButton
              title="Cancel"
              variant="outline"
              onPress={onClose}
              disabled={loading}
              style={styles.actionButton}
            />
            <AppButton
              title="Export Excel"
              onPress={handleExport}
              loading={loading}
              style={styles.actionButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  presets: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  presetChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  presetText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
  preview: {
    textAlign: 'center',
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
