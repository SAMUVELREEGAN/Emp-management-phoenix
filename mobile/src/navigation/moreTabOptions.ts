import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { EventArg, ParamListBase } from '@react-navigation/native';

type TabNavigation = BottomTabNavigationProp<ParamListBase>;

/** More tab only contains the hub menu — quick access uses the Home stack instead. */
export const moreTabScreenOptions = {
  title: 'More',
  unmountOnBlur: true,
  listeners: ({ navigation }: { navigation: TabNavigation }) => ({
    tabPress: (e: EventArg<'tabPress', true>) => {
      e.preventDefault();
      navigation.navigate('More', { screen: 'MoreHub' });
    },
  }),
};
