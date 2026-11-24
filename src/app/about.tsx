import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NightHeader } from '@/components/laluan/night-header';
import { useDataSettings } from '@/context/data-settings';
import { FONT, GREEN, RADIUS, SLATE, TYPE } from '@/constants/night-desk';
import { loadReports, loadServiceArea } from '@/lib/laptop';
import { normalizePrivateLanUrl } from '@/lib/township';

/** Settings (24 Nov 2026): the laptop's address, remembered on this phone, and a connection check. */
export default function SettingsScreen() {
  const { backendUrl, setBackendUrl } = useDataSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const value = draft ?? backendUrl;
  const valid = !!normalizePrivateLanUrl(value);

  async function check() {
    if (!valid) return;
    setChecking(true); setResult(null);
    try {
      const url = normalizePrivateLanUrl(value)!;
      const [area, reports] = await Promise.all([loadServiceArea(url), loadReports(url)]);
      setBackendUrl(url); setDraft(null);
      setResult({ ok: true, text: `Connected to ${area.name}. ${reports.length} ${reports.length === 1 ? 'report' : 'reports'} on the map. The address is saved on this phone.` });
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : 'Could not reach the laptop.' });
    } finally { setChecking(false); }
  }

  return <View style={{ flex: 1, backgroundColor: SLATE[100] }}>
    <NightHeader subtitle="Settings" />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.heading}>Your laptop</Text>
        <Text style={s.body}>The app reads the map, reports and closures from Laluan running on your laptop. Put the phone and laptop on the same Wi-Fi, then type the laptop’s address. On Windows, run ipconfig and use the Wi-Fi IPv4 address with :3000.</Text>
        <TextInput style={s.input} accessibilityLabel="Laptop address" value={value} onChangeText={text => { setDraft(text); setResult(null); }}
          placeholder="http://192.168.1.23:3000" placeholderTextColor={SLATE[500]} autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="done" onSubmitEditing={() => void check()} />
        {!valid && value ? <Text style={s.hint}>Use http://, a home-network address (192.168…, 10…, 172.16–31…) and port 3000. Not localhost.</Text> : null}
        <Pressable accessibilityRole="button" disabled={checking || !valid} onPress={() => void check()} style={[s.button, (checking || !valid) && s.disabled]}>
          {checking ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.buttonText}>Check and save</Text>}
        </Pressable>
        {result ? <Text accessibilityLiveRegion="polite" style={[s.result, { color: result.ok ? GREEN[800] : '#8F1C13' }]}>{result.text}</Text> : null}
      </View>
      <View style={s.card}>
        <Text style={s.heading}>About Laluan</Text>
        <Text style={s.body}>Residents report road problems, the township team checks them and closes roads when needed, and everyone sees the result on one map.</Text>
        <Text style={s.body}>This is a demo: every report and closure is fictional, not a live road condition or directions. Don’t send real emergencies or personal details.</Text>
        <Text style={s.hint}>Only the laptop address is saved on this phone. Reports go to your laptop, nowhere else.</Text>
      </View>
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: { backgroundColor: '#FFFFFF', borderRadius: RADIUS.card, borderWidth: 1, borderColor: SLATE[200], padding: 16, gap: 12 },
  heading: { ...TYPE.heading, color: SLATE[900] },
  body: { ...TYPE.body, color: SLATE[600] },
  hint: { ...TYPE.small, color: SLATE[600] },
  input: { fontFamily: FONT.regular, fontSize: 17, padding: 13, borderRadius: RADIUS.control, borderColor: SLATE[300], borderWidth: 1, color: SLATE[900], backgroundColor: '#FFFFFF' },
  button: { minHeight: 50, borderRadius: RADIUS.control, backgroundColor: GREEN[800], alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontFamily: FONT.semibold, fontSize: 17 },
  result: { ...TYPE.small },
});
