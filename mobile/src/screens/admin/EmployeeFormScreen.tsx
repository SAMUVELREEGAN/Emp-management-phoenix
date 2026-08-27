import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppHeader, AppInput, ErrorMessage, LoadingIndicator } from '../../components';
import { UPLOADS_BASE_URL } from '../../constants/config';
import { theme } from '../../constants/theme';
import { employeeApi } from '../../api/employeeApi';
import { getErrorMessage } from '../../utils/errors';
import { toDateInputValue } from '../../utils/dates';
import { validateEmail, validatePassword, validatePhone, validateRequired } from '../../validations';
import type { User, UserRole } from '../../types';
import type { AdminEmployeesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AdminEmployeesStackParamList, 'EmployeeForm'>;

interface EmployeeFormValues {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  department: string;
  designation: string;
  joiningDate: string;
  address: string;
  accountType: Extract<UserRole, 'employee' | 'hr'>;
  isFieldEmployee: boolean;
}

export default function EmployeeFormScreen({ navigation, route }: Props) {
  const employeeId = route.params?.employeeId;
  const defaultRole = route.params?.defaultRole || 'employee';
  const isHrForm = !employeeId && defaultRole === 'hr';
  const [loading, setLoading] = useState(!!employeeId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; type?: string; name?: string } | undefined>();
  const [existingPhoto, setExistingPhoto] = useState<string | undefined>();

  const { control, handleSubmit, reset } = useForm<EmployeeFormValues>({
    defaultValues: {
      employeeId: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      department: '',
      designation: '',
      joiningDate: toDateInputValue(),
      address: '',
      accountType: defaultRole,
      isFieldEmployee: false,
    },
  });
  const accountType = useWatch({ control, name: 'accountType' });
  const showFieldSalesToggle = !isHrForm && accountType === 'employee';

  useEffect(() => {
    if (!employeeId) {
      return;
    }
    const loadEmployee = async () => {
      setLoading(true);
      try {
        const response = await employeeApi.getById(employeeId);
        const employee = response.data.employee;
        reset({
          employeeId: employee.employeeId,
          fullName: employee.fullName,
          email: employee.email,
          phone: employee.phone,
          password: '',
          department: employee.department,
          designation: employee.designation,
          joiningDate: toDateInputValue(employee.joiningDate),
          address: employee.address || '',
          accountType: employee.role === 'hr' ? 'hr' : 'employee',
          isFieldEmployee: employee.isFieldEmployee === true,
        });
        setExistingPhoto(employee.profilePhoto);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    loadEmployee();
  }, [employeeId, reset]);

  const pickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri) {
        setPhoto({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'profile.jpg',
        });
      }
    });
  };

  const onSubmit = async (values: EmployeeFormValues) => {
    setSubmitting(true);
    setError('');
    try {
      if (employeeId) {
        const payload: Record<string, string | boolean> = {
          employeeId: values.employeeId.trim(),
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          department: values.department.trim(),
          designation: values.designation.trim(),
          joiningDate: values.joiningDate,
          address: values.address.trim(),
          isFieldEmployee: values.isFieldEmployee,
        };
        if (values.password.trim()) {
          payload.password = values.password;
        }
        await employeeApi.update(employeeId, payload, photo);
      } else {
        await employeeApi.create(
          {
            employeeId: values.employeeId.trim(),
            fullName: values.fullName.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            password: values.password,
            department: values.department.trim(),
            designation: values.designation.trim(),
            joiningDate: values.joiningDate,
            address: values.address.trim(),
            role: values.accountType,
            isFieldEmployee: values.accountType === 'employee' && values.isFieldEmployee,
          },
          photo,
        );
      }
      Alert.alert(
        'Success',
        employeeId
          ? 'Account updated successfully'
          : values.accountType === 'hr'
            ? 'HR account created successfully'
            : 'Employee created successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const previewUri = photo?.uri || (existingPhoto ? `${UPLOADS_BASE_URL}${existingPhoto}` : undefined);

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader
          title={employeeId ? 'Edit Account' : isHrForm ? 'Add HR Account' : 'Add Employee'}
          showBack
          onBack={() => navigation.goBack()}
        />
        <LoadingIndicator fullScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={employeeId ? 'Edit Account' : isHrForm ? 'Add HR Account' : 'Add Employee'}
        showBack
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <ErrorMessage message={error} /> : null}

          <Pressable style={styles.photoPicker} onPress={pickPhoto}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.photo} />
            ) : (
              <MaterialCommunityIcons name="camera-plus" size={32} color={theme.colors.primary} />
            )}
            <Text style={styles.photoText}>Profile Photo (optional)</Text>
          </Pressable>

          {!employeeId && defaultRole !== 'hr' ? (
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>Account Type</Text>
              <View style={styles.roleRow}>
                <Controller
                  control={control}
                  name="accountType"
                  render={({ field: { onChange, value } }) => (
                    <>
                      <Pressable
                        style={[styles.roleChip, value === 'employee' && styles.roleChipActive]}
                        onPress={() => onChange('employee')}>
                        <Text
                          style={[
                            styles.roleChipText,
                            value === 'employee' && styles.roleChipTextActive,
                          ]}>
                          Employee
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[styles.roleChip, value === 'hr' && styles.roleChipActive]}
                        onPress={() => onChange('hr')}>
                        <Text
                          style={[styles.roleChipText, value === 'hr' && styles.roleChipTextActive]}>
                          HR
                        </Text>
                      </Pressable>
                    </>
                  )}
                />
              </View>
              <Text style={styles.roleHint}>
                HR accounts use the same first-login verification flow as employees.
              </Text>
            </View>
          ) : null}

          {!employeeId && defaultRole === 'hr' ? (
            <Text style={styles.hrCreateHint}>
              This HR account will require email/mobile verification on first login.
            </Text>
          ) : null}

          <Controller control={control} name="employeeId" rules={{ validate: v => validateRequired(v, 'Employee ID') }} render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput label="Employee ID" value={value} onChangeText={onChange} autoCapitalize="characters" error={fieldError?.message} />
          )} />
          <Controller control={control} name="fullName" rules={{ validate: v => validateRequired(v, 'Full name') }} render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput label="Full Name" value={value} onChangeText={onChange} error={fieldError?.message} />
          )} />
          <Controller control={control} name="email" rules={{ validate: validateEmail }} render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput label="Email" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" error={fieldError?.message} />
          )} />
          <Controller control={control} name="phone" rules={{ validate: validatePhone }} render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput label="Phone" value={value} onChangeText={onChange} keyboardType="phone-pad" error={fieldError?.message} />
          )} />
          {!employeeId ? (
            <Controller control={control} name="password" rules={{ validate: value => validatePassword(value) }} render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
              <AppInput label="Password" value={value} onChangeText={onChange} secureTextEntry error={fieldError?.message} />
            )} />
          ) : (
            <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
              <AppInput label="New Password (optional)" value={value} onChangeText={onChange} secureTextEntry />
            )} />
          )}
          <Controller control={control} name="department" rules={{ validate: v => validateRequired(v, 'Department') }} render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput label="Department" value={value} onChangeText={onChange} error={fieldError?.message} />
          )} />
          <Controller control={control} name="designation" rules={{ validate: v => validateRequired(v, 'Designation') }} render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput label="Designation" value={value} onChangeText={onChange} error={fieldError?.message} />
          )} />
          <Controller control={control} name="joiningDate" rules={{ validate: v => validateRequired(v, 'Joining date') }} render={({ field: { onChange, value }, fieldState: { error: fieldError } }) => (
            <AppInput label="Joining Date (YYYY-MM-DD)" value={value} onChangeText={onChange} error={fieldError?.message} />
          )} />
          <Controller control={control} name="address" render={({ field: { onChange, value } }) => (
            <AppInput label="Address" value={value} onChangeText={onChange} multiline numberOfLines={2} />
          )} />

          {showFieldSalesToggle ? (
            <Controller
              control={control}
              name="isFieldEmployee"
              render={({ field: { onChange, value } }) => (
                <View style={styles.fieldToggleCard}>
                  <View style={styles.fieldToggleTextWrap}>
                    <Text style={styles.fieldToggleTitle}>Field Sales Employee</Text>
                    <Text style={styles.fieldToggleHint}>
                      Enable live GPS route tracking for this employee. Only field employees are
                      tracked on the admin live map after check-in.
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                    thumbColor={value ? theme.colors.primary : theme.colors.white}
                  />
                </View>
              )}
            />
          ) : null}

          <AppButton
            title={employeeId ? 'Update Account' : isHrForm ? 'Create HR Account' : 'Create Employee'}
            onPress={handleSubmit(onSubmit)}
            loading={submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  photoPicker: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.white,
  },
  photo: { width: 80, height: 80, borderRadius: theme.radii.full },
  photoText: { marginTop: theme.spacing.sm, color: theme.colors.textSecondary, fontSize: theme.fonts.sizes.sm },
  roleSection: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  roleChip: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  roleChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  roleChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.weights.medium,
  },
  roleChipTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  roleHint: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  hrCreateHint: {
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  fieldToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fieldToggleTextWrap: {
    flex: 1,
  },
  fieldToggleTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  fieldToggleHint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
