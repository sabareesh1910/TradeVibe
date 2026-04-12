import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, StatusBar
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import ConnectivityBar from '../components/ConnectivityBar';
import { C, actionColor, actionDim, actionBorder } from '../utils/colors';
import { timeAgo, formatPrice } from '../utils/formatters';
import { useConnectivity } from '../context/ConnectivityContext';

const FILTERS = ['ALL', 'BUY', 'SELL', 'ALERT', 'HIGH'];

export default function HomeScreen({ navigation }) {
  const [alerts, setAlerts]     = useState([]);
  const [filter, setFilter]     = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const { status } = useConnectivity();

  useEffect(() => {
    const unsub = firestore()
      .collection('alerts')
      .orderBy('receivedAt', 'desc')
      .limit(100)
      .onSnapshot(snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAlerts(data);
      }, err => console.log('Firestore error:', err));
    return unsub;
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filtered = alerts.filter(a => {
    if (filter === 'ALL')   return true;
    if (filter === 'HIGH')  return a.priority === 'HIGH';
    return a.action === filter;
  });

  const today = alerts.filter(a => {
    if (!a.receivedAt) return false;
    const d = a.receivedAt.toDate ? a.receivedAt.toDate() : new Date(a.receivedAt);
    return Date.now() - d.getTime() < 86400000;
  }).length;

  const unacked = alerts.filter(a => !a.acknowledged).length;

  function AlertRow({ item }) {
    const color  = actionColor(item.action);
    const dim    = actionDim(item.action);
    const border = actionBorder(item.action);
    const isUnacked = !item.acknowledged;

    return (
      <TouchableOpacity
        style={[s.row, { borderLeftColor: isUnacked ? C.AMBER : color, backgroundColor: isUnacked ? '#0f0f20' : C.SURFACE }]}
        onPress={() => navigation.navigate('AlertDetail', { alert: item })}
        activeOpacity={0.8}
      >
        <View style={s.rowTop}>
          <Text style={s.ticker}>{item.ticker}</Text>
          <View style={[s.badge, { backgroundColor: dim, borderColor: border }]}>
            <Text style={[s.badgeText, { color }]}>{item.action}</Text>
          </View>
          {item.acknowledged && <Text style={s.ackMark}>✓</Text>}
        </View>
        <Text style={s.price}>
          {formatPrice(item.price, item.ticker)}
          {item.exchange ? ` · ${item.exchange}` : ''}
          {item.interval ? ` · ${item.interval}` : ''}
        </Text>
        <View style={s.rowBottom}>
          <Text style={s.timeText}>{timeAgo(item.receivedAt)}</Text>
          {item.priority === 'HIGH' && (
            <View style={s.highBadge}><Text style={s.highText}>HIGH</Text></View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.BG} />
      <ConnectivityBar />

      <View style={s.header}>
        <View>
          <Text style={s.title}>TradeVibe</Text>
          <Text style={s.subtitle}>{new Date().toLocaleDateString('en-IN', { weekday:'short', day:'2-digit', month:'short' })}</Text>
        </View>
        <TouchableOpacity style={s.gearBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={s.gearIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statNum}>{today}</Text>
          <Text style={s.statLabel}>alerts today</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statNum, { color: unacked > 0 ? C.RED : C.WHITE }]}>{unacked}</Text>
          <Text style={s.statLabel}>unacknowledged</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.pill, filter === f && { backgroundColor: C.GREEN_DIM, borderColor: C.GREEN }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.pillText, { color: filter === f ? C.GREEN : C.GRAY2 }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionLabel}>RECENT ALERTS</Text>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <AlertRow item={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.GREEN} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No alerts yet</Text>
            <Text style={s.emptySubText}>Configure TradingView webhook to start receiving alerts</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.BG },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title:       { fontSize: 22, fontWeight: '700', color: C.WHITE, letterSpacing: -0.5 },
  subtitle:    { fontSize: 11, color: C.GRAY2, marginTop: 1 },
  gearBtn:     { width: 36, height: 36, borderRadius: 8, backgroundColor: C.SURFACE, borderWidth: 1, borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center' },
  gearIcon:    { fontSize: 16, color: C.GRAY1 },
  statsRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  statCard:    { flex: 1, backgroundColor: C.SURFACE, borderRadius: 8, borderWidth: 1, borderColor: C.BORDER, padding: 10 },
  statNum:     { fontSize: 24, fontWeight: '700', color: C.WHITE },
  statLabel:   { fontSize: 10, color: C.GRAY2, marginTop: 2 },
  filterRow:   { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 10, flexWrap: 'wrap' },
  pill:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: C.BORDER },
  pillText:    { fontSize: 11, fontWeight: '600' },
  sectionLabel:{ paddingHorizontal: 16, paddingVertical: 4, fontSize: 9, color: C.GRAY3, letterSpacing: 1.5 },
  row:         { marginHorizontal: 16, marginBottom: 6, backgroundColor: C.SURFACE, borderRadius: 8, borderWidth: 1, borderColor: C.BORDER, borderLeftWidth: 3, padding: 10 },
  rowTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  ticker:      { fontSize: 14, fontWeight: '700', color: C.WHITE, flex: 1 },
  badge:       { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  badgeText:   { fontSize: 9, fontWeight: '700' },
  ackMark:     { fontSize: 12, color: C.GREEN },
  price:       { fontSize: 12, color: C.GRAY1, fontVariant: ['tabular-nums'], marginBottom: 4 },
  rowBottom:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText:    { fontSize: 10, color: C.GRAY2 },
  highBadge:   { backgroundColor: '#1a0800', borderWidth: 1, borderColor: '#ff6600', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  highText:    { fontSize: 8, color: '#ff6600', fontWeight: '700' },
  empty:       { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText:   { fontSize: 16, color: C.GRAY2, marginBottom: 8 },
  emptySubText:{ fontSize: 12, color: C.GRAY3, textAlign: 'center' },
});
