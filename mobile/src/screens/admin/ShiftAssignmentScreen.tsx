import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppHeader, AppInput, DatePickerField, ErrorMessage, LoadingIndicator } from '../../components';
import { theme } from '../../constants/theme';
import { employeeApi } from '../../api/employeeApi';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { User } from '../../types';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';
import { toDateInputValue } from '../../utils/shift';

export default function ShiftAssignmentScreen() {
  const route = useRoute<RouteProp<AdminShiftsStackParamList, 'ShiftAssignment'>>();
  const { shiftId } = route.params;
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'ShiftDetail', params: { shiftId } }], index: 0 });

  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState(toDateInputValue());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await employeeApi.list({ page: 1, limit: 200, role: 'employee' });
      setEmployees(response.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const toggleEmployee = (employeeId: string) => {
    setSelectedIds(current =>
      current.includes(employeeId) ? current.filter(id => id !== employeeId) : [...current, employeeId],
    );
  };

  const handleAssign = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Validation', 'Select at least one employee.');
      return;
    }

    setSaving(true);
    try {
      await shiftApi.assign({
        shiftId,
        employeeIds: selectedIds,
        effectiveFrom,
        notes: notes.trim(),
      });
      Alert.alert('Success', 'Shift assigned successfully', [{ text: 'OK', onPress: handleBack }]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Assign Shift" subtitle={`${selectedIds.length} selected`} showBack onBack={handleBack} />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchEmployees} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.form}>
            <DatePickerField label="Effective From" value={effectiveFrom} onChange={setEffectiveFrom} />
            <AppInput label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Optional assignment notes" />
          </ScrollView>
          <FlatList
            data={employees}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const selected = selectedIds.includes(item._id);
              return (
                <Pressable style={[styles.employeeRow, selected && styles.employeeRowSelected]} onPress={() => toggleEmployee(item._id)}>
                  <View style={styles.employeeText}>
                    <Text style={styles.employeeName}>{item.fullName}</Text>
                    <Text style={styles.employeeMeta}>{item.employeeId} · {item.department}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={selected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={24}
                    color={selected ? theme.colors.primary : theme.colors.textMuted}
                  />
                </Pressable>
              );
            }}
          />
          <View style={styles.footer}>
            <AppButton title="Assign Shift" onPress={handleAssign} loading={saving} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  form: { padding: theme.spacing.md, paddingBottom: 0 },
  list: { padding: theme.spacing.md, paddingBottom: 120 },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  employeeRowSelected: { borderWidth: 1, borderColor: theme.colors.primary },
  employeeText: { flex: 1 },
  employeeName: { fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.semibold, color: theme.colors.text },
  employeeMeta: { fontSize: theme.fonts.sizes.xs, color: theme.colors.textMuted, marginTop: 2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: theme.spacing.md, backgroundColor: theme.colors.surface },
});
