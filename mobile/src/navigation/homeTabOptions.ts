import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { EventArg, ParamListBase } from '@react-navigation/native';
import { scheduleFabricSafeNavigation } from './fabricSafeNavigation';

type TabNavigation = BottomTabNavigationProp<ParamListBase>;

/** Tapping Home always returns to the dashboard. */
export const homeTabScreenOptions = {
  title: 'Home',
  listeners: ({ navigation }: { navigation: TabNavigation }) => ({
    tabPress: (e: EventArg<'tabPress', true>) => {
      e.preventDefault();
      scheduleFabricSafeNavigation(() => {
        navigation.navigate('Home', { screen: 'Dashboard' });
      });
    },
  }),
};
