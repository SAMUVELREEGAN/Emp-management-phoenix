import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import SplashScreen from '../screens/common/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { EmployeeNavigator } from './EmployeeNavigator';
import { AdminNavigator } from './AdminNavigator';
import { HrNavigator } from './HrNavigator';
import type { RootStackParamList } from './types';
import {
  resetForAuthenticatedUser,
  resetToAuth,
  waitForNavigationReady,
} from './navigationRef';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const rootScreenOptions = {
  headerShown: false,
  animation: 'none' as const,
};

export function RootNavigator() {
  const hydrate = useAuthStore(state => state.hydrate);
  const setAuth = useAuthStore(state => state.setAuth);
  const logout = useAuthStore(state => state.logout);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) {
      return;
    }

    const init = async () => {
      await hydrate();
      await waitForNavigationReady();

      const { token, user: storedUser } = useAuthStore.getState();
      if (token && storedUser) {
        try {
          const response = await authApi.me();
          setAuth(token, response.data.user);
          resetForAuthenticatedUser(response.data.user.role);
        } catch {
          logout();
          resetToAuth();
        }
      } else {
        resetToAuth();
      }

      bootstrapped.current = true;
    };

    void init();
  }, [hydrate, setAuth, logout]);

  return (
    <RootStack.Navigator screenOptions={rootScreenOptions} initialRouteName="Splash">
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="Auth" component={AuthNavigator} />
      <RootStack.Screen name="Admin" component={AdminNavigator} />
      <RootStack.Screen name="Employee" component={EmployeeNavigator} />
      <RootStack.Screen name="Hr" component={HrNavigator} />
    </RootStack.Navigator>
  );
}
