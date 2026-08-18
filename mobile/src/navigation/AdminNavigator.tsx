import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  AdminAttendanceStackParamList,
  AdminEmployeesStackParamList,
  AdminHomeStackParamList,
  AdminLeaveStackParamList,
  AdminMoreStackParamList,
  AdminNotificationsStackParamList,
  AdminReportsStackParamList,
  AdminTabParamList,
  AdminTasksStackParamList,
  AdminTrackStackParamList,
  ProfileStackParamList,
} from './types';
import { createTabBarScreenOptions } from '../constants/tabBarOptions';
import { LogoutGate } from './LogoutGate';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import EmployeeListScreen from '../screens/admin/EmployeeListScreen';
import EmployeeFormScreen from '../screens/admin/EmployeeFormScreen';
import EmployeeDetailScreen from '../screens/admin/EmployeeDetailScreen';
import AttendanceOverviewScreen from '../screens/admin/AttendanceOverviewScreen';
import AttendanceDetailScreen from '../screens/admin/AttendanceDetailScreen';
import AdminWorkReportListScreen from '../screens/admin/AdminWorkReportListScreen';
import AdminWorkReportDetailScreen from '../screens/admin/AdminWorkReportDetailScreen';
import AdminTaskListScreen from '../screens/admin/AdminTaskListScreen';
import TaskAssignScreen from '../screens/admin/TaskAssignScreen';
import AdminTaskDetailScreen from '../screens/admin/AdminTaskDetailScreen';
import LeaveApprovalListScreen from '../screens/admin/LeaveApprovalListScreen';
import LeaveApprovalDetailScreen from '../screens/admin/LeaveApprovalDetailScreen';
import TrackEmployeesScreen from '../screens/admin/TrackEmployeesScreen';
import EmployeeRouteTrackScreen from '../screens/admin/EmployeeRouteTrackScreen';
import AnnouncementComposeScreen from '../screens/admin/AnnouncementComposeScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import MoreHubScreen from '../screens/common/MoreHubScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import ChangePasswordScreen from '../screens/common/ChangePasswordScreen';
import { ChatStackNavigator } from './ChatStackNavigator';
import { homeTabScreenOptions } from './homeTabOptions';
import { moreTabScreenOptions } from './moreTabOptions';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const HomeStack = createNativeStackNavigator<AdminHomeStackParamList>();
const EmployeesStack = createNativeStackNavigator<AdminEmployeesStackParamList>();
const AttendanceStack = createNativeStackNavigator<AdminAttendanceStackParamList>();
const MoreStack = createNativeStackNavigator<AdminMoreStackParamList>();
const TasksStack = createNativeStackNavigator<AdminTasksStackParamList>();
const LeaveStack = createNativeStackNavigator<AdminLeaveStackParamList>();
const TrackStack = createNativeStackNavigator<AdminTrackStackParamList>();
const ReportsStack = createNativeStackNavigator<AdminReportsStackParamList>();
const NotificationsStack = createNativeStackNavigator<AdminNotificationsStackParamList>();
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
      <EmployeesStack.Screen name="EmployeeForm" component={EmployeeFormScreen} />
      <EmployeesStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
    </EmployeesStack.Navigator>
  );
}

function AttendanceStackNavigator() {
  return (
    <AttendanceStack.Navigator screenOptions={stackScreenOptions}>
      <AttendanceStack.Screen name="AttendanceOverview" component={AttendanceOverviewScreen} />
      <AttendanceStack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} />
    </AttendanceStack.Navigator>
  );
}

function TasksStackNavigator() {
  return (
    <TasksStack.Navigator screenOptions={stackScreenOptions}>
      <TasksStack.Screen name="AdminTaskList" component={AdminTaskListScreen} />
      <TasksStack.Screen name="TaskAssign" component={TaskAssignScreen} />
      <TasksStack.Screen name="AdminTaskDetail" component={AdminTaskDetailScreen} />
    </TasksStack.Navigator>
  );
}

function LeaveStackNavigator() {
  return (
    <LeaveStack.Navigator screenOptions={stackScreenOptions}>
      <LeaveStack.Screen name="LeaveApprovalList" component={LeaveApprovalListScreen} />
      <LeaveStack.Screen name="LeaveApprovalDetail" component={LeaveApprovalDetailScreen} />
    </LeaveStack.Navigator>
  );
}

function TrackStackNavigator() {
  return (
    <TrackStack.Navigator screenOptions={stackScreenOptions}>
      <TrackStack.Screen name="TrackEmployees" component={TrackEmployeesScreen} />
      <TrackStack.Screen name="EmployeeRouteTrack" component={EmployeeRouteTrackScreen} />
    </TrackStack.Navigator>
  );
}

function ReportsStackNavigator() {
  return (
    <ReportsStack.Navigator screenOptions={stackScreenOptions}>
      <ReportsStack.Screen name="AdminWorkReportList" component={AdminWorkReportListScreen} />
      <ReportsStack.Screen name="AdminWorkReportDetail" component={AdminWorkReportDetailScreen} />
    </ReportsStack.Navigator>
  );
}

function NotificationsStackNavigator() {
  return (
    <NotificationsStack.Navigator screenOptions={stackScreenOptions}>
      <NotificationsStack.Screen name="NotificationsMain" component={NotificationsScreen} />
      <NotificationsStack.Screen name="SendAnnouncement" component={AnnouncementComposeScreen} />
    </NotificationsStack.Navigator>
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

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={stackScreenOptions} initialRouteName="Dashboard">
      <HomeStack.Screen name="Dashboard" component={AdminDashboardScreen} />
      <HomeStack.Screen name="Tasks" component={TasksStackNavigator} />
      <HomeStack.Screen name="Leave" component={LeaveStackNavigator} />
      <HomeStack.Screen name="Track" component={TrackStackNavigator} />
      <HomeStack.Screen name="Reports" component={ReportsStackNavigator} />
      <HomeStack.Screen name="Notifications" component={NotificationsStackNavigator} />
      <HomeStack.Screen name="Profile" component={ProfileStackNavigator} />
    </HomeStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={stackScreenOptions} initialRouteName="MoreHub">
      <MoreStack.Screen name="MoreHub" component={MoreHubScreen} />
      <MoreStack.Screen name="Tasks" component={TasksStackNavigator} />
      <MoreStack.Screen name="Leave" component={LeaveStackNavigator} />
      <MoreStack.Screen name="Track" component={TrackStackNavigator} />
      <MoreStack.Screen name="Reports" component={ReportsStackNavigator} />
      <MoreStack.Screen name="Notifications" component={NotificationsStackNavigator} />
      <MoreStack.Screen name="Profile" component={ProfileStackNavigator} />
    </MoreStack.Navigator>
  );
}

const adminTabIcons = {
  Home: 'home-outline',
  Employees: 'account-group-outline',
  Attendance: 'clock-outline',
  Chat: 'chat-outline',
  More: 'dots-grid',
};

export function AdminNavigator() {
  return (
    <LogoutGate>
      <Tab.Navigator detachInactiveScreens={false} screenOptions={createTabBarScreenOptions(adminTabIcons)}>
        <Tab.Screen name="Home" component={HomeStackNavigator} options={homeTabScreenOptions} />
        <Tab.Screen name="Employees" component={EmployeesStackNavigator} />
        <Tab.Screen name="Attendance" component={AttendanceStackNavigator} />
        <Tab.Screen name="Chat" component={ChatStackNavigator} options={{ title: 'Chat' }} />
        <Tab.Screen name="More" component={MoreStackNavigator} options={moreTabScreenOptions} />
      </Tab.Navigator>
    </LogoutGate>
  );
}
