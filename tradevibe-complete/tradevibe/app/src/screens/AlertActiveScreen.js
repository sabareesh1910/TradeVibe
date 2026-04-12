import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, ScrollView
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import ConnectivityBar from '../components/ConnectivityBar';
import { stopVibration, startVibration } from '../services/vibration';
import { useAlerts } from '../context/AlertContext';
import { C, actionColor, actionDim, actionBorder } from '../utils/colors';
import { formatPrice, formatTimestamp } from '../utils/formatters';
import { getConfig } from '../config/constants';

export default function AlertActiveScreen({ navigation, route }) {
  const { currentAlert, pendingCount, acknowledgeAlert } = useAlerts();
  const alert = route.params?.alert || currentAlert;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef  = useRef(null);
  const [vibrating, setVibrating] = useState(true);
  const [timeAgoSecs, setTimeAgoSecs] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    async function init() {
      const config = await getConfig();
      startVibration(config.pattern || 'CONTINUOUS');
      setVibrating(true);
    }
    init();
    startPulse();

    timerRef.current = setInterval(() => {
      if (alert?.timestamp) {
        const secs = Math.floor((Date.now() - parseInt(alert.timestamp)) / 1000);
        setTimeAgoSecs(secs);
      }
    }, 1000);

    return () => {
      stopVibration();
      if (pulseRef.current) pulseRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startPulse() {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 400, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();
  }

  function handleStop() {
    stopVibration();
    setVibrating(false);
    if (pulseRef.current) pulseRef.current.stop();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
  }

  async function handleAck() {
    stopVibration();
    if (pulseRef.current) pulseRef.current.stop();
    if (alert?.alertId) {
      try {
        await firestore().collection('alerts').doc(alert.alertId).update({
          acknowledged: true,
          acknowledgedAt: firestore.FieldValue.serverTimestamp()
        });
      } catch (e) { console.log('ack error', e); }
      acknowledgeAlert(alert.alertId);
    }
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  if (!alert) {
    navigation.replace('Home');
    return null;
  }

  const color  = actionColor(alert.action);
  const dim    = actionDim(alert.action);
  const border = actionBorder(alert.action);

  const latencyColor = timeAgoSecs < 5 ? C.GREEN : timeAgoSecs < 30 ? C.AMBER : C.RED;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.BG} />
      <ConnectivityBar />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.incomingLabel}>INCOMING ALERT</Text>

        <View style={[s.tickerPill, { backgroundColor: dim, borderColor: border }]}>
          <Text style={[s.tickerText, { color }]}>{alert.ticker}</Text>
        </View>

        <Animated.View style={[s.pulseRing, { borderColor: color, transform: [{ scale: pulseAnim }] }]}>
          <View style={[s.pulseInner, { backgroundColor: dim }]}>
            <Text style={[s.actionText, { color }]}>{alert.action}</Text>
            {alert.priority === 'HIGH' && <Text style={[s.priorityText, { color }]}>HIGH</Text>}
          </View>
        </Animated.View>

        <Text style={s.price}>{formatPrice(alert.price, alert.ticker)}</Text>

        {(alert.exchange || alert.interval) && (
          <Text style={s.exchangeRow}>
            {[alert.exchange, alert.interval].filter(Boolean).join(' · ')}
          </Text>
        )}

        {alert.message ? <Text style={s.message} numberOfLines={2}>{alert.message}</Text> : null}

        <Text style={[s.timeAgo, { color: latencyColor }]}>
          {timeAgoSecs < 5 ? 'Just now' : `Received ${timeAgoSecs}s ago`}
        </Text>

        {pendingCount > 0 && (
          <View style={s.pendingBadge}>
            <View style={s.pendingDot} />
            <Text style={s.pendingText}>+{pendingCount} more alert{pendingCount > 1 ? 's' : ''}</Text>
          </View>
        )}

        {!vibrating && (
          <View style={s.stoppedBadge}>
            <Text style={s.stoppedText}>Vibration stopped</Text>
          </View>
        )}

        <View style={s.buttons}>
          <TouchableOpacity style={s.stopBtn} onPress={handleStop} activeOpacity={0.8}>
            <Text style={s.stopText}>⬛  STOP VIBRATION</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.ackBtn} onPress={handleAck} activeOpacity={0.8}>
            <Text style={s.ackText}>✓  ACKNOWLEDGE</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={s.historyLink}>View all alerts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.BG },
  scroll:        { alignItems: 'center', paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20 },
  incomingLabel: { fontSize: 9, color: C.GRAY3, letterSpacing: 2, marginBottom: 12 },
  tickerPill:    { borderRadius: 20, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 6, marginBottom: 20 },
  tickerText:    { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  pulseRing:     { width: 130, height: 130, borderRadius: 65, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  pulseInner:    { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  actionText:    { fontSize: 18, fontWeight: '700' },
  priorityText:  { fontSize: 9, fontWeight: '700', opacity: 0.7, marginTop: 2 },
  price:         { fontSize: 34, fontWeight: '700', color: C.WHITE, fontVariant: ['tabular-nums'], letterSpacing: -1, marginBottom: 6 },
  exchangeRow:   { fontSize: 11, color: C.GRAY2, marginBottom: 6 },
  message:       { fontSize: 12, color: C.GRAY1, fontStyle: 'italic', textAlign: 'center', marginBottom: 8, paddingHorizontal: 10 },
  timeAgo:       { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  pendingBadge:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.AMBER_DIM, borderWidth: 1, borderColor: C.AMBER_BORDER, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12, gap: 6 },
  pendingDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: C.AMBER },
  pendingText:   { fontSize: 11, color: C.AMBER, fontWeight: '600' },
  stoppedBadge:  { backgroundColor: C.SURFACE, borderWidth: 1, borderColor: C.BORDER, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  stoppedText:   { fontSize: 11, color: C.GRAY2 },
  buttons:       { width: '100%', marginTop: 8, gap: 8 },
  stopBtn:       { backgroundColor: C.RED_DIM, borderWidth: 1, borderColor: C.RED, borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  stopText:      { fontSize: 14, fontWeight: '700', color: C.RED, letterSpacing: 1 },
  ackBtn:        { backgroundColor: C.GREEN_DIM, borderWidth: 1, borderColor: C.GREEN, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  ackText:       { fontSize: 13, fontWeight: '600', color: C.GREEN },
  historyLink:   { textAlign: 'center', fontSize: 12, color: C.BLUE, paddingVertical: 8 },
});
