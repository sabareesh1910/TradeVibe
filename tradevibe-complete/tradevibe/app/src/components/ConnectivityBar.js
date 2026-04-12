import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useConnectivity } from '../context/ConnectivityContext';
import { C, statusColor } from '../utils/colors';

function Dot({ color }) {
  return <View style={[s.dot, { backgroundColor: color }]} />;
}

function Item({ label, color, detail, onPress }) {
  return (
    <TouchableOpacity style={s.item} onPress={onPress} activeOpacity={0.7}>
      <Dot color={color} />
      <Text style={[s.label, { color }]}>{label}</Text>
      {detail ? <Text style={s.detail}>{detail}</Text> : null}
    </TouchableOpacity>
  );
}

export default function ConnectivityBar() {
  const { status } = useConnectivity();

  const fbColor  = statusColor(status.firebase);
  const fcmColor = statusColor(status.fcm?.status || 'not_registered');
  const whColor  = statusColor(status.webhook?.status || 'no_signal');
  const tvColor  = statusColor(status.tradingview || 'no_signal');

  const whDetail = status.webhook?.minutesAgo != null
    ? `${status.webhook.minutesAgo}m ago` : '';

  function showDetail(service) {
    const msgs = {
      firebase:    `Firebase: ${status.firebase}\nRequired for push notifications and alert storage.`,
      fcm:         `FCM: ${status.fcm?.status}\nGo to Settings → tap Register Device.`,
      webhook:     `Webhook: ${status.webhook?.status}\n${status.webhook?.lastPing ? 'Last ping: ' + new Date(status.webhook.lastPing).toLocaleTimeString() : 'No webhook received yet.'}`,
      tradingview: `TradingView: ${status.tradingview}\nPaste your webhook URL into TradingView alert settings.`,
    };
    Alert.alert(service.charAt(0).toUpperCase() + service.slice(1), msgs[service] || '');
  }

  return (
    <View style={s.bar}>
      <Item label="Firebase"    color={fbColor}  onPress={() => showDetail('firebase')} />
      <View style={s.divider} />
      <Item label="FCM"         color={fcmColor} onPress={() => showDetail('fcm')} />
      <View style={s.divider} />
      <Item label="Webhook"     color={whColor}  detail={whDetail} onPress={() => showDetail('webhook')} />
      <View style={s.divider} />
      <Item label="TradingView" color={tvColor}  onPress={() => showDetail('tradingview')} />
    </View>
  );
}

const s = StyleSheet.create({
  bar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.SURFACE, borderBottomWidth: 1, borderBottomColor: C.BORDER, height: 30, paddingHorizontal: 12 },
  item:    { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 4 },
  dot:     { width: 6, height: 6, borderRadius: 3 },
  label:   { fontSize: 9, fontWeight: '600' },
  detail:  { fontSize: 8, color: C.GRAY2, marginLeft: 2 },
  divider: { width: 1, height: 14, backgroundColor: C.BORDER2 },
});
