import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  AppButton,
  AppHeader,
  ConfirmationModal,
  ErrorMessage,
  LoadingIndicator,
  StatusBadge,
} from '../../components';
import { UPLOADS_BASE_URL } from '../../constants/config';
import { theme } from '../../constants/theme';
import { employeeApi } from '../../api/employeeApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { canManageStaff } from '../../utils/roles';
import { formatDate } from '../../utils/dates';
import type { User, UserStatus } from '../../types';
import type { AdminEmployeesStackParamList, HrEmployeesStackParamList } from '../../navigation/types';

export default function EmployeeDetailScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AdminEmployeesStackParamList | HrEmployeesStackParamList>
    >();
  const userRole = useAuthStore(state => state.user?.role);
  const canManage = canManageStaff(userRole);
  const route = useRoute<RouteProp<AdminEmployeesStackParamList, 'EmployeeDetail'>>();
  const { employeeId } = route.params;

  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [nextStatus, setNextStatus] = useState<UserStatus>('inactive');
  const [deleting, setDeleting] = useState(false);

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await employeeApi.getById(employeeId);
      setEmployee(response.data.employee);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useFocusEffect(
    useCallback(() => {
      fetchEmployee();
    }, [fetchEmployee]),
  );

  const handleStatusChange = (status: UserStatus) => {
    setNextStatus(status);
    setConfirmVisible(true);
  };

  const confirmStatusChange = async () => {
    setUpdating(true);
    try {
      const response = await employeeApi.updateStatus(employeeId, nextStatus);
      setEmployee(response.data.employee);
      Alert.alert('Success', `Employee ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setUpdating(false);
      setConfirmVisible(false);
    }
  };

  const accountLabel = employee?.role === 'hr' ? 'HR account' : 'employee';
  const accountLabelTitle = employee?.role === 'hr' ? 'HR Account' : 'Employee';

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await employeeApi.delete(employeeId);
      Alert.alert('Success', `${accountLabelTitle} deleted successfully`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setDeleting(false);
      setDeleteConfirmVisible(false);
    }
  };

  const photoUri = employee?.profilePhoto
    ? `${UPLOADS_BASE_URL}${employee.profilePhoto}`
    : undefined;

  return (
    <View style={styles.container}>
      <AppHeader
        title={employee?.role === 'hr' ? 'HR Details' : 'Employee Details'}
        showBack
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={fetchEmployee} />
        </View>
      ) : employee ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileCard}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={48} color={theme.colors.primary} />
              </View>
            )}
            <Text style={styles.name}>{employee.fullName}</Text>
            <StatusBadge status={employee.status} />
          </View>

          <InfoRow label="Role" value={employee.role === 'hr' ? 'HR Manager' : 'Employee'} />
          <InfoRow label="Employee ID" value={employee.employeeId} />
          <InfoRow label="Email" value={employee.email} />
          <InfoRow label="Phone" value={employee.phone} />
          <InfoRow label="Department" value={employee.department} />
          <InfoRow label="Designation" value={employee.designation} />
          <InfoRow label="Joining Date" value={formatDate(employee.joiningDate)} />
          {employee.address ? <InfoRow label="Address" value={employee.address} /> : null}

          {canManage ? (
            <>
              <AppButton
                title="Edit Account"
                variant="outline"
                onPress={() =>
                  (navigation as NativeStackNavigationProp<AdminEmployeesStackParamList>).navigate(
                    'EmployeeForm',
                    { employeeId },
                  )
                }
                style={styles.button}
              />
              {employee.role === 'employee' || employee.role === 'hr' ? (
                employee.status === 'active' ? (
                  <AppButton
                    title={`Deactivate ${accountLabelTitle}`}
                    variant="danger"
                    onPress={() => handleStatusChange('inactive')}
                    style={styles.button}
                  />
                ) : (
                  <AppButton
                    title={`Activate ${accountLabelTitle}`}
                    onPress={() => handleStatusChange('active')}
                    style={styles.button}
                  />
                )
              ) : null}
              {employee.role === 'employee' || employee.role === 'hr' ? (
                <AppButton
                  title={`Delete ${accountLabelTitle}`}
                  variant="danger"
                  onPress={() => setDeleteConfirmVisible(true)}
                  style={styles.button}
                />
              ) : null}
            </>
          ) : null}
        </ScrollView>
      ) : null}

      <ConfirmationModal
        inline
        visible={confirmVisible}
        title={nextStatus === 'active' ? `Activate ${accountLabelTitle}` : `Deactivate ${accountLabelTitle}`}
        message={`Are you sure you want to ${nextStatus === 'active' ? 'activate' : 'deactivate'} this ${accountLabel}?`}
        confirmLabel="Confirm"
        destructive={nextStatus === 'inactive'}
        loading={updating}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmVisible(false)}
      />

      <ConfirmationModal
        inline
        visible={deleteConfirmVisible}
        title={`Delete ${accountLabelTitle}`}
        message={`This will permanently delete this ${accountLabel} and related attendance, tasks, leave, and route data. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, padding: theme.spacing.md },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  avatar: { width: 96, height: 96, borderRadius: theme.radii.full },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: { fontSize: theme.fonts.sizes.xs, color: theme.colors.textMuted },
  infoValue: { fontSize: theme.fonts.sizes.sm, color: theme.colors.text, marginTop: 2 },
  button: { marginTop: theme.spacing.sm },
});
