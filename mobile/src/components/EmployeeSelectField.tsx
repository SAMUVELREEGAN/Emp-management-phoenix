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
import { theme } from '../constants/theme';
import type { User } from '../types';

interface EmployeeSelectFieldProps {
  label?: string;
  employees: User[];
  value: string;
  onChange: (employeeId: string) => void;
  loading?: boolean;
  placeholder?: string;
}

function formatEmployeeLabel(employee: User): string {
  return `${employee.fullName} (${employee.employeeId})`;
}

export function EmployeeSelectField({
  label = 'Select Employee',
  employees,
  value,
  onChange,
  loading = false,
  placeholder = 'Choose an employee',
}: EmployeeSelectFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedEmployee = useMemo(
    () => employees.find(item => item._id === value),
    [employees, value],
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
        (item.department || '').toLowerCase().includes(term),
    );
  }, [employees, search]);

  const closeModal = () => {
    setModalVisible(false);
    setSearch('');
  };

  const displayValue = loading
    ? 'Loading employees...'
    : selectedEmployee
      ? formatEmployeeLabel(selectedEmployee)
      : placeholder;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[styles.trigger, value ? styles.triggerSelected : null]}
        onPress={() => !loading && setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <View style={styles.triggerIcon}>
          <MaterialCommunityIcons
            name="account-outline"
            size={20}
            color={value ? theme.colors.accent : theme.colors.textMuted}
          />
        </View>
        <Text
          style={[styles.triggerText, !value && !loading && styles.triggerPlaceholder]}
          numberOfLines={1}>
          {displayValue}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={22} color={theme.colors.textMuted} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Employee</Text>

            <View style={styles.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or ID..."
                placeholderTextColor={theme.colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filteredEmployees}
              keyExtractor={item => item._id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No employees match your search.</Text>
              }
              renderItem={({ item }) => {
                const selected = value === item._id;
                return (
                  <Pressable
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      onChange(item._id);
                      closeModal();
                    }}>
                    <View style={[styles.avatar, selected && styles.avatarSelected]}>
                      <Text style={[styles.avatarText, selected && styles.avatarTextSelected]}>
                        {item.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={styles.optionName} numberOfLines={1}>{item.fullName}</Text>
                      <Text style={styles.optionMeta} numberOfLines={1}>
                        {item.employeeId}
                        {item.department ? ` • ${item.department}` : ''}
                      </Text>
                    </View>
                    {selected ? (
                      <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />
                    ) : (
                      <MaterialCommunityIcons name="circle-outline" size={22} color={theme.colors.border} />
                    )}
                  </Pressable>
                );
              }}
            />

            <Pressable style={styles.closeBtn} onPress={closeModal}>
              <Text style={styles.closeBtnText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.card,
  },
  triggerSelected: {
    borderColor: 'rgba(255, 215, 0, 0.55)',
    backgroundColor: '#FFFCF5',
  },
  triggerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
  },
  triggerPlaceholder: {
    color: theme.colors.textMuted,
    fontWeight: theme.fonts.weights.medium,
  },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    maxHeight: '82%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
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
    paddingVertical: theme.spacing.sm + 4,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
  },
  list: {
    maxHeight: 360,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: theme.colors.primary,
  },
  avatarText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
  },
  avatarTextSelected: {
    color: theme.colors.accent,
  },
  optionBody: {
    flex: 1,
    minWidth: 0,
  },
  optionName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
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
    paddingVertical: theme.spacing.xl,
    fontSize: theme.fonts.sizes.sm,
  },
  closeBtn: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  closeBtnText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.textSecondary,
  },
});
