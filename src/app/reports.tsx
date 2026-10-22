import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MOCK_REPORTS } from '@/data/mock-reports';
import { useDataSettings } from '@/context/data-settings';
import { loadPublicReports, type PublicReport } from '@/lib/public-reports';

type DisplayReport = { id: string; category: string; description: string; impact: string; reviewState: string };
export default function ReportsScreen() {
  const { mode, backendUrl } = useDataSettings();
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  useFocusEffect(useCallback(() => { if (mode === 'local') refresh(); }, [mode, backendUrl, refresh]));
  useEffect(() => {
    if (mode !== 'local') { setError(''); setLoading(false); return; }
    let active = true;
    setLoading(true); setError('');
    loadPublicReports(backendUrl).then(items => {
      if (active) { setReports(items); setLoading(false); }
    }).catch(reason => {
      if (active) {
        setError(reason instanceof Error ? reason.message : 'Unable to load fictional reports.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [mode, backendUrl, refreshKey]);

  const visible: DisplayReport[] = mode === 'mock' ? MOCK_REPORTS : error ? [] : reports;
  const formatCategory = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, match => match.toUpperCase());
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>{mode === 'mock' ? 'MOCK DEMO · SAMPLE DATA' : 'LOCAL BACKEND · FICTIONAL REPORTS'}</Text>
      <Text style={s.title}>Community Reports</Text>
      <Text style={s.subtitle}>These examples are not real road conditions or verified closures.</Text>
      {mode === 'local' && <Pressable onPress={refresh} accessibilityRole="button" style={s.refresh}><Text style={s.refreshText}>Refresh reports</Text></Pressable>}
      {loading && mode === 'local' ? <View style={s.card}><ActivityIndicator color="#0f766e"/><Text style={s.detail}>Loading fictional reports…</Text></View> : null}
      {error && mode === 'local' ? <View style={s.errorCard}><Text style={s.errorTitle}>Could not load reports</Text><Text style={s.detail}>{error}</Text><Text style={s.detail}>No old reports are shown as current. Check your PC connection, or switch to Mock Demo under About.</Text><Pressable accessibilityRole="button" onPress={refresh} style={s.retry}><Text style={s.retryText}>Retry loading</Text></Pressable></View> : null}
      {mode === 'local' && !loading && !error && reports.length === 0 ? <View style={s.card}><Text style={s.detail}>No fictional reports on this backend yet.</Text></View> : null}
      {(!loading || mode === 'mock') && visible.map(report => <View key={report.id} style={s.card}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: selected === report.id }} onPress={() => setSelected(selected === report.id ? null : report.id)}>
          <Text style={s.category}>{formatCategory(report.category)}  {selected === report.id ? '▲' : '▼'}</Text>
          <Text style={s.detail}>Suspected impact: {formatCategory(report.impact)}</Text>
          <Text style={s.status}>{report.reviewState === 'corroborated' ? 'Human-reviewed fictional report' : 'Fictional report · not corroborated'}</Text>
        </Pressable>
        {selected === report.id ? <View style={s.expanded}><Text style={s.description}>{report.description}</Text><Text style={s.detail}>Reference: {report.id}</Text></View> : null}
      </View>)}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 22, paddingTop: 24, paddingBottom: 48, gap: 15 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b', lineHeight: 21, marginBottom: 4 },
  card: { backgroundColor: '#fff', padding: 19, borderRadius: 18, gap: 9, borderColor: '#e2e8f0', borderWidth: 1 },
  category: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  description: { fontSize: 14, lineHeight: 21, color: '#334155' },
  detail: { fontSize: 12, lineHeight: 19, color: '#64748b', marginTop: 4 },
  status: { fontSize: 12, color: '#0f766e', fontWeight: '700', marginTop: 8 },
  expanded: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  refresh: { alignSelf: 'flex-start', paddingHorizontal: 17, paddingVertical: 12, backgroundColor: '#0f766e', borderRadius: 12 },
  refreshText: { fontWeight: '800', color: '#fff' },
  errorCard: { backgroundColor: '#fff7ed', borderRadius: 18, padding: 19, gap: 10 },
  errorTitle: { color: '#9a3412', fontWeight: '800', fontSize: 15 },
  retry: { backgroundColor: '#0f766e', borderRadius: 12, padding: 13, alignSelf: 'flex-start' },
  retryText: { color: '#fff', fontWeight: '800' }
});
