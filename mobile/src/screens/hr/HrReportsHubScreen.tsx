import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader, HrSectionTabs, LoadingIndicator, type HrSectionTab } from '../../components';
import AdminWorkReportListScreen from '../admin/AdminWorkReportListScreen';
import HrAttendanceReportScreen from './HrAttendanceReportScreen';
import { theme } from '../../constants/theme';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

export default function HrReportsHubScreen() {
  const [tab, setTab] = useState<HrSectionTab>('left');
  const [contentKey, setContentKey] = useState(0);
  const { showBack, handleBack, isLeaving } = useQuickAccessBack({
    moreHubFallback: true,
    onBeforeBack: () => {
      setTab('left');
      setContentKey(prev => prev + 1);
    },
  });

  return (
    <View style={styles.container} collapsable={false}>
      <AppHeader
        title="Reports"
        subtitle={
          tab === 'left'
            ? 'Review employee daily & hourly work reports'
            : 'Submit employee attendance summary to admin'
        }
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
      />
      {isLeaving ? (
        <LoadingIndicator fullScreen />
      ) : (
        <>
          <HrSectionTabs
            value={tab}
            onChange={setTab}
            leftLabel="Employee"
            rightLabel="HR"
          />
          <View style={styles.content} key={contentKey} collapsable={false}>
            {tab === 'left' ? (
              <AdminWorkReportListScreen embedded fixedRole="employee" />
            ) : (
              <HrAttendanceReportScreen embedded />
            )}
          </View>
        </>
      )}
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
