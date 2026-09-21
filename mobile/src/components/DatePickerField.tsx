import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import {
  buildYearOptions,
  dateInputToParts,
  formatDate,
  getDaysInMonth,
  getMonthLabel,
  partsToDateInput,
  toDateInputValue,
} from '../utils/dates';
import { AppButton } from './AppButton';

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
  containerStyle?: StyleProp<ViewStyle>;
}

function WheelColumn<T extends number | string>({
  title,
  items,
  selected,
  onSelect,
  formatItem,
}: {
  title: string;
  items: T[];
  selected: T;
  onSelect: (item: T) => void;
  formatItem?: (item: T) => string;
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnTitle}>{title}</Text>
      <ScrollView style={styles.wheel} showsVerticalScrollIndicator={false}>
        {items.map(item => {
          const isSelected = item === selected;
          const label = formatItem ? formatItem(item) : String(item);
          return (
            <Pressable
              key={String(item)}
              style={[styles.wheelItem, isSelected && styles.wheelItemActive]}
              onPress={() => onSelect(item)}>
              <Text style={[styles.wheelText, isSelected && styles.wheelTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function DatePickerField({
  label,
  value,
  onChange,
  disabled = false,
  variant = 'default',
  containerStyle,
}: DatePickerFieldProps) {
  const isCompact = variant === 'compact';
  const [visible, setVisible] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());

  const years = useMemo(() => buildYearOptions(3), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const days = useMemo(
    () => Array.from({ length: getDaysInMonth(year, month) }, (_, index) => index + 1),
    [year, month],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    const parts = dateInputToParts(value);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
  }, [visible, value]);

  useEffect(() => {
    const maxDay = getDaysInMonth(year, month);
    if (day > maxDay) {
      setDay(maxDay);
    }
  }, [day, month, year]);

  const openPicker = () => {
    if (disabled) {
      return;
    }
    setVisible(true);
  };

  const closePicker = () => {
    setVisible(false);
  };

  const confirmSelection = () => {
    onChange(partsToDateInput(year, month, day));
    closePicker();
  };

  const setToday = () => {
    onChange(toDateInputValue());
  };

  const isToday = value === toDateInputValue();

  return (
    <View style={[styles.wrap, isCompact && styles.wrapCompact, containerStyle]}>
      {!isCompact && label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <Pressable
          style={[
            styles.field,
            isCompact && styles.fieldCompact,
            disabled && styles.fieldDisabled,
          ]}
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`Select ${label}`}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={isCompact ? 18 : 20}
            color={theme.colors.primary}
          />
          <Text style={[styles.value, isCompact && styles.valueCompact]} numberOfLines={1}>
            {formatDate(value)}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>
        {!isToday ? (
          <Pressable
            style={[styles.todayButton, isCompact && styles.todayButtonCompact]}
            onPress={setToday}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Jump to today">
            {isCompact ? (
              <Text style={styles.todayTextCompact}>Today</Text>
            ) : (
              <Text style={styles.todayText}>Today</Text>
            )}
          </Pressable>
        ) : null}
      </View>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={closePicker}>
        <Pressable style={styles.overlay} onPress={closePicker}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Text style={styles.sheetSubtitle}>Select a date to view attendance</Text>

            <View style={styles.pickerRow}>
              <WheelColumn
                title="Month"
                items={months}
                selected={month}
                onSelect={setMonth}
                formatItem={item => getMonthLabel(item).slice(0, 3)}
              />
              <WheelColumn title="Day" items={days} selected={day} onSelect={setDay} />
              <WheelColumn title="Year" items={years} selected={year} onSelect={setYear} />
            </View>

            <Text style={styles.preview}>
              Selected: {formatDate(partsToDateInput(year, month, day))}
            </Text>

            <View style={styles.actions}>
              <AppButton
                title="Cancel"
                variant="outline"
                onPress={closePicker}
                style={styles.actionButton}
              />
              <AppButton title="Apply" onPress={confirmSelection} style={styles.actionButton} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.md,
  },
  wrapCompact: {
    marginBottom: 0,
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
  },
  fieldCompact: {
    backgroundColor: '#F8FAFC',
    borderColor: '#EEF2F6',
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minWidth: 0,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  value: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
  },
  valueCompact: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
  },
  todayButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  todayButtonCompact: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
  },
  todayText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
  todayTextCompact: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
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
  sheetTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  wheel: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  wheelItem: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  wheelItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  wheelText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
  wheelTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.bold,
  },
  preview: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
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
