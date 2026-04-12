// TradeVibe Configuration
// Update WEBHOOK_URL and REGISTER_TOKEN_URL after deploying Firebase Functions

import AsyncStorage from '@react-native-async-storage/async-storage';

export const FIREBASE_PROJECT_ID = 'tradevibe-44c08';
export const PACKAGE_NAME = 'com.tradevibe';
export const APP_VERSION = '1.0.0';

// Default secret — user can change in Settings
export const DEFAULT_SECRET = 'tradevibe2024';

// Storage keys
export const STORAGE_KEYS = {
  WEBHOOK_URL: 'webhook_url',
  REGISTER_URL: 'register_url',
  STATUS_URL:   'status_url',
  SECRET:       'webhook_secret',
  PATTERN:      'vibration_pattern',
  HIGH_ONLY:    'high_priority_only',
  DEVICE_ID:    'device_id',
  FCM_TOKEN:    'fcm_token',
};

// Vibration patterns
export const PATTERNS = {
  CONTINUOUS: { label: 'Continuous', pattern: [0, 600, 200] },
  SOS:        { label: 'SOS',        pattern: [100,100,100,100,100,300,300,100,300,100,300,300,100,100,100,800] },
  HEARTBEAT:  { label: 'Heartbeat',  pattern: [0, 180, 80, 180, 900] },
  PULSE:      { label: 'Pulse',      pattern: [0, 100, 900] },
};

export async function getConfig() {
  const [webhookUrl, registerUrl, statusUrl, secret, pattern, highOnly] =
    await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.WEBHOOK_URL),
      AsyncStorage.getItem(STORAGE_KEYS.REGISTER_URL),
      AsyncStorage.getItem(STORAGE_KEYS.STATUS_URL),
      AsyncStorage.getItem(STORAGE_KEYS.SECRET),
      AsyncStorage.getItem(STORAGE_KEYS.PATTERN),
      AsyncStorage.getItem(STORAGE_KEYS.HIGH_ONLY),
    ]);

  return {
    webhookUrl:  webhookUrl  || '',
    registerUrl: registerUrl || '',
    statusUrl:   statusUrl   || '',
    secret:      secret      || DEFAULT_SECRET,
    pattern:     pattern     || 'CONTINUOUS',
    highOnly:    highOnly === 'true',
  };
}

export async function saveConfig(config) {
  const pairs = Object.entries({
    [STORAGE_KEYS.WEBHOOK_URL]:  config.webhookUrl  || '',
    [STORAGE_KEYS.REGISTER_URL]: config.registerUrl || '',
    [STORAGE_KEYS.STATUS_URL]:   config.statusUrl   || '',
    [STORAGE_KEYS.SECRET]:       config.secret      || DEFAULT_SECRET,
    [STORAGE_KEYS.PATTERN]:      config.pattern     || 'CONTINUOUS',
    [STORAGE_KEYS.HIGH_ONLY]:    config.highOnly ? 'true' : 'false',
  });
  await AsyncStorage.multiSet(pairs);
}
