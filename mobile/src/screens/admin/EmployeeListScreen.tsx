import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppHeader,
  AppInput,
  EmployeeCard,
  EmptyState,
  ErrorMessage,
  LoadingIndicator,
} from '../../components';
import { theme } from '../../constants/theme';
import { employeeApi } from '../../api/employeeApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { canManageStaff } from '../../utils/roles';
import type { User } from '../../types';
import type { AdminEmployeesStackParamList, HrEmployeesStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

type ListMode = 'employee' | 'hr';

export default function EmployeeListScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AdminEmployeesStackParamList | HrEmployeesStackParamList>
    >();
  const userRole = useAuthStore(state => state.user?.role);
  const isAdmin = canManageStaff(userRole);
  const [listMode, setListMode] = useState<ListMode>('employee');
  const [employees, setEmployees] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    onBeforeBack: () => setEmployees([]),
  });

  const activeRole: ListMode = isAdmin ? listMode : 'employee';

  const fetchEmployees = useCallback(
    async (isRefresh = false, searchTerm = search) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const response = await employeeApi.list({
          page: 1,
          limit: 50,
          search: searchTerm.trim() || undefined,
          role: activeRole,
        });
        setEmployees(response.data.items);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeRole, search],
  );

  useEffect(() => {
    fetchEmployees();
  }, [activeRole, fetchEmployees]);

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [fetchEmployees]),
  );

  const title = activeRole === 'hr' ? 'HR Staff' : 'Employees';
  const subtitle =
    activeRole === 'hr' ? 'Manage HR accounts' : isAdmin ? 'Manage team members' : 'View team members';
  const addLabel = activeRole === 'hr' ? 'Add HR' : 'Add Employee';

  const openCreateForm = () => {
    if (!isAdmin) {
      return;
    }
    (navigation as NativeStackNavigationProp<AdminEmployeesStackParamList>).navigate(
      'EmployeeForm',
      { defaultRole: activeRole },
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
        rightAction={
          isAdmin ? (
            <Pressable onPress={openCreateForm} hitSlop={8}>
              <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
            </Pressable>
          ) : undefined
        }
      />

      {isAdmin ? (
        <View style={styles.segmentShell}>
          <View style={styles.segmentRow}>
            <Pressable
              style={[styles.segment, listMode === 'employee' && styles.segmentActive]}
              onPress={() => setListMode('employee')}>
              <Text style={[styles.segmentText, listMode === 'employee' && styles.segmentTextActive]}>
                Employees
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, listMode === 'hr' && styles.segmentActive]}
              onPress={() => setListMode('hr')}>
              <Text style={[styles.segmentText, listMode === 'hr' && styles.segmentTextActive]}>
                HR Staff
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.searchWrap}>
        <AppInput
          label=""
          placeholder={activeRole === 'hr' ? 'Search HR staff...' : 'Search employees...'}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchEmployees(false, search)}
          returnKeyType="search"
          style={styles.searchInput}
          leadingIcon={
            <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.textMuted} />
          }
        />
      </View>

      {loading || isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchEmployees()} />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchEmployees(true)} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="account-search-outline"
              title={activeRole === 'hr' ? 'No HR staff found' : 'No employees found'}
              message={
                isAdmin
                  ? `Try a different search or add a new ${activeRole === 'hr' ? 'HR account' : 'employee'}.`
                  : 'Try a different search.'
              }
              actionLabel={isAdmin ? addLabel : undefined}
              onAction={isAdmin ? openCreateForm : undefined}
            />
          }
          renderItem={({ item }) => (
            <EmployeeCard
              employee={item}
              onPress={() => navigation.navigate('EmployeeDetail', { employeeId: item._id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  segmentShell: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  segment: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.semibold,
  },
  segmentTextActive: {
    color: theme.colors.text,
    fontWeight: theme.fonts.weights.bold,
  },
  searchWrap: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  searchInput: {
    marginBottom: 0,
  },
  listSeparator: {
    height: theme.spacing.xs,
  },
  center: {
    flex: 1,
    padding: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
});
