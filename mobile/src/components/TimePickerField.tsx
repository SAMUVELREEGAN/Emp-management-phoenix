import React, { useEffect, useState } from 'react';
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
  formatOfficeTime12Hour,
  partsToTimeString,
  timeStringToParts,
  type TimePeriod,
} from '../utils/dates';
import { AppButton } from './AppButton';

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const PERIODS: TimePeriod[] = ['AM', 'PM'];

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: 'default' | 'surface';
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

export function TimePickerField({
  label,
  value,
  onChange,
  disabled = false,
  containerStyle,
  variant = 'default',
}: TimePickerFieldProps) {
  const [visible, setVisible] = useState(false);
  const [hour12, setHour12] = useState(9);
  const [minute, setMinute] = useState(30);
  const [period, setPeriod] = useState<TimePeriod>('AM');

  useEffect(() => {
    if (!visible) {
      return;
    }
    const parts = timeStringToParts(value);
    setHour12(parts.hour12);
    setMinute(parts.minute);
    setPeriod(parts.period);
  }, [visible, value]);

  useEffect(() => {
    return () => {
      setVisible(false);
    };
  }, []);

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
    onChange(partsToTimeString(hour12, minute, period));
    closePicker();
  };

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[
          styles.field,
          variant === 'surface' && styles.fieldSurface,
          disabled && styles.fieldDisabled,
        ]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}>
        <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.value}>{formatOfficeTime12Hour(value)}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textMuted} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
        statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={closePicker}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Text style={styles.sheetSubtitle}>Select time in 12-hour format</Text>

            <View style={styles.pickerRow}>
              <WheelColumn
                title="Hour"
                items={HOURS}
                selected={hour12}
                onSelect={setHour12}
              />
              <WheelColumn
                title="Minute"
                items={MINUTES}
                selected={minute}
                onSelect={setMinute}
                formatItem={item => String(item).padStart(2, '0')}
              />
              <WheelColumn
                title="Period"
                items={PERIODS}
                selected={period}
                onSelect={setPeriod}
              />
            </View>

            <Text style={styles.preview}>
              Selected: {formatOfficeTime12Hour(partsToTimeString(hour12, minute, period))}
            </Text>

            <View style={styles.actions}>
              <AppButton title="Cancel" variant="outline" onPress={closePicker} style={styles.actionButton} />
              <AppButton title="Done" onPress={confirmSelection} style={styles.actionButton} />
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
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  field: {
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
  fieldSurface: {
    backgroundColor: '#F8FAFC',
    borderColor: '#EEF2F6',
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.md,
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
