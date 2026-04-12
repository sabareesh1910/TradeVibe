import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import ConnectivityBar from '../components/ConnectivityBar';
import { C, actionColor, actionDim, actionBorder } from '../utils/colors';
import { formatPrice, formatTimestamp, formatLatency } from '../utils/formatters';

export default function AlertDetailScreen({ navigation, route }) {
  const { alert } = route.params;
  const color  = actionColor(alert.action);
  const dim    = actionDim(alert.action);
  const border = actionBorder(alert.action);

  const receivedAt = alert.receivedAt?.toDate ? alert.receivedAt.toDate() : new Date(parseInt(alert.timestamp || 0));
  const latencyMs  = alert.timestamp ? receivedAt.getTime() - parseInt(alert.timestamp) : null;

  async function acknowledge() {
    try {
      await firestore().collection('alerts').doc(alert.id).update({
        acknowledged: true,
        acknowledgedAt: firestore.FieldValue.serverTimestamp()
      });
      Alert.alert('Acknowledged', 'Alert marked as acknowledged.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  const Field = ({ label, value, valueColor }) => (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={[s.fieldValue, valueColor && { color: valueColor }]}>{value || '—'}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.BG} />
      <ConnectivityBar />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{alert.ticker} Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll}>
        <View style={s.card}>
          <View style={s.topRow}>
            <View style={[s.badge, { backgroundColor: dim, borderColor: border }]}>
              <Text style={[s.badgeText, { color }]}>{alert.action}</Text>
            </View>
            <Text style={[s.bigPrice, { color }]}>{formatPrice(alert.price, alert.ticker)}</Text>
          </View>

          <View style={s.divider} />

          <Field label="Ticker"   value={alert.ticker} />
          <Field label="Exchange" value={alert.exchange} />
          <Field label="Interval" value={alert.interval} />
          <Field label="Priority" value={alert.priority} valueColor={alert.priority === 'HIGH' ? '#ff6600' : C.GRAY1} />
          <Field label="Message"  value={alert.message} />

          <View style={s.divider} />

          <Field label="Received at"  value={formatTimestamp(alert.receivedAt)} />
          {latencyMs && latencyMs > 0 && (
            <Field label="Delivered in" value={formatLatency(latencyMs)} valueColor={latencyMs < 5000 ? C.GREEN : latencyMs < 30000 ? C.AMBER : C.RED} />
          )}
          {alert.acknowledged && (
            <Field label="Acknowledged" value={formatTimestamp(alert.acknowledgedAt)} valueColor={C.GREEN} />
          )}
        </View>

        {!alert.acknowledged && (
          <TouchableOpacity style={s.ackBtn} onPress={acknowledge}>
            <Text style={s.ackText}>✓  Acknowledge this alert</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 10 },
  backBtn:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText:  { fontSize: 20, color: C.WHITE },
  title:     { fontSize: 16, fontWeight: '700', color: C.WHITE },
  scroll:    { paddingHorizontal: 16 },
  card:      { backgroundColor: C.SURFACE, borderRadius: 10, borderWidth: 1, borderColor: C.BORDER, padding: 16, marginBottom: 12 },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  badge:     { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  bigPrice:  { fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
  divider:   { height: 1, backgroundColor: C.BORDER, marginVertical: 12 },
  field:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  fieldLabel:{ fontSize: 11, color: C.GRAY2 },
  fieldValue:{ fontSize: 12, color: C.GRAY1, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 16 },
  ackBtn:    { backgroundColor: C.GREEN_DIM, borderWidth: 1, borderColor: C.GREEN, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  ackText:   { color: C.GREEN, fontSize: 14, fontWeight: '600' },
});
