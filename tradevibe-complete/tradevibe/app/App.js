import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';

import { AlertProvider, useAlerts } from './src/context/AlertContext';
import { ConnectivityProvider } from './src/context/ConnectivityContext';

import HomeScreen        from './src/screens/HomeScreen';
import AlertActiveScreen from './src/screens/AlertActiveScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';
import SettingsScreen    from './src/screens/SettingsScreen';

import {
  requestPermission, getAndStoreToken,
  parseFCMData, storePendingAlert,
  getPendingAlerts, clearPendingAlerts, setupTokenRefresh
} from './src/services/fcm';
import { startVibration } from './src/services/vibration';
import { getConfig } from './src/config/constants';

const Stack = createStackNavigator();

// Background + killed state handler — must be outside component
messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (remoteMessage.data) {
    const alert = parseFCMData(remoteMessage.data);
    await storePendingAlert(alert);
    const { default: notifee, AndroidImportance } = await import('@notifee/react-native');
    const channelId = await notifee.createChannel({
      id: 'tradealerts', name: 'Trade Alerts', importance: AndroidImportance.HIGH, vibration: true,
    });
    const color = alert.action === 'BUY' ? '#00ff88' : alert.action === 'SELL' ? '#ff4444' : '#ffaa00';
    await notifee.displayNotification({
      title: `${alert.ticker} ${alert.action}`,
      body:  `${alert.action === 'BUY' || alert.action === 'SELL' ? '$' : ''}${parseFloat(alert.price).toLocaleString()} · ${alert.exchange || 'Alert'}`,
      android: { channelId, color, pressAction: { id: 'default', launchActivity: 'default' }, importance: AndroidImportance.HIGH },
      data: remoteMessage.data,
    });
  }
});

function AppInner() {
  const navRef     = useRef(null);
  const { addAlert } = useAlerts();

  useEffect(() => {
    async function init() {
      // Permissions
      await requestPermission();
      await getAndStoreToken();

      // Register token
      const config = await getConfig();
      if (config.registerUrl) {
        try {
          const DeviceInfo = require('react-native-device-info');
          const token    = await messaging().getToken();
          const deviceId = await DeviceInfo.getUniqueId();
          await fetch(config.registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, platform: 'android', deviceId })
          });
        } catch (_) {}
      }

      // Token refresh
      const unsub = setupTokenRefresh(config.registerUrl, config.secret);

      // Check for alerts received while killed
      const pending = await getPendingAlerts();
      if (pending.length > 0) {
        pending.forEach(a => addAlert(a));
        await clearPendingAlerts();
        setTimeout(() => {
          navRef.current?.navigate('AlertActive', { alert: pending[0] });
          startVibration(config.pattern || 'CONTINUOUS');
        }, 500);
      }

      return unsub;
    }

    const cleanup = init();

    // Foreground FCM messages
    const unsubFG = messaging().onMessage(async remoteMessage => {
      if (!remoteMessage.data) return;
      const alert  = parseFCMData(remoteMessage.data);
      const config = await getConfig();
      if (config.highOnly && alert.priority !== 'HIGH') return;
      addAlert(alert);
      startVibration(config.pattern || 'CONTINUOUS');
      navRef.current?.navigate('AlertActive', { alert });
    });

    // App opened from background notification tap
    const unsubBG = messaging().onNotificationOpenedApp(async remoteMessage => {
      if (!remoteMessage.data) return;
      const alert  = parseFCMData(remoteMessage.data);
      const config = await getConfig();
      addAlert(alert);
      startVibration(config.pattern || 'CONTINUOUS');
      setTimeout(() => navRef.current?.navigate('AlertActive', { alert }), 300);
    });

    // App opened from killed state notification tap
    messaging().getInitialNotification().then(async remoteMessage => {
      if (!remoteMessage?.data) return;
      const alert  = parseFCMData(remoteMessage.data);
      const config = await getConfig();
      addAlert(alert);
      startVibration(config.pattern || 'CONTINUOUS');
      setTimeout(() => navRef.current?.navigate('AlertActive', { alert }), 800);
    });

    return () => {
      unsubFG();
      unsubBG();
      cleanup.then(fn => fn && fn());
    };
  }, []);

  return (
    <NavigationContainer ref={navRef} theme={{ colors: { background: '#0a0a0f' } }}>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0a0a0f' } }}>
        <Stack.Screen name="Home"        component={HomeScreen} />
        <Stack.Screen name="AlertActive" component={AlertActiveScreen} />
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
        <Stack.Screen name="Settings"    component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConnectivityProvider>
        <AlertProvider>
          <AppInner />
        </AlertProvider>
      </ConnectivityProvider>
    </GestureHandlerRootView>
  );
}
