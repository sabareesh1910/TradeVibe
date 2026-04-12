import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Alert, Clipboard, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import ConnectivityBar from '../components/ConnectivityBar';
import { getConfig, saveConfig, STORAGE_KEYS, PATTERNS } from '../config/constants';
import { C, statusColor } from '../utils/colors';
import { useConnectivity } from '../context/ConnectivityContext';
import { startVibration, stopVibration } from '../services/vibration';
import { shortToken } from '../utils/formatters';
import DeviceInfo from 'react-native-device-info';

export default function SettingsScreen({ navigation }) {
  const { status, refresh, lastChecked } = useConnectivity();
  const [cfg, setCfg] = useState({ webhookUrl:'', registerUrl:'', statusUrl:'', secret:'tradevibe2024', pattern:'CONTINUOUS', highOnly:false });
  const [fcmToken, setFcmToken] = useState('');
  const [secretVisible, setSecretVisible] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    async function load() {
      const c = await getConfig();
      setCfg(c);
      try {
        const t = await messaging().getToken();
        if (t) setFcmToken(t);
      } catch (_) {}
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    await saveConfig(cfg);
    setSaving(false);
    Alert.alert('Saved', 'Settings saved successfully.');
    await refresh();
  }

  async function registerDevice() {
    if (!cfg.registerUrl) {
      Alert.alert('Missing URL', 'Please enter the Register Token URL first.');
      return;
    }
    setRegistering(true);
    try {
      const token    = await messaging().getToken();
      const deviceId = await DeviceInfo.getUniqueId();
      setFcmToken(token);
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);

      const resp = await fetch(cfg.registerUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, platform: 'android', deviceId })
      });
      const data = await resp.json();
      if (data.success) {
        Alert.alert('✓ Registered', 'Device successfully registered. You will now receive alerts.');
      } else {
        Alert.alert('Error', 'Registration failed: ' + JSON.stringify(data));
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setRegistering(false);
    await refresh();
  }

  async function sendTestAlert() {
    if (!cfg.webhookUrl) {
      Alert.alert('Missing URL', 'Please enter the Webhook URL first.');
      return;
    }
    setTestResult('Sending...');
    try {
      const url = `${cfg.webhookUrl}?secret=${cfg.secret}`;
      const resp = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          ticker: 'TESTUSDT', action: 'BUY', price: 99999,
          message: 'Test alert from TradeVibe',
          interval: '1m', exchange: 'TEST'
        })
      });
      const data = await resp.json();
      if (data.success) {
        setTestResult(`✓ Sent! Alert ID: ${data.alertId}\nSent to ${data.sent} device(s)`);
      } else {
        setTestResult('✗ Failed: ' + JSON.stringify(data));
      }
    } catch (err) {
      setTestResult('✗ Error: ' + err.message);
    }
  }

  function testVibration() {
    startVibration(cfg.pattern);
    setTimeout(() => stopVibration(), 3000);
  }

  const ConnRow = ({ label, svcKey, statusVal }) => {
    const col = statusColor(statusVal || 'no_signal');
    return (
      <View style={s.connRow}>
        <Text style={s.connName}>{label}</Text>
        <View style={s.connRight}>
          <View style={[s.dot, { backgroundColor: col }]} />
          <Text style={[s.connStatus, { color: col }]}>{statusVal || 'unknown'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.BG} />
      <ConnectivityBar />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
          <Text style={s.saveText}>{saving ? '...' : '✓'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Connectivity */}
        <Text style={s.sectionLabel}>CONNECTIVITY STATUS</Text>
        <View style={s.card}>
          <ConnRow label="Firebase"    statusVal={status.firebase} />
          <ConnRow label="FCM Token"   statusVal={status.fcm?.status} />
          <ConnRow label="Webhook"     statusVal={status.webhook?.status} />
          <ConnRow label="TradingView" statusVal={status.tradingview} />
          <View style={s.divider} />
          <TouchableOpacity style={s.refreshBtn} onPress={refresh}>
            <Text style={s.refreshText}>↻  Refresh status</Text>
          </TouchableOpacity>
          {lastChecked && <Text style={s.checkedAt}>Last checked: {lastChecked.toLocaleTimeString()}</Text>}
        </View>

        {/* Webhook Config */}
        <Text style={s.sectionLabel}>WEBHOOK CONFIGURATION</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Webhook URL</Text>
          <TextInput style={s.input} value={cfg.webhookUrl} onChangeText={v => setCfg(p=>({...p,webhookUrl:v}))} placeholder="https://us-central1-tradevibe-44c08.cloudfunctions.net/alertWebhook" placeholderTextColor={C.GRAY3} autoCapitalize="none" autoCorrect={false} />

          <Text style={s.fieldLabel}>Register Token URL</Text>
          <TextInput style={s.input} value={cfg.registerUrl} onChangeText={v => setCfg(p=>({...p,registerUrl:v}))} placeholder="https://us-central1-tradevibe-44c08.cloudfunctions.net/registerToken" placeholderTextColor={C.GRAY3} autoCapitalize="none" autoCorrect={false} />

          <Text style={s.fieldLabel}>Status URL</Text>
          <TextInput style={s.input} value={cfg.statusUrl} onChangeText={v => setCfg(p=>({...p,statusUrl:v}))} placeholder="https://us-central1-tradevibe-44c08.cloudfunctions.net/getStatus" placeholderTextColor={C.GRAY3} autoCapitalize="none" autoCorrect={false} />

          <Text style={s.fieldLabel}>Webhook Secret</Text>
          <View style={s.secretRow}>
            <TextInput style={[s.input, s.secretInput]} value={cfg.secret} onChangeText={v => setCfg(p=>({...p,secret:v}))} secureTextEntry={!secretVisible} autoCapitalize="none" autoCorrect={false} />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setSecretVisible(p => !p)}>
              <Text style={s.eyeText}>{secretVisible ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Push Notifications */}
        <Text style={s.sectionLabel}>PUSH NOTIFICATIONS</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>FCM Device Token</Text>
          <TouchableOpacity onPress={() => { Clipboard.setString(fcmToken); Alert.alert('Copied', 'Token copied to clipboard'); }}>
            <Text style={s.tokenText}>{shortToken(fcmToken) || 'Not registered yet'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.outlineBtn, { borderColor: C.GREEN, marginTop: 10 }, registering && {opacity:0.5}]} onPress={registerDevice} disabled={registering}>
            <Text style={[s.outlineBtnText, { color: C.GREEN }]}>{registering ? 'Registering...' : '↑  Register Device'}</Text>
          </TouchableOpacity>
        </View>

        {/* Vibration */}
        <Text style={s.sectionLabel}>VIBRATION</Text>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Pattern</Text>
          <View style={s.patternRow}>
            {Object.entries(PATTERNS).map(([key, val]) => (
              <TouchableOpacity
                key={key}
                style={[s.patternPill, cfg.pattern === key && { backgroundColor: C.GREEN_DIM, borderColor: C.GREEN }]}
                onPress={() => setCfg(p => ({...p, pattern: key}))}
              >
                <Text style={[s.patternText, { color: cfg.pattern === key ? C.GREEN : C.GRAY2 }]}>{val.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>HIGH priority only</Text>
            <Switch value={cfg.highOnly} onValueChange={v => setCfg(p=>({...p,highOnly:v}))} trackColor={{ true: C.GREEN_DIM }} thumbColor={cfg.highOnly ? C.GREEN : C.GRAY2} />
          </View>
          <TouchableOpacity style={[s.outlineBtn, { borderColor: C.AMBER, marginTop: 8 }]} onPress={testVibration}>
            <Text style={[s.outlineBtnText, { color: C.AMBER }]}>⚡  Test Vibration (3s)</Text>
          </TouchableOpacity>
        </View>

        {/* Test */}
        <Text style={s.sectionLabel}>TEST</Text>
        <View style={s.card}>
          <TouchableOpacity style={[s.outlineBtn, { borderColor: C.BLUE }]} onPress={sendTestAlert}>
            <Text style={[s.outlineBtnText, { color: C.BLUE }]}>▶  Send Test Alert</Text>
          </TouchableOpacity>
          {testResult && (
            <Text style={[s.testResult, { color: testResult.startsWith('✓') ? C.GREEN : C.RED }]}>{testResult}</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.BG },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 10 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText:     { fontSize: 20, color: C.WHITE },
  title:        { fontSize: 18, fontWeight: '700', color: C.WHITE },
  saveBtn:      { width: 36, height: 36, backgroundColor: C.GREEN_DIM, borderWidth: 1, borderColor: C.GREEN, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveText:     { color: C.GREEN, fontWeight: '700' },
  scroll:       { paddingHorizontal: 16 },
  sectionLabel: { fontSize: 9, color: C.GRAY3, letterSpacing: 1.5, marginTop: 16, marginBottom: 8 },
  card:         { backgroundColor: C.SURFACE, borderWidth: 1, borderColor: C.BORDER, borderRadius: 10, padding: 14, marginBottom: 4 },
  fieldLabel:   { fontSize: 10, color: C.GRAY2, marginBottom: 4, marginTop: 8 },
  input:        { backgroundColor: C.BG, borderWidth: 1, borderColor: C.BORDER, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: C.WHITE, fontSize: 12 },
  secretRow:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  secretInput:  { flex: 1 },
  eyeBtn:       { padding: 8 },
  eyeText:      { fontSize: 16 },
  connRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  connName:     { fontSize: 12, color: C.GRAY1 },
  connRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:          { width: 7, height: 7, borderRadius: 4 },
  connStatus:   { fontSize: 11, fontWeight: '600' },
  divider:      { height: 1, backgroundColor: C.BORDER, marginVertical: 8 },
  refreshBtn:   { alignItems: 'center', paddingVertical: 6 },
  refreshText:  { fontSize: 12, color: C.BLUE },
  checkedAt:    { fontSize: 10, color: C.GRAY3, textAlign: 'center', marginTop: 2 },
  tokenText:    { fontSize: 11, color: C.GRAY1, fontFamily: 'monospace', backgroundColor: C.BG, borderRadius: 6, padding: 8, borderWidth: 1, borderColor: C.BORDER },
  outlineBtn:   { borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  outlineBtnText:{ fontSize: 13, fontWeight: '600' },
  patternRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  patternPill:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: C.BORDER },
  patternText:  { fontSize: 11, fontWeight: '600' },
  toggleRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  toggleLabel:  { fontSize: 13, color: C.GRAY1 },
  testResult:   { marginTop: 10, fontSize: 11, lineHeight: 18 },
});
