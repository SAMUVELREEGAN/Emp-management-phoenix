import { useCallback, useRef, useState } from 'react';
import { BackHandler, InteractionManager } from 'react-native';
import { CommonActions, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import { scheduleFabricSafeNavigation } from './fabricSafeNavigation';

type ResetRoute = {
  name: string;
  params?: object;
};

type FabricSafeBackOptions = {
  routes: ResetRoute[];
  index?: number;
  onBeforeBack?: () => void;
  /** Delay before navigation reset so Fabric can unmount list/map children first. */
  delayMs?: number;
  /** When false, back handler is inactive (for embedded list screens). */
  enabled?: boolean;
};

export const ATTENDANCE_MAIN_ROUTE = [{ name: 'AttendanceMain' }];

const DEFAULT_BACK_DELAY_MS = 480;
const LIST_BACK_DELAY_MS = 560;
const HUB_BACK_DELAY_MS = 720;

function waitForUiUnmount(delayMs: number): Promise<void> {
  return new Promise(resolve => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, delayMs);
        });
      });
    });
  });
}

function useFabricSafeBackInternal(
  navigation: NavigationProp<ParamListBase>,
  {
    routes,
    index,
    onBeforeBack,
    delayMs = DEFAULT_BACK_DELAY_MS,
    enabled = true,
  }: FabricSafeBackOptions,
) {
  const leavingRef = useRef(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const onBeforeBackRef = useRef(onBeforeBack);
  const routesRef = useRef(routes);
  const indexRef = useRef(index);
  const delayRef = useRef(delayMs);
  const enabledRef = useRef(enabled);

  onBeforeBackRef.current = onBeforeBack;
  routesRef.current = routes;
  indexRef.current = index;
  delayRef.current = delayMs;
  enabledRef.current = enabled;

  const handleBack = useCallback(() => {
    if (!enabledRef.current || leavingRef.current) {
      return;
    }

    leavingRef.current = true;
    setIsLeaving(true);
    onBeforeBackRef.current?.();

    void waitForUiUnmount(delayRef.current).then(() => {
      if (!enabledRef.current) {
        return;
      }
      const resetRoutes = routesRef.current;
      if (resetRoutes.length === 1 && navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
      navigation.dispatch(
        CommonActions.reset({
          index: indexRef.current ?? resetRoutes.length - 1,
          routes: resetRoutes,
        }),
      );
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return;
      }

      leavingRef.current = false;
      setIsLeaving(false);

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });

      return () => {
        leavingRef.current = true;
        subscription.remove();
      };
    }, [handleBack, enabled]),
  );

  return { handleBack, leavingRef, isLeaving };
}

export function useFabricSafeBack(options: FabricSafeBackOptions) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  return useFabricSafeBackInternal(navigation, options);
}

export function useFabricSafeBackOn(
  navigation: NavigationProp<ParamListBase> | undefined,
  options: FabricSafeBackOptions,
) {
  const fallbackNavigation = useNavigation<NavigationProp<ParamListBase>>();
  return useFabricSafeBackInternal(navigation ?? fallbackNavigation, options);
}

export function useStackBackTo(
  routeName: string,
  options?: Pick<FabricSafeBackOptions, 'onBeforeBack' | 'delayMs'>,
) {
  return useFabricSafeBack({
    routes: [{ name: routeName }],
    index: 0,
    ...options,
  });
}

export function useMoreHubBack(
  options?: Pick<FabricSafeBackOptions, 'onBeforeBack' | 'delayMs' | 'enabled'>,
) {
  return useTabBack('More', {
    onBeforeBack: options?.onBeforeBack,
    delayMs: options?.delayMs ?? HUB_BACK_DELAY_MS,
    enabled: options?.enabled,
  });
}

export function useTabBack(
  tabName: string,
  options?: Pick<FabricSafeBackOptions, 'onBeforeBack' | 'delayMs' | 'enabled'>,
) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const tabNavigation = navigation.getParent();
  const leavingRef = useRef(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const onBeforeBackRef = useRef(options?.onBeforeBack);
  const delayRef = useRef(options?.delayMs ?? DEFAULT_BACK_DELAY_MS);
  const enabledRef = useRef(options?.enabled !== false);

  onBeforeBackRef.current = options?.onBeforeBack;
  delayRef.current = options?.delayMs ?? DEFAULT_BACK_DELAY_MS;
  enabledRef.current = options?.enabled !== false;

  const handleBack = useCallback(() => {
    if (!enabledRef.current || leavingRef.current || !tabNavigation) {
      return;
    }

    leavingRef.current = true;
    setIsLeaving(true);
    onBeforeBackRef.current?.();

    scheduleFabricSafeNavigation(() => {
      if (!enabledRef.current) {
        return;
      }
      if (tabName === 'Home') {
        tabNavigation.navigate('Home', { screen: 'Dashboard' });
        return;
      }
      if (tabName === 'More') {
        tabNavigation.navigate('More', { screen: 'MoreHub' });
        return;
      }
      tabNavigation.navigate(tabName);
    }, delayRef.current);
  }, [tabNavigation, tabName]);

  useFocusEffect(
    useCallback(() => {
      if (!enabledRef.current) {
        return;
      }

      leavingRef.current = false;
      setIsLeaving(false);

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });

      return () => {
        leavingRef.current = true;
        subscription.remove();
      };
    }, [handleBack]),
  );

  return { handleBack, leavingRef, isLeaving };
}

type QuickAccessBackOptions = Pick<FabricSafeBackOptions, 'onBeforeBack' | 'delayMs' | 'enabled'> & {
  /** When true, back goes to More hub if not opened from dashboard quick access. */
  moreHubFallback?: boolean;
};

export function useQuickAccessBack(options: QuickAccessBackOptions = {}) {
  const route = useRoute<RouteProp<Record<string, { returnToHome?: boolean } | undefined>>>();
  const returnToHome = route.params?.returnToHome === true;
  const screenEnabled = options.enabled !== false;
  const useMoreHub = options.moreHubFallback === true && !returnToHome;

  const tabBack = useTabBack('Home', {
    onBeforeBack: options.onBeforeBack,
    delayMs: options.delayMs,
    enabled: screenEnabled && returnToHome,
  });

  const moreHubBack = useMoreHubBack({
    onBeforeBack: options.onBeforeBack,
    delayMs: options.delayMs,
    enabled: screenEnabled && useMoreHub,
  });

  const showBack = returnToHome || useMoreHub;

  return {
    showBack,
    handleBack: returnToHome ? tabBack.handleBack : moreHubBack.handleBack,
    isLeaving: returnToHome ? tabBack.isLeaving : moreHubBack.isLeaving,
    leavingRef: returnToHome ? tabBack.leavingRef : moreHubBack.leavingRef,
  };
}
