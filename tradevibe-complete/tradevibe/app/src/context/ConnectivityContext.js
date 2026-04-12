import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { startPolling, stopPolling, checkAll } from '../services/connectivity';

const ConnectivityContext = createContext(null);

const DEFAULT_STATUS = {
  firebase:    'disconnected',
  fcm:         { status: 'not_registered' },
  webhook:     { status: 'no_signal', lastPing: null, minutesAgo: null },
  tradingview: 'no_signal',
  alertsToday: 0,
  checkedAt:   null,
};

export function ConnectivityProvider({ children }) {
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [lastChecked, setLastChecked] = useState(null);

  const handleStatus = useCallback((s) => {
    setStatus(s);
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    startPolling(handleStatus, 30000);
    return () => stopPolling();
  }, [handleStatus]);

  const refresh = useCallback(async () => {
    const s = await checkAll();
    handleStatus(s);
  }, [handleStatus]);

  return (
    <ConnectivityContext.Provider value={{ status, lastChecked, refresh }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  return useContext(ConnectivityContext);
}
