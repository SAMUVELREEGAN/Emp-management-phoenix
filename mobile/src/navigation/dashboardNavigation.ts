import type { NavigationProp, ParamListBase } from '@react-navigation/native';

/** Pass to screens opened from dashboard quick access (back returns to dashboard). */
export const RETURN_TO_HOME_PARAMS = { returnToHome: true } as const;

/** Open a nested screen inside the Home tab (dashboard quick access). */
export function navigateHomeNestedScreen(
  navigation: NavigationProp<ParamListBase>,
  screen: string,
  nestedScreen: string,
  params?: object,
) {
  navigation.navigate('Home', {
    screen,
    params: {
      screen: nestedScreen,
      params,
    },
  });
}

/** Open a leaf screen inside the Home tab (e.g. Notifications). */
export function navigateHomeScreen(
  navigation: NavigationProp<ParamListBase>,
  screen: string,
  params?: object,
) {
  navigation.navigate('Home', { screen, params });
}

/** Open a nested screen inside the More tab (More hub menu only). */
export function navigateMoreNestedScreen(
  navigation: NavigationProp<ParamListBase>,
  screen: string,
  nestedScreen: string,
  params?: object,
) {
  navigation.navigate('More', {
    screen,
    params: {
      screen: nestedScreen,
      params,
    },
  });
}

/** Open a leaf screen inside the More tab. */
export function navigateMoreScreen(
  navigation: NavigationProp<ParamListBase>,
  screen: string,
  params?: object,
) {
  navigation.navigate('More', { screen, params });
}
