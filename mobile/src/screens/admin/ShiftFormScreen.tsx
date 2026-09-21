import React, { useCallback, useState } from 'react';
import {
  Alert,
  BackHandler,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  AppButton,
  AppHeader,
  AppInput,
  ErrorMessage,
  LoadingIndicator,
  TimePickerField,
} from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { WEEKDAY_OPTIONS } from '../../utils/shift';

const SHIFT_COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export default function ShiftFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminShiftsStackParamList>>();
  const route = useRoute<RouteProp<AdminShiftsStackParamList, 'ShiftForm'>>();
  const shiftId = route.params?.shiftId;

  const [loading, setLoading] = useState(Boolean(shiftId));
  const [isLeaving, setIsLeaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('18:00');
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [graceMinutes, setGraceMinutes] = useState('10');
  const [breakDurationMinutes, setBreakDurationMinutes] = useState('60');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(SHIFT_COLORS[0]);

  const fetchShift = useCallback(async () => {
    if (!shiftId) return;
    setLoading(true);
    setError('');
    try {
      const response = await shiftApi.getById(shiftId);
      const shift = response.data.shift;
      setName(shift.name);
      setCode(shift.code);
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
      setWorkingDays(shift.workingDays);
      setGraceMinutes(String(shift.graceMinutes));
      setBreakDurationMinutes(String(shift.breakDurationMinutes));
      setDescription(shift.description || '');
      setColor(shift.color || SHIFT_COLORS[0]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  useFocusEffect(
    useCallback(() => {
      fetchShift();
    }, [fetchShift]),
  );

  const handleBack = useCallback(() => {
    if (isLeaving) {
      return;
    }
    setIsLeaving(true);
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate(shiftId ? 'ShiftDetail' : 'ShiftList', shiftId ? { shiftId } : undefined);
          }
        }, 120);
      });
    });
  }, [isLeaving, navigation, shiftId]);

  useFocusEffect(
    useCallback(() => {
      setIsLeaving(false);
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );

  const toggleDay = (day: number) => {
    setWorkingDays(current =>
      current.includes(day) ? current.filter(item => item !== day) : [...current, day].sort(),
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !code.trim() || workingDays.length === 0) {
      Alert.alert('Validation', 'Please fill all required fields and select working days.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        startTime,
        endTime,
        workingDays,
        graceMinutes: Number(graceMinutes) || 0,
        breakDurationMinutes: Number(breakDurationMinutes) || 0,
        description: description.trim(),
        color,
      };

      if (shiftId) {
        await shiftApi.update(shiftId, payload);
      } else {
        await shiftApi.create(payload);
      }

      Alert.alert('Success', shiftId ? 'Shift updated successfully' : 'Shift created successfully', [
        { text: 'OK', onPress: handleBack },
      ]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader title={shiftId ? 'Edit Shift' : 'Create Shift'} showBack onBack={handleBack} />
      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchShift} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
              <AppInput label="Shift Name" value={name} onChangeText={setName} placeholder="Morning Shift" />
              <AppInput
                label="Shift Code"
                value={code}
                onChangeText={setCode}
                placeholder="MORNING"
                autoCapitalize="characters"
              />
              <TimePickerField label="Start Time" value={startTime} onChange={setStartTime} variant="surface" />
              <TimePickerField label="End Time" value={endTime} onChange={setEndTime} variant="surface" />
              <Text style={styles.sectionLabel}>Working Days</Text>
              <View style={styles.dayRow}>
                {WEEKDAY_OPTIONS.map(option => {
                  const selected = workingDays.includes(option.value);
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.dayChip, selected && styles.dayChipSelected]}
                      onPress={() => toggleDay(option.value)}>
                      <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <AppInput
                label="Grace Minutes"
                value={graceMinutes}
                onChangeText={setGraceMinutes}
                keyboardType="number-pad"
              />
              <AppInput
                label="Break Duration (minutes)"
                value={breakDurationMinutes}
                onChangeText={setBreakDurationMinutes}
                keyboardType="number-pad"
              />
              <AppInput label="Description" value={description} onChangeText={setDescription} multiline />
              <Text style={styles.sectionLabel}>Color Tag</Text>
              <View style={styles.colorRow}>
                {SHIFT_COLORS.map(item => (
                  <Pressable
                    key={item}
                    style={[
                      styles.colorChip,
                      { backgroundColor: item },
                      color === item && styles.colorChipSelected,
                    ]}
                    onPress={() => setColor(item)}
                  />
                ))}
              </View>
            </View>
            <AppButton
              title={shiftId ? 'Update Shift' : 'Create Shift'}
              onPress={handleSave}
              loading={saving}
              style={styles.submitBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  sectionLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  dayChip: {
    minWidth: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radii.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  dayChipText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.semibold,
    fontSize: theme.fonts.sizes.sm,
  },
  dayChipTextSelected: {
    color: theme.colors.primary,
  },
  colorRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  colorChip: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipSelected: {
    borderColor: theme.colors.accent,
    borderWidth: 3,
  },
  submitBtn: {
    marginTop: theme.spacing.xs,
  },
});
