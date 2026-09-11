import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminShiftsStackParamList } from './types';
import ShiftListScreen from '../screens/admin/ShiftListScreen';
import HrShiftsHubScreen from '../screens/hr/HrShiftsHubScreen';
import ShiftFormScreen from '../screens/admin/ShiftFormScreen';
import ShiftDetailScreen from '../screens/admin/ShiftDetailScreen';
import ShiftAssignmentScreen from '../screens/admin/ShiftAssignmentScreen';
import ShiftAttendanceScreen from '../screens/admin/ShiftAttendanceScreen';
import ShiftChangeRequestListScreen from '../screens/admin/ShiftChangeRequestListScreen';
import ShiftChangeRequestDetailScreen from '../screens/admin/ShiftChangeRequestDetailScreen';
import ShiftReportListScreen from '../screens/admin/ShiftReportListScreen';
import ShiftReportFormScreen from '../screens/hr/ShiftReportFormScreen';
import ShiftReportDetailScreen from '../screens/admin/ShiftReportDetailScreen';
import { useAuthStore } from '../store/authStore';

const ShiftsStack = createNativeStackNavigator<AdminShiftsStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
  freezeOnBlur: false,
};

export function ShiftsStackNavigator() {
  const role = useAuthStore(state => state.user?.role);
  const initialRouteName = role === 'hr' ? 'HrShiftsHub' : 'ShiftList';

  return (
    <ShiftsStack.Navigator screenOptions={stackScreenOptions} initialRouteName={initialRouteName}>
      <ShiftsStack.Screen name="HrShiftsHub" component={HrShiftsHubScreen} />
      <ShiftsStack.Screen name="ShiftList" component={ShiftListScreen} />
      <ShiftsStack.Screen name="ShiftForm" component={ShiftFormScreen} />
      <ShiftsStack.Screen name="ShiftDetail" component={ShiftDetailScreen} />
      <ShiftsStack.Screen name="ShiftAssignment" component={ShiftAssignmentScreen} />
      <ShiftsStack.Screen name="ShiftAttendance" component={ShiftAttendanceScreen} />
      <ShiftsStack.Screen name="ShiftChangeRequestList" component={ShiftChangeRequestListScreen} />
      <ShiftsStack.Screen name="ShiftChangeRequestDetail" component={ShiftChangeRequestDetailScreen} />
      <ShiftsStack.Screen name="ShiftReportList" component={ShiftReportListScreen} />
      <ShiftsStack.Screen name="ShiftReportForm" component={ShiftReportFormScreen} />
      <ShiftsStack.Screen name="ShiftReportDetail" component={ShiftReportDetailScreen} />
    </ShiftsStack.Navigator>
  );
}
