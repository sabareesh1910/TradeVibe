import { getConfig } from '../config/constants';

let _pollingInterval = null;
let _firestoreUnsub = null;

export async function checkAll() {
  const config = await getConfig();

  // Check Firebase connectivity
  let firebase = 'disconnected';
  let webhook  = { status: 'no_signal', lastPing: null, minutesAgo: null };
  let fcm      = { registered: false, lastSeen: null };
  let alertsToday = 0;

  try {
    if (!config.statusUrl) {
      return {
        firebase: 'disconnected',
        fcm: { status: 'not_registered' },
        webhook: { status: 'no_signal', lastPing: null, minutesAgo: null },
        tradingview: 'no_signal',
        alertsToday: 0,
        checkedAt: new Date(),
        error: 'Status URL not configured'
      };
    }

    const resp = await fetch(config.statusUrl, { timeout: 8000 });
    if (resp.ok) {
      firebase = 'connected';
      const data = await resp.json();

      if (data.fcm) {
        fcm = {
          status: data.fcm.registered ? 'registered' : 'not_registered',
          lastSeen: data.fcm.lastSeen ? new Date(data.fcm.lastSeen) : null
        };
      }

      if (data.webhook && data.webhook.lastPing) {
        const lastPing = new Date(data.webhook.lastPing);
        const minutesAgo = Math.floor((Date.now() - lastPing.getTime()) / 60000);
        webhook = {
          status: minutesAgo < 5 ? 'active' : minutesAgo < 60 ? 'idle' : 'no_signal',
          lastPing,
          minutesAgo
        };
      }

      alertsToday = data.alertsToday || 0;
    }
  } catch (err) {
    console.log('Status check failed:', err.message);
    firebase = 'disconnected';
  }

  const tvStatus = webhook.minutesAgo !== null
    ? (webhook.minutesAgo < 10 ? 'live' : webhook.minutesAgo < 60 ? 'waiting' : 'no_signal')
    : 'no_signal';

  return {
    firebase,
    fcm,
    webhook,
    tradingview: tvStatus,
    alertsToday,
    checkedAt: new Date()
  };
}

export function startPolling(callback, intervalMs = 30000) {
  checkAll().then(callback);
  _pollingInterval = setInterval(() => checkAll().then(callback), intervalMs);
}

export function stopPolling() {
  if (_pollingInterval) clearInterval(_pollingInterval);
  if (_firestoreUnsub) _firestoreUnsub();
}

export function getStatusLabel(service, status) {
  const labels = {
    firebase: { connected: 'Connected', disconnected: 'Disconnected' },
    fcm:      { registered: 'Registered', not_registered: 'Not registered', refreshing: 'Refreshing' },
    webhook:  { active: 'Active', idle: 'Idle', no_signal: 'No signal' },
    tradingview: { live: 'Live', waiting: 'Waiting', no_signal: 'No signal' },
  };
  return (labels[service] && labels[service][status]) || status;
}
