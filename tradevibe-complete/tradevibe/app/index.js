import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';
import { startVibration } from './src/services/vibration';
import { storePendingAlert, parseFCMData } from './src/services/fcm';

// Notifee background event handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    // Handled by navigation when app opens
  }
});

AppRegistry.registerComponent(appName, () => App);
