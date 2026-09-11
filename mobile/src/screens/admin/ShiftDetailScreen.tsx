import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { AppButton, AppHeader, ErrorMessage, LoadingIndicator, ShiftCard, StatusBadge } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { Shift } from '../../types';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';
import { formatWorkingDays } from '../../utils/shift';

export default function ShiftDetailScreen() {
  const route = useRoute<RouteProp<AdminShiftsStackParamList, 'ShiftDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AdminShiftsStackParamList>>();
  const { shiftId } = route.params;
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { handleBack } = useFabricSafeBack({
    routes: [{ name: 'ShiftList' }],
    index: 0,
    onBeforeBack: () => setShift(null),
  });

  const fetchShift = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await shiftApi.getById(shiftId);
      setShift(response.data.shift);
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

  const toggleActive = async () => {
    if (!shift) return;
    try {
      await shiftApi.update(shift._id, { isActive: !shift.isActive });
      fetchShift();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Shift Details" showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchShift} />
        </View>
      ) : shift ? (
        <ScrollView contentContainerStyle={styles.content}>
          <ShiftCard shift={shift} />
          <View style={styles.infoCard}>
            <Text style={styles.label}>Status</Text>
            <StatusBadge status={shift.isActive ? 'active' : 'inactive'} />
            <Text style={styles.label}>Working Days</Text>
            <Text style={styles.value}>{formatWorkingDays(shift.workingDays)}</Text>
            {shift.description ? (
              <>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.value}>{shift.description}</Text>
              </>
            ) : null}
          </View>
          <AppButton title="Assign Employees" onPress={() => navigation.navigate('ShiftAssignment', { shiftId })} />
          <AppButton title="Shift Attendance" variant="outline" onPress={() => navigation.navigate('ShiftAttendance', { shiftId, shiftName: shift.name })} />
          <AppButton title="Edit Shift" variant="outline" onPress={() => navigation.navigate('ShiftForm', { shiftId })} />
          <AppButton title={shift.isActive ? 'Deactivate Shift' : 'Activate Shift'} variant="danger" onPress={toggleActive} />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  label: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    marginBottom: 4,
  },
  value: { fontSize: theme.fonts.sizes.sm, color: theme.colors.text },
});
