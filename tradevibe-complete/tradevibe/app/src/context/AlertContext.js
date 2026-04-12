import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig } from '../config/constants';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback((alert) => {
    setAlerts(prev => {
      const exists = prev.find(a => a.alertId === alert.alertId);
      if (exists) return prev;
      return [alert, ...prev];
    });
  }, []);

  const removeAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(a => a.alertId !== alertId));
  }, []);

  const acknowledgeAlert = useCallback(async (alertId) => {
    try {
      const config = await getConfig();
      if (config.webhookUrl && alertId) {
        const baseUrl = config.webhookUrl.replace('/alertWebhook', '');
        await fetch(`${baseUrl}/acknowledgeAlert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId, secret: config.secret })
        }).catch(() => {});
      }
    } catch (_) {}
    setAlerts(prev => prev.filter(a => a.alertId !== alertId));
  }, []);

  const currentAlert = alerts[0] || null;
  const pendingCount = Math.max(0, alerts.length - 1);

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert, acknowledgeAlert, currentAlert, pendingCount }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be inside AlertProvider');
  return ctx;
}
