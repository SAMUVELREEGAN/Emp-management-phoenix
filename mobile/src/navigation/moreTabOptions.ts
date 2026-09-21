import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { EventArg, ParamListBase } from '@react-navigation/native';
import { scheduleFabricSafeNavigation } from './fabricSafeNavigation';

type TabNavigation = BottomTabNavigationProp<ParamListBase>;

/** More tab only contains the hub menu — quick access uses the Home stack instead. */
export const moreTabScreenOptions = {
  title: 'More',
  listeners: ({ navigation }: { navigation: TabNavigation }) => ({
    tabPress: (e: EventArg<'tabPress', true>) => {
      e.preventDefault();
      scheduleFabricSafeNavigation(() => {
        navigation.navigate('More', { screen: 'MoreHub' });
      });
    },
  }),
};
