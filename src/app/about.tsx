import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDataSettings } from '@/context/data-settings';
import { loadPublicReports, normalizePrivateLanUrl } from '@/lib/public-reports';

export default function AboutScreen() {
  const { mode, setMode, backendUrl, setBackendUrl } = useDataSettings();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState('');

  async function testConnection() {
    setChecking(true);
    setResult('');
    try {
      const count = (await loadPublicReports(backendUrl)).length;
      setResult('Connected to the development backend. ' + count + ' fictional reports available.');
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Could not reach the backend.');
    } finally { setChecking(false); }
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>TOWNSHIP INTELLIGENCE</Text>
      <Text style={s.title}>About & Connection</Text>
      <View style={s.card}>
        <Text style={s.heading}>Resident mobile prototype</Text>
        <Text style={s.body}>An academic demonstration for Bandar Bukit Raja. All reports are fictional, not verified conditions or travel guidance.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Report data source</Text>
        <View style={s.switchRow}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'mock' }} onPress={() => setMode('mock')} style={[s.choice, mode === 'mock' && s.active]}><Text style={[s.choiceText, mode === 'mock' && s.activeText]}>Mock Demo</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'local' }} onPress={() => setMode('local')} style={[s.choice, mode === 'local' && s.active]}><Text style={[s.choiceText, mode === 'local' && s.activeText]}>Local Backend</Text></Pressable>
        </View>
        <Text style={s.body}>{mode === 'mock' ? 'Bundled sample reports. Nothing is sent to management.' : 'Reads fictional reports from your Windows PC. Submission still stays in preview mode.'}</Text>
        <Text style={s.hint}>Mode and address are kept in memory and reset when the application restarts.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Check your PC connection</Text>
        <Text style={s.body}>Connect both devices to trusted private Wi-Fi. Use the PC IPv4 address; never use localhost on your iPhone.</Text>
        <TextInput style={s.input} accessibilityLabel="PC backend address" value={backendUrl} onChangeText={setBackendUrl} placeholder="http://192.168.1.23:3000" placeholderTextColor="#94a3b8" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        <Pressable accessibilityRole="button" disabled={checking || !normalizePrivateLanUrl(backendUrl)} onPress={() => void testConnection()} style={[s.button, (checking || !normalizePrivateLanUrl(backendUrl)) && s.disabled]}>
          {checking ? <ActivityIndicator color="#fff"/> : <Text style={s.buttonText}>Test connection</Text>}
        </Pressable>
        {result ? <Text accessibilityRole="text" style={s.result}>{result}</Text> : null}
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Safety & privacy</Text>
        <Text style={s.body}>Fictional demonstration only. Not an emergency service, navigation app or live road monitor. Do not submit real emergencies or personal information. Operator controls, private photos and the operator key remain on the management website.</Text>
      </View>
      <Text style={s.hint}>Mobile M1 · Private-network development only</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 22, paddingTop: 24, paddingBottom: 48, gap: 16 },
  eyebrow: { fontSize: 11, color: '#0f766e', fontWeight: '800' },
  title: { fontSize: 28, color: '#0f172a', fontWeight: '800' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 19, gap: 12 },
  heading: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  body: { fontSize: 14, lineHeight: 22, color: '#475569' },
  hint: { fontSize: 12, lineHeight: 19, color: '#64748b' },
  switchRow: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, backgroundColor: '#e2e8f0' },
  active: { backgroundColor: '#0f766e' },
  choiceText: { fontWeight: '700', color: '#334155' },
  activeText: { color: '#fff' },
  input: { padding: 13, borderRadius: 12, borderColor: '#cbd5e1', borderWidth: 1, color: '#0f172a' },
  button: { padding: 15, borderRadius: 12, backgroundColor: '#0f766e', alignItems: 'center' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '800' },
  result: { color: '#0f766e', fontSize: 13, lineHeight: 19 }
});
