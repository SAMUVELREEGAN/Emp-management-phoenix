import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { EventArg, ParamListBase } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';

type TabNavigation = BottomTabNavigationProp<ParamListBase>;

/** Always open the More hub when the More tab is pressed (clears nested stack state). */
export const moreTabScreenOptions = {
  title: 'More',
  listeners: ({ navigation }: { navigation: TabNavigation }) => ({
    tabPress: (e: EventArg<'tabPress', true>) => {
      e.preventDefault();

      const tabState = navigation.getState();
      const moreIndex = tabState.routes.findIndex(route => route.name === 'More');
      if (moreIndex < 0) {
        navigation.navigate('More', { screen: 'MoreHub' });
        return;
      }

      navigation.dispatch(
        CommonActions.reset({
          ...tabState,
          index: moreIndex,
          routes: tabState.routes.map(route =>
            route.name === 'More'
              ? {
                  name: 'More',
                  state: {
                    index: 0,
                    routes: [{ name: 'MoreHub' }],
                  },
                }
              : route,
          ),
        }),
      );
    },
  }),
};
