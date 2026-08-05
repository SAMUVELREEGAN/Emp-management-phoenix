import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader, HrSectionTabs, type HrSectionTab } from '../../components';
import AttendanceScreen from '../employee/AttendanceScreen';
import AttendanceOverviewScreen from '../admin/AttendanceOverviewScreen';
import { theme } from '../../constants/theme';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

export default function HrAttendanceHubScreen() {
  const [tab, setTab] = useState<HrSectionTab>('left');
  const { showBack, handleBack } = useQuickAccessBack({
    onBeforeBack: () => setTab('left'),
  });

  return (
    <View style={styles.container}>
      <AppHeader
        title="Attendance"
        subtitle={
          tab === 'left'
            ? 'Mark your daily check-in and check-out'
            : 'Review employee attendance records'
        }
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
      />
      <HrSectionTabs
        value={tab}
        onChange={setTab}
        leftLabel="My Attendance"
        rightLabel="Employee"
      />
      <View style={styles.content}>
        {tab === 'left' ? (
          <AttendanceScreen embedded />
        ) : (
          <AttendanceOverviewScreen
            embedded
            fixedRole="employee"
            enableDateFilter
            enableExport
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
  },
});
