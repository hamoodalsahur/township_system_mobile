import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MOCK_REPORTS } from '@/data/mock-reports';
import { useDataSettings } from '@/context/data-settings';
import { loadPublicReports, type PublicReport } from '@/lib/public-reports';

type DisplayReport = {
  id: string; category: string; description: string;
  impact: string; reviewState: string;
};
type StatusFilter = 'all' | 'unverified' | 'corroborated';
type CategoryFilter = 'all' | 'flooding' | 'roadworks' | 'fallen_tree' | 'pothole' | 'road_obstruction' | 'storm_damage' | 'other';
const categoryFilters: readonly { value: CategoryFilter; title: string }[] = [
  { value: 'all', title: 'All categories' },
  { value: 'flooding', title: 'Flooding' },
  { value: 'fallen_tree', title: 'Fallen Tree' },
  { value: 'pothole', title: 'Pothole' },
  { value: 'roadworks', title: 'Roadworks' },
  { value: 'road_obstruction', title: 'Road Obstruction' },
  { value: 'storm_damage', title: 'Storm Damage' },
  { value: 'other', title: 'Other' }
];
const normalizedCategory = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, '_');
const statusFilters: readonly { value: StatusFilter; title: string }[] = [
  { value: 'all', title: 'All reports' },
  { value: 'unverified', title: 'Awaiting review' },
  { value: 'corroborated', title: 'Human reviewed' }
];
const display = (text: string) => text.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

export default function ReportsScreen() {
  const { mode, backendUrl } = useDataSettings();
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);
  useFocusEffect(useCallback(() => { if (mode === 'local') refresh(); }, [mode, backendUrl, refresh]));

  useEffect(() => {
    setSelected(null);
    if (mode !== 'local') {
      setError(''); setLoading(false); setReports([]);
      return;
    }
    let active = true;
    setLoading(true); setError(''); setReports([]);
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

  const available: DisplayReport[] = mode === 'mock' ? MOCK_REPORTS : !loading && !error ? reports : [];
  const visible = useMemo(() => available.filter(report => {
    const statusMatch = status === 'all' || (status === 'corroborated' ? report.reviewState === 'corroborated' : report.reviewState !== 'corroborated');
    const text = search.trim().toLowerCase();
    const categoryMatch = categoryFilter === 'all' || normalizedCategory(report.category) === categoryFilter;
    return statusMatch && categoryMatch && (!text || [report.category, report.description, report.id, report.impact].some(value => value.toLowerCase().includes(text)));
  }), [available, status, categoryFilter, search]);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>{mode === 'mock' ? 'MOCK DEMO · SAMPLE DATA' : 'LOCAL BACKEND · FICTIONAL REPORTS'}</Text>
      <Text style={s.title}>Community Reports</Text>
      <Text style={s.subtitle}>Explore fictional scenarios. These are not verified road conditions or closures.</Text>
      {mode === 'local' && <Pressable onPress={refresh} accessibilityRole="button" style={s.refresh}><Text style={s.refreshText}>Refresh reports</Text></Pressable>}

      <View style={s.filters}>
        <Text style={s.filterLabel}>Find a fictional report</Text>
        <TextInput accessibilityLabel="Search report descriptions and categories" value={search} onChangeText={setSearch} placeholder="Search category, ID or description" autoCorrect={false} style={s.input} placeholderTextColor="#94a3b8" />
        <Text style={s.filterSubheading}>Report category</Text>
        <View style={s.options}>{categoryFilters.map(option => (
          <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: categoryFilter === option.value }} onPress={() => setCategoryFilter(option.value)} style={[s.option, categoryFilter === option.value && s.active]}>
            <Text style={[s.optionText, categoryFilter === option.value && s.activeText]}>{option.title}</Text>
          </Pressable>
        ))}</View>
        <Text style={s.filterSubheading}>Review status</Text>
        <View style={s.options}>{statusFilters.map(option => (
          <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: status === option.value }} onPress={() => setStatus(option.value)} style={[s.option, status === option.value && s.active]}>
            <Text style={[s.optionText, status === option.value && s.activeText]}>{option.title}</Text>
          </Pressable>
        ))}</View>
      </View>

      {loading && mode === 'local' ? <View style={s.card}><ActivityIndicator color="#0f766e"/><Text style={s.detail}>Loading fictional reports…</Text></View> : null}
      {error && mode === 'local' ? <View style={s.errorCard}><Text style={s.errorTitle}>Could not load reports</Text><Text style={s.detail}>{error}</Text><Text style={s.detail}>No previously loaded reports are shown as current. Check the PC connection under About.</Text><Pressable accessibilityRole="button" onPress={refresh} style={s.retry}><Text style={s.retryText}>Retry loading</Text></Pressable></View> : null}

      {!loading && !error ? (
        <>
          <Text style={s.count}>Showing {visible.length} of {available.length} fictional reports</Text>
          {visible.length === 0 && <View style={s.card}><Text style={s.category}>{available.length === 0 ? 'No fictional reports yet' : 'No matching reports'}</Text><Text style={s.detail}>{available.length === 0 ? 'This data source has no reports to show.' : 'Try changing the search, category or review filter.'}</Text></View>}
          {visible.map(report => <View key={report.id} style={s.card}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: selected === report.id }} onPress={() => setSelected(selected === report.id ? null : report.id)}>
              <Text style={s.category}>{display(report.category)}  {selected === report.id ? '▲' : '▼'}</Text>
              <Text style={s.detail}>Suspected impact: {display(report.impact)}</Text>
              <Text style={s.status}>{report.reviewState === 'corroborated' ? 'Human-reviewed fictional report' : 'Not corroborated · Fictional report'}</Text>
            </Pressable>
            {selected === report.id ? <View style={s.expanded}><Text style={s.description}>{report.description}</Text><Text style={s.detail}>Reference: {report.id}</Text></View> : null}
          </View>)}
        </>
      ) : null}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 22, paddingTop: 24, paddingBottom: 48, gap: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b', lineHeight: 20 },
  count: { color: '#64748b', fontSize: 12 },
  filters: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 12 },
  filterLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  filterSubheading: { color: '#475569', fontSize: 12, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 12, color: '#0f172a' },
  options: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  option: { backgroundColor: '#e2e8f0', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10 },
  active: { backgroundColor: '#0f766e' },
  optionText: { color: '#334155', fontWeight: '700', fontSize: 12 },
  activeText: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 18, gap: 9, borderWidth: 1, borderColor: '#e2e8f0' },
  category: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  description: { color: '#334155', fontSize: 14, lineHeight: 21 },
  detail: { color: '#64748b', fontSize: 12, lineHeight: 19, marginTop: 3 },
  status: { color: '#0f766e', fontSize: 12, fontWeight: '700', marginTop: 8 },
  expanded: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  refresh: { alignSelf: 'flex-start', paddingHorizontal: 17, paddingVertical: 12, backgroundColor: '#0f766e', borderRadius: 12 },
  refreshText: { color: '#fff', fontWeight: '800' },
  errorCard: { backgroundColor: '#fff7ed', borderRadius: 18, padding: 19, gap: 10 },
  errorTitle: { color: '#9a3412', fontSize: 15, fontWeight: '800' },
  retry: { backgroundColor: '#0f766e', borderRadius: 12, padding: 13, alignSelf: 'flex-start' },
  retryText: { color: '#fff', fontWeight: '800' }
});
