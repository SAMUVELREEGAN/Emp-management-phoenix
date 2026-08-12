declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    GOOGLE_MAPS_API_KEY?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';
  export default class MaterialCommunityIcons extends Component<IconProps> {}
}
