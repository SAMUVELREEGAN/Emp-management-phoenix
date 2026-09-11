import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton, AppHeader, EmptyState, ErrorMessage, LoadingIndicator } from '../../components';
import { useQuickAccessBack } from '../../navigation/safeStackBack';
import { theme } from '../../constants/theme';
import { payrollApi } from '../../api/payrollApi';
import { onboardingApi } from '../../api/onboardingApi';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import type { SalaryRosterItem } from '../../types';
import type { PayrollStackParamList } from '../../navigation/types';

interface Props {
  embedded?: boolean;
}

export default function AdminSalaryRosterScreen({ embedded = false }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<PayrollStackParamList>>();
  const role = useAuthStore(state => state.user?.role);
  const { showBack, handleBack } = useQuickAccessBack({ moreHubFallback: !embedded });
  const [items, setItems] = useState<SalaryRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await payrollApi.salaryRoster();
      setItems(response.data.roster);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const shareWithAdmin = async () => {
    setSharing(true);
    try {
      const response = await onboardingApi.shareWithAdmin();
      Alert.alert('Shared', `Shared ${response.data.roster.length} salary records with admin.`);
      fetchData();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <LoadingIndicator fullScreen />;
  if (error) {
    return (
      <View style={styles.center}>
        <ErrorMessage message={error} onRetry={fetchData} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!embedded ? (
        <AppHeader
          title="Salary Roster"
          subtitle="Employee salary details shared by HR"
          showBack={showBack}
          onBack={showBack ? handleBack : undefined}
          rightAction={
            role === 'admin' ? (
              <Pressable
                onPress={() => navigation.navigate('PayrollPolicySettings')}
                hitSlop={8}>
                <MaterialCommunityIcons name="cog-outline" size={26} color={theme.colors.white} />
              </Pressable>
            ) : undefined
          }
        />
      ) : null}
      {role === 'hr' && embedded ? (
        <View style={styles.actions}>
          <AppButton title="Share Salary Roster with Admin" onPress={shareWithAdmin} loading={sharing} />
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={item => item.employeeId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.fullName}</Text>
            <Text style={styles.meta}>{item.department} • {item.employeeCode}</Text>
            <Text style={styles.salary}>INR {item.monthlySalary.toLocaleString()} / month</Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No shared salary roster"
            message={role === 'hr' ? 'Approve onboarding and share roster with admin.' : 'HR has not shared salary details yet.'}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  actions: { padding: theme.spacing.md, paddingBottom: 0 },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  title: { fontSize: theme.fonts.sizes.md, fontWeight: theme.fonts.weights.semibold, color: theme.colors.text },
  meta: { marginTop: 2, fontSize: theme.fonts.sizes.sm, color: theme.colors.textSecondary },
  salary: { marginTop: theme.spacing.sm, fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.bold, color: theme.colors.primary },
});
