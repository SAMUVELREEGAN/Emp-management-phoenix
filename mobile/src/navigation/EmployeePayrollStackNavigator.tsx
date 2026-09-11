import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { EmployeePayrollStackParamList } from './types';
import EmployeeOnboardingScreen from '../screens/employee/EmployeeOnboardingScreen';
import PayslipListScreen from '../screens/employee/PayslipListScreen';
import PayslipDetailScreen from '../screens/employee/PayslipDetailScreen';

const PayrollStack = createNativeStackNavigator<EmployeePayrollStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
  freezeOnBlur: false,
};

export function EmployeePayrollStackNavigator() {
  return (
    <PayrollStack.Navigator screenOptions={stackScreenOptions} initialRouteName="PayslipList">
      <PayrollStack.Screen name="EmployeeOnboarding" component={EmployeeOnboardingScreen} />
      <PayrollStack.Screen name="PayslipList" component={PayslipListScreen} />
      <PayrollStack.Screen name="PayslipDetail" component={PayslipDetailScreen} />
    </PayrollStack.Navigator>
  );
}
