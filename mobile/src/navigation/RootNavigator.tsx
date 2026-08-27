import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import SplashScreen from '../screens/common/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { EmployeeNavigator } from './EmployeeNavigator';
import { AdminNavigator } from './AdminNavigator';
import { HrNavigator } from './HrNavigator';
import { LogoutShell } from './LogoutShell';

export function RootNavigator() {
  const hydrated = useAuthStore(state => state.hydrated);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);
  const hydrate = useAuthStore(state => state.hydrate);
  const setAuth = useAuthStore(state => state.setAuth);
  const logout = useAuthStore(state => state.logout);
  const [ready, setReady] = useState(false);

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
    void init();
  }, [hydrate, setAuth, logout]);

  if (!hydrated || !ready) {
    return <SplashScreen />;
  }

  if (isLoggingOut) {
    return <LogoutShell />;
  }

  if (!isAuthenticated || !user) {
    return <AuthNavigator />;
  }

  if (user.role === 'admin') {
    return <AdminNavigator />;
  }

  if (user.role === 'hr') {
    return <HrNavigator />;
  }

  return <EmployeeNavigator />;
}
