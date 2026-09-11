/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {enableFreeze} from 'react-native-screens';
import App from './App';

enableFreeze(false);
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
