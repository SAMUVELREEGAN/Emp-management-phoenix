import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader, HrSectionTabs, type HrSectionTab } from '../../components';
import ShiftListScreen from '../admin/ShiftListScreen';
import ShiftChangeRequestListScreen from '../admin/ShiftChangeRequestListScreen';
import ShiftReportListScreen from '../admin/ShiftReportListScreen';
import { theme } from '../../constants/theme';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

export default function HrShiftsHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminShiftsStackParamList>>();
  const [tab, setTab] = useState<HrSectionTab>('left');
  const { showBack, handleBack } = useQuickAccessBack({
    moreHubFallback: true,
    onBeforeBack: () => setTab('left'),
  });

  const subtitle =
    tab === 'left'
      ? 'Create and manage work shifts'
      : tab === 'right'
        ? 'Review employee shift change requests'
        : 'Send shift summaries to admin';

  return (
    <View style={styles.container}>
      <AppHeader
        title="Shift Management"
        subtitle={subtitle}
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
        rightAction={
          tab === 'left' ? (
            <Pressable onPress={() => navigation.navigate('ShiftForm', {})} hitSlop={8}>
              <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
            </Pressable>
          ) : tab === 'middle' ? (
            <Pressable onPress={() => navigation.navigate('ShiftReportForm')} hitSlop={8}>
              <MaterialCommunityIcons name="file-send-outline" size={26} color={theme.colors.white} />
            </Pressable>
          ) : undefined
        }
      />
      <HrSectionTabs
        value={tab}
        onChange={setTab}
        leftLabel="Shifts"
        middleLabel="Reports"
        rightLabel="Requests"
        threeTabs
      />
      <View style={styles.content}>
        {tab === 'left' ? (
          <ShiftListScreen embedded />
        ) : tab === 'middle' ? (
          <ShiftReportListScreen embedded />
        ) : (
          <ShiftChangeRequestListScreen embedded />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { flex: 1 },
});
