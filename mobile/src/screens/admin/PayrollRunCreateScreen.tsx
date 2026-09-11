import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppButton, AppHeader, AppInput } from '../../components';
import { theme } from '../../constants/theme';
import { payrollApi } from '../../api/payrollApi';
import { getErrorMessage } from '../../utils/errors';
import type { PayrollStackParamList } from '../../navigation/types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

export default function PayrollRunCreateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PayrollStackParamList>>();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'HrPayrollHub' }], index: 0 });

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await payrollApi.createRun(Number(month), Number(year));
      Alert.alert('Created', 'Payroll run created. Generate payslips next.');
      navigation.navigate('PayrollRunDetail', { runId: response.data.run._id });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Create Payroll Run" showBack onBack={handleBack} />
      <View style={styles.content}>
        <AppInput label="Month (1-12)" value={month} onChangeText={setMonth} keyboardType="numeric" />
        <AppInput label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
        <AppButton title="Create Payroll Run" onPress={handleCreate} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  content: { padding: theme.spacing.md },
});
