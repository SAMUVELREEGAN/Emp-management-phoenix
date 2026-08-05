import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  HrAttendanceStackParamList,
  HrEmployeesStackParamList,
  HrMoreStackParamList,
  HrReportsStackParamList,
  HrTabParamList,
  ProfileStackParamList,
} from './types';
import { createTabBarScreenOptions } from '../constants/tabBarOptions';
import { LogoutGate } from './LogoutGate';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import EmployeeListScreen from '../screens/admin/EmployeeListScreen';
import EmployeeDetailScreen from '../screens/admin/EmployeeDetailScreen';
import HrAttendanceHubScreen from '../screens/hr/HrAttendanceHubScreen';
import AttendanceHistoryScreen from '../screens/employee/AttendanceHistoryScreen';
import AttendanceDetailScreen from '../screens/admin/AttendanceDetailScreen';
import HrReportsHubScreen from '../screens/hr/HrReportsHubScreen';
import AdminWorkReportDetailScreen from '../screens/admin/AdminWorkReportDetailScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import MoreHubScreen from '../screens/common/MoreHubScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import ChangePasswordScreen from '../screens/common/ChangePasswordScreen';
import { ChatStackNavigator } from './ChatStackNavigator';
import { moreTabScreenOptions } from './moreTabOptions';

const Tab = createBottomTabNavigator<HrTabParamList>();
const EmployeesStack = createNativeStackNavigator<HrEmployeesStackParamList>();
const AttendanceStack = createNativeStackNavigator<HrAttendanceStackParamList>();
const MoreStack = createNativeStackNavigator<HrMoreStackParamList>();
const ReportsStack = createNativeStackNavigator<HrReportsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
  freezeOnBlur: true,
};

function EmployeesStackNavigator() {
  return (
    <EmployeesStack.Navigator screenOptions={stackScreenOptions}>
      <EmployeesStack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <EmployeesStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
    </EmployeesStack.Navigator>
  );
}

function AttendanceStackNavigator() {
  return (
    <AttendanceStack.Navigator screenOptions={stackScreenOptions}>
      <AttendanceStack.Screen name="AttendanceMain" component={HrAttendanceHubScreen} />
      <AttendanceStack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
      <AttendanceStack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} />
    </AttendanceStack.Navigator>
  );
}

function ReportsStackNavigator() {
  return (
    <ReportsStack.Navigator screenOptions={stackScreenOptions}>
      <ReportsStack.Screen name="HrReportsMain" component={HrReportsHubScreen} />
      <ReportsStack.Screen name="AdminWorkReportDetail" component={AdminWorkReportDetailScreen} />
    </ReportsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </ProfileStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={stackScreenOptions}>
      <MoreStack.Screen name="MoreHub" component={MoreHubScreen} />
      <MoreStack.Screen name="Reports" component={ReportsStackNavigator} />
      <MoreStack.Screen name="Notifications" component={NotificationsScreen} />
      <MoreStack.Screen name="Profile" component={ProfileStackNavigator} />
    </MoreStack.Navigator>
  );
}

const hrTabIcons = {
  Home: 'home',
  Employees: 'account-group-outline',
  Attendance: 'clock-outline',
  Chat: 'chat-outline',
  More: 'dots-grid',
};

export function HrNavigator() {
  return (
    <LogoutGate>
      <Tab.Navigator detachInactiveScreens={false} screenOptions={createTabBarScreenOptions(hrTabIcons)}>
        <Tab.Screen name="Home" component={AdminDashboardScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Employees" component={EmployeesStackNavigator} />
        <Tab.Screen name="Attendance" component={AttendanceStackNavigator} />
        <Tab.Screen name="Chat" component={ChatStackNavigator} options={{ title: 'Chat' }} />
        <Tab.Screen name="More" component={MoreStackNavigator} options={moreTabScreenOptions} />
      </Tab.Navigator>
    </LogoutGate>
  );
}
