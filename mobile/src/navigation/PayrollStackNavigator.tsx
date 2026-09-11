import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PayrollStackParamList } from './types';
import HrPayrollHubScreen from '../screens/hr/HrPayrollHubScreen';
import PayrollRunListScreen from '../screens/admin/PayrollRunListScreen';
import OnboardingReviewListScreen from '../screens/admin/OnboardingReviewListScreen';
import OnboardingReviewDetailScreen from '../screens/admin/OnboardingReviewDetailScreen';
import PayrollRunDetailScreen from '../screens/admin/PayrollRunDetailScreen';
import PayrollRunCreateScreen from '../screens/admin/PayrollRunCreateScreen';
import AdminSalaryRosterScreen from '../screens/admin/AdminSalaryRosterScreen';
import PayrollPolicySettingsScreen from '../screens/admin/PayrollPolicySettingsScreen';
import { useAuthStore } from '../store/authStore';

const PayrollStack = createNativeStackNavigator<PayrollStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
  freezeOnBlur: false,
};

export function PayrollStackNavigator() {
  const role = useAuthStore(state => state.user?.role);
  const initialRouteName = role === 'admin' ? 'AdminSalaryRoster' : 'HrPayrollHub';

  return (
    <PayrollStack.Navigator screenOptions={stackScreenOptions} initialRouteName={initialRouteName}>
      <PayrollStack.Screen name="HrPayrollHub" component={HrPayrollHubScreen} />
      <PayrollStack.Screen name="AdminSalaryRoster" component={AdminSalaryRosterScreen} />
      <PayrollStack.Screen name="PayrollPolicySettings" component={PayrollPolicySettingsScreen} />
      <PayrollStack.Screen name="OnboardingReviewList" component={OnboardingReviewListScreen} />
      <PayrollStack.Screen name="OnboardingReviewDetail" component={OnboardingReviewDetailScreen} />
      <PayrollStack.Screen name="PayrollRunList" component={PayrollRunListScreen} />
      <PayrollStack.Screen name="PayrollRunDetail" component={PayrollRunDetailScreen} />
      <PayrollStack.Screen name="PayrollRunCreate" component={PayrollRunCreateScreen} />
    </PayrollStack.Navigator>
  );
}
