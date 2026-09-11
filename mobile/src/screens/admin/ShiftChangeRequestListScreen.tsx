import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader, EmptyState, ErrorMessage, LoadingIndicator, ShiftChangeRequestCard } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { ShiftChangeRequest } from '../../types';
import type { AdminShiftsStackParamList } from '../../navigation/types';
import { useQuickAccessBack } from '../../navigation/safeStackBack';

interface Props {
  embedded?: boolean;
}

export default function ShiftChangeRequestListScreen({ embedded = false }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AdminShiftsStackParamList>>();
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { showBack, handleBack } = useQuickAccessBack({ moreHubFallback: !embedded });

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await shiftApi.listChangeRequests({ page: 1, limit: 100 });
      setRequests(response.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return (
    <View style={styles.container} collapsable={false}>
      {!embedded ? (
        <AppHeader
          title="Shift Change Requests"
          subtitle="Review employee shift changes"
          showBack={showBack}
          onBack={showBack ? handleBack : undefined}
        />
      ) : null}
      {loading ? (
        <LoadingIndicator fullScreen />
      ) : error ? (
        <View style={styles.center}>
          <ErrorMessage message={error} onRetry={() => fetchData()} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
          renderItem={({ item }) => (
            <ShiftChangeRequestCard
              request={item}
              showEmployee
              onPress={() => navigation.navigate('ShiftChangeRequestDetail', { requestId: item._id })}
            />
          )}
          ListEmptyComponent={<EmptyState title="No requests" message="No shift change requests found." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  center: { flex: 1, justifyContent: 'center', padding: theme.spacing.md },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
});
