import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DatePickerField } from './DatePickerField';
import { theme } from '../constants/theme';
import type { User } from '../types';

export type EmployeeFilterValue = 'all' | string;

interface EmployeeAttendanceFilterBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedEmployeeId: EmployeeFilterValue;
  onEmployeeChange: (employeeId: EmployeeFilterValue) => void;
  employees: User[];
  loadingEmployees?: boolean;
}

export function EmployeeAttendanceFilterBar({
  selectedDate,
  onDateChange,
  selectedEmployeeId,
  onEmployeeChange,
  employees,
  loadingEmployees = false,
}: EmployeeAttendanceFilterBarProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedEmployee = useMemo(
    () => employees.find(item => item._id === selectedEmployeeId),
    [employees, selectedEmployeeId],
  );

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return employees;
    }
    return employees.filter(
      item =>
        item.fullName.toLowerCase().includes(term) ||
        item.employeeId.toLowerCase().includes(term) ||
        item.department?.toLowerCase().includes(term),
    );
  }, [employees, search]);

  const employeeLabel =
    selectedEmployeeId === 'all'
      ? 'All employees'
      : selectedEmployee
        ? selectedEmployee.fullName
        : 'Employee';

  return (
    <View style={styles.shell}>
      <View style={styles.filterRow}>
        <DatePickerField
          label="Date"
          value={selectedDate}
          onChange={onDateChange}
          variant="compact"
        />

        <Pressable
          style={styles.employeeField}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Select employee">
          <MaterialCommunityIcons name="account-filter-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.employeeValue} numberOfLines={1}>
            {loadingEmployees ? 'Loading...' : employeeLabel}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select employee</Text>

            <View style={styles.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or ID..."
                placeholderTextColor={theme.colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <Pressable
              style={[styles.option, selectedEmployeeId === 'all' && styles.optionSelected]}
              onPress={() => {
                onEmployeeChange('all');
                setModalVisible(false);
                setSearch('');
              }}>
              <MaterialCommunityIcons name="account-group-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.optionText}>All employees</Text>
              {selectedEmployeeId === 'all' ? (
                <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
              ) : null}
            </Pressable>

            <FlatList
              data={filteredEmployees}
              keyExtractor={item => item._id}
              style={styles.optionList}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyText}>No employees match your search.</Text>
              }
              renderItem={({ item }) => {
                const selected = selectedEmployeeId === item._id;
                return (
                  <Pressable
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onEmployeeChange(item._id);
                      setModalVisible(false);
                      setSearch('');
                    }}>
                    <View style={styles.optionBody}>
                      <Text style={styles.optionName} numberOfLines={1}>{item.fullName}</Text>
                      <Text style={styles.optionMeta} numberOfLines={1}>
                        {item.employeeId} • {item.department}
                      </Text>
                    </View>
                    {selected ? (
                      <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />

            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  employeeField: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF2F6',
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  employeeValue: {
    flex: 1,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    maxHeight: '78%',
  },
  sheetTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: '#F8FAFC',
  },
  searchInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
  },
  optionList: {
    maxHeight: 320,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: theme.spacing.xs,
  },
  optionSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  optionBody: {
    flex: 1,
    minWidth: 0,
  },
  optionText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  optionName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  optionMeta: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    paddingVertical: theme.spacing.lg,
    fontSize: theme.fonts.sizes.sm,
  },
  closeButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  closeButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.primary,
  },
});
