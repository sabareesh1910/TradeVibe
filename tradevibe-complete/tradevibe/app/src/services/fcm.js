import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import { startVibration } from './vibration';

export async function requestPermission() {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
         authStatus === messaging.AuthorizationStatus.PROVISIONAL;
}

export async function getAndStoreToken() {
  try {
    const token = await messaging().getToken();
    if (token) await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
    return token;
  } catch (e) {
    console.log('FCM token error:', e);
    return null;
  }
}

export function parseFCMData(data) {
  return {
    alertId:   data.alertId   || '',
    ticker:    data.ticker    || 'UNKNOWN',
    action:    data.action    || 'ALERT',
    price:     data.price     || '0',
    message:   data.message   || '',
    priority:  data.priority  || 'NORMAL',
    interval:  data.interval  || '',
    exchange:  data.exchange  || '',
    timestamp: data.timestamp || String(Date.now()),
  };
}

export async function storePendingAlert(alert) {
  try {
    const existing = await AsyncStorage.getItem('pending_alerts');
    const list = existing ? JSON.parse(existing) : [];
    list.unshift(alert);
    await AsyncStorage.setItem('pending_alerts', JSON.stringify(list.slice(0, 10)));
  } catch (_) {}
}

export async function getPendingAlerts() {
  try {
    const data = await AsyncStorage.getItem('pending_alerts');
    return data ? JSON.parse(data) : [];
  } catch (_) { return []; }
}

export async function clearPendingAlerts() {
  await AsyncStorage.removeItem('pending_alerts');
}

export function setupTokenRefresh(registerUrl, secret) {
  return messaging().onTokenRefresh(async newToken => {
    try {
      const DeviceInfo = require('react-native-device-info');
      const deviceId = await DeviceInfo.getUniqueId();
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, newToken);
      if (registerUrl) {
        await fetch(registerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: newToken, platform: 'android', deviceId })
        });
      }
    } catch (_) {}
  });
}
