import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader, EmptyState, ErrorMessage, LoadingIndicator, ShiftChangeRequestCard } from '../../components';
import { theme } from '../../constants/theme';
import { shiftApi } from '../../api/shiftApi';
import { getErrorMessage } from '../../utils/errors';
import type { ShiftChangeRequest } from '../../types';
import { useFabricSafeBack } from '../../navigation/safeStackBack';

export default function ShiftChangeRequestListScreen() {
  const { handleBack } = useFabricSafeBack({ routes: [{ name: 'MyShift' }], index: 0 });
  const [requests, setRequests] = useState<ShiftChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await shiftApi.myChangeRequests({ page: 1, limit: 50 });
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

  const handleCancel = (request: ShiftChangeRequest) => {
    if (request.status !== 'pending') return;
    Alert.alert('Cancel request', 'Cancel this shift change request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await shiftApi.cancelChangeRequest(request._id);
            fetchData(true);
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="My Shift Requests" showBack onBack={handleBack} />
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
              onPress={item.status === 'pending' ? () => handleCancel(item) : undefined}
            />
          )}
          ListEmptyComponent={<EmptyState title="No requests" message="You have not submitted any shift change requests." />}
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
