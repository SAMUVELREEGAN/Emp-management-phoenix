import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { notificationApi } from '../api/notificationApi';

export function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await notificationApi.list({ page: 1, limit: 1 });
      setUnreadCount(response.data.unreadCount);
    } catch {
      // Keep previous count on failure.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { unreadCount, refresh };
}
