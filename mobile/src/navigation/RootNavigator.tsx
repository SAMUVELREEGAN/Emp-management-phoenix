import React, { useEffect, useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import SplashScreen from '../screens/common/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { EmployeeNavigator } from './EmployeeNavigator';
import { AdminNavigator } from './AdminNavigator';
import { HrNavigator } from './HrNavigator';
import { theme } from '../constants/theme';
import {
  navigationRef,
  resetForAuthenticatedUser,
  resetToAuth,
} from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { hydrated, hydrate, setAuth, logout } = useAuthStore();
  const [ready, setReady] = useState(false);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      await hydrate();
      const { token, user: storedUser } = useAuthStore.getState();
      if (token && storedUser) {
        try {
          const response = await authApi.me();
          setAuth(token, response.data.user);
        } catch {
          logout();
        }
      }
      setReady(true);
    };
    init();
  }, [hydrate, setAuth, logout]);

  useEffect(() => {
    if (!hydrated || !ready || bootstrappedRef.current) {
      return;
    }

    const bootstrapNavigation = () => {
      if (!navigationRef.isReady()) {
        requestAnimationFrame(bootstrapNavigation);
        return;
      }

      bootstrappedRef.current = true;
      const { isAuthenticated, user } = useAuthStore.getState();

      if (!isAuthenticated || !user) {
        resetToAuth();
        return;
      }

      resetForAuthenticatedUser(user.role);
    };

    bootstrapNavigation();
  }, [hydrated, ready]);

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="Hr" component={HrNavigator} />
      <Stack.Screen name="Employee" component={EmployeeNavigator} />
    </Stack.Navigator>
  );
}
