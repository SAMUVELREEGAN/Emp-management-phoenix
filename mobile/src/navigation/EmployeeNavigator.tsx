import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  EmployeeAttendanceStackParamList,
  EmployeeLeaveStackParamList,
  EmployeeMoreStackParamList,
  EmployeeReportsStackParamList,
  EmployeeTabParamList,
  EmployeeTasksStackParamList,
  ProfileStackParamList,
} from './types';
import { createTabBarScreenOptions } from '../constants/tabBarOptions';
import EmployeeDashboardScreen from '../screens/employee/EmployeeDashboardScreen';
import AttendanceScreen from '../screens/employee/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/employee/AttendanceHistoryScreen';
import MyTasksScreen from '../screens/employee/MyTasksScreen';
import EmployeeTaskDetailScreen from '../screens/employee/EmployeeTaskDetailScreen';
import LeaveListScreen from '../screens/employee/LeaveListScreen';
import LeaveRequestFormScreen from '../screens/employee/LeaveRequestFormScreen';
import LeaveDetailScreen from '../screens/employee/LeaveDetailScreen';
import WorkReportListScreen from '../screens/employee/WorkReportListScreen';
import WorkReportFormScreen from '../screens/employee/WorkReportFormScreen';
import WorkReportDetailScreen from '../screens/employee/WorkReportDetailScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import MoreHubScreen from '../screens/common/MoreHubScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import ChangePasswordScreen from '../screens/common/ChangePasswordScreen';
import { ChatStackNavigator } from './ChatStackNavigator';
import { moreTabScreenOptions } from './moreTabOptions';

const Tab = createBottomTabNavigator<EmployeeTabParamList>();
const AttendanceStack = createNativeStackNavigator<EmployeeAttendanceStackParamList>();
const ReportsStack = createNativeStackNavigator<EmployeeReportsStackParamList>();
const MoreStack = createNativeStackNavigator<EmployeeMoreStackParamList>();
const TasksStack = createNativeStackNavigator<EmployeeTasksStackParamList>();
const LeaveStack = createNativeStackNavigator<EmployeeLeaveStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const stackScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
  freezeOnBlur: true,
};

function AttendanceStackNavigator() {
  return (
    <AttendanceStack.Navigator screenOptions={stackScreenOptions}>
      <AttendanceStack.Screen name="AttendanceMain" component={AttendanceScreen} />
      <AttendanceStack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
    </AttendanceStack.Navigator>
  );
}

function ReportsStackNavigator() {
  return (
    <ReportsStack.Navigator screenOptions={stackScreenOptions}>
      <ReportsStack.Screen name="WorkReportList" component={WorkReportListScreen} />
      <ReportsStack.Screen name="WorkReportForm" component={WorkReportFormScreen} />
      <ReportsStack.Screen name="WorkReportDetail" component={WorkReportDetailScreen} />
    </ReportsStack.Navigator>
  );
}

function TasksStackNavigator() {
  return (
    <TasksStack.Navigator screenOptions={stackScreenOptions}>
      <TasksStack.Screen name="MyTasks" component={MyTasksScreen} />
      <TasksStack.Screen name="EmployeeTaskDetail" component={EmployeeTaskDetailScreen} />
    </TasksStack.Navigator>
  );
}

function LeaveStackNavigator() {
  return (
    <LeaveStack.Navigator screenOptions={stackScreenOptions}>
      <LeaveStack.Screen name="LeaveList" component={LeaveListScreen} />
      <LeaveStack.Screen name="LeaveRequestForm" component={LeaveRequestFormScreen} />
      <LeaveStack.Screen name="LeaveDetail" component={LeaveDetailScreen} />
    </LeaveStack.Navigator>
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
      <MoreStack.Screen name="Tasks" component={TasksStackNavigator} />
      <MoreStack.Screen name="Leave" component={LeaveStackNavigator} />
      <MoreStack.Screen name="Notifications" component={NotificationsScreen} />
      <MoreStack.Screen name="Profile" component={ProfileStackNavigator} />
    </MoreStack.Navigator>
  );
}

const employeeTabIcons = {
  Home: 'home',
  Attendance: 'clock-outline',
  Chat: 'chat-outline',
  Reports: 'chart-bar',
  More: 'dots-grid',
};

export function EmployeeNavigator() {
  return (
    <Tab.Navigator detachInactiveScreens={false} screenOptions={createTabBarScreenOptions(employeeTabIcons)}>
      <Tab.Screen name="Home" component={EmployeeDashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Attendance" component={AttendanceStackNavigator} />
      <Tab.Screen name="Chat" component={ChatStackNavigator} options={{ title: 'Chat' }} />
      <Tab.Screen name="Reports" component={ReportsStackNavigator} />
      <Tab.Screen name="More" component={MoreStackNavigator} options={moreTabScreenOptions} />
    </Tab.Navigator>
  );
}
