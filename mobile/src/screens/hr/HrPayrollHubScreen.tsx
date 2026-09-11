import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppHeader, HrSectionTabs, type HrSectionTab } from '../../components';
import OnboardingReviewListScreen from '../admin/OnboardingReviewListScreen';
import PayrollRunListScreen from '../admin/PayrollRunListScreen';
import AdminSalaryRosterScreen from '../admin/AdminSalaryRosterScreen';
import { theme } from '../../constants/theme';
import { onboardingApi } from '../../api/onboardingApi';
import { getErrorMessage } from '../../utils/errors';
import type { PayrollStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

export default function HrPayrollHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PayrollStackParamList>>();
  const [tab, setTab] = useState<HrSectionTab>('left');
  const { showBack, handleBack } = useQuickAccessBack({
    moreHubFallback: true,
    onBeforeBack: () => setTab('left'),
  });

  const subtitle =
    tab === 'left'
      ? 'Review onboarding and set salary'
      : tab === 'middle'
        ? 'Generate and finalize monthly payroll'
        : 'Employee salary roster';

  return (
    <View style={styles.container}>
      <AppHeader
        title="Payroll"
        subtitle={subtitle}
        showBack={showBack}
        onBack={showBack ? handleBack : undefined}
        rightAction={
          tab === 'left' ? (
            <Pressable
              onPress={async () => {
                try {
                  const response = await onboardingApi.shareWithAdmin();
                  Alert.alert('Shared', `Shared ${response.data.roster.length} salary records with admin.`);
                } catch (err) {
                  Alert.alert('Error', getErrorMessage(err));
                }
              }}
              hitSlop={8}>
              <MaterialCommunityIcons name="share-variant" size={24} color={theme.colors.white} />
            </Pressable>
          ) : tab === 'middle' ? (
            <Pressable onPress={() => navigation.navigate('PayrollRunCreate')} hitSlop={8}>
              <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
            </Pressable>
          ) : undefined
        }
      />
      <HrSectionTabs
        value={tab}
        onChange={setTab}
        leftLabel="Onboarding"
        middleLabel="Payroll"
        rightLabel="Roster"
        threeTabs
      />
      <View style={styles.content}>
        {tab === 'left' ? (
          <OnboardingReviewListScreen embedded />
        ) : tab === 'middle' ? (
          <PayrollRunListScreen embedded />
        ) : (
          <AdminSalaryRosterScreen embedded />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { flex: 1 },
});
