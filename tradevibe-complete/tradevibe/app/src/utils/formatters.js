export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5)  return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60)    return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)     return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

export function formatPrice(price, ticker = '') {
  const num = parseFloat(price);
  if (isNaN(num)) return String(price);
  const isIndia = /NIFTY|BANKNIFTY|NSE|BSE|INR/.test(String(ticker).toUpperCase());
  if (isIndia) {
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  if (num > 1000) {
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return '$' + num.toFixed(4);
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
}

export function latencyColor(ms) {
  if (ms < 5000)  return '#00ff88';
  if (ms < 30000) return '#ffaa00';
  return '#ff4444';
}

export function formatLatency(ms) {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function shortToken(token) {
  if (!token || token.length < 20) return token || 'Not registered';
  return token.substring(0, 20) + '...';
}
