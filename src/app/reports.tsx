import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { NightHeader } from '@/components/laluan/night-header';
import { HazardPin } from '@/components/laluan/hazard-pin';
import { useDataSettings } from '@/context/data-settings';
import { FONT, NIGHT, RADIUS, SLATE, TAB_BAR_SPACE, TYPE } from '@/constants/night-desk';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadStatuses } from '@/lib/laptop';
import { readMyReports } from '@/lib/my-reports-store';
import { categoryLabel, lifecycleOf, sentLabel, statusLine, type ReportStatus, type StoredReport } from '@/lib/township';

/**
 * My reports (part 2 of the phone rebuild, 24 Nov 2026): what happened to the problems sent from
 * this phone, with the same four-step track as the website. Checked again every time the tab opens.
 */
export default function MyReportsScreen() {
  const router = useRouter();
  const { backendUrl } = useDataSettings();
  const [mine, setMine] = useState<StoredReport[] | null>(null);
  const [statuses, setStatuses] = useState<Map<string, ReportStatus> | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    const list = await readMyReports();
    setMine(list);
    if (list.length === 0) { setStatuses(new Map()); return; }
    try {
      const found = await loadStatuses(backendUrl, list.map(r => r.id));
      setStatuses(new Map(found.map(st => [st.id, st]))); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not reach the laptop.'); }
  }, [backendUrl]);

  useFocusEffect(useCallback(() => {
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, [load]));

  return <View style={s.page}>
    <NightHeader />
    <View style={s.night}><Text accessibilityRole="header" style={s.nightTitle}>My reports</Text>
      <Text style={s.nightSub}>What happened to the problems you reported</Text></View>
    <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + TAB_BAR_SPACE + 16 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
      {error ? <View style={s.card}><Text style={s.cardTitle}>Progress could not be checked</Text><Text style={s.meta}>{error}</Text>
        <Pressable accessibilityRole="button" style={s.secondary} onPress={() => void load()}><Text style={s.secondaryText}>Try again</Text></Pressable></View> : null}
      {mine && mine.length === 0 ? <View style={s.card}>
        <Text style={s.cardTitle}>You haven’t sent any reports from this phone yet.</Text>
        <Text style={s.meta}>When you report a problem, it appears here so you can follow what happens to it.</Text>
        <Pressable accessibilityRole="button" style={s.primary} onPress={() => router.navigate('/submit')}><Text style={s.primaryText}>＋  Report a problem</Text></Pressable>
      </View> : null}
      {(mine ?? []).map(report => {
        const status = statuses ? statuses.get(report.id) ?? null : undefined;
        const track = lifecycleOf(status ?? undefined);
        return <View key={report.id} style={s.card}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <HazardPin category={report.category} impact={report.impact} reviewState={status?.reviewState ?? 'unverified'} size={32} />
            <View style={{ flex: 1 }}><Text style={s.cardTitle}>{categoryLabel(report.category)}</Text><Text style={s.meta}>{sentLabel(report.sentAt)}</Text></View>
          </View>
          <Track current={status === undefined ? 0 : track.current} labels={track.labels} rejected={track.rejected} />
          <Text style={[s.meta, { color: SLATE[900] }]}>{status === undefined ? 'Checking…' : statusLine(status)}</Text>
        </View>;
      })}
      <Text style={s.footnote}>Kept on this phone only. Only each report’s progress is looked up; nothing else about you is sent.</Text>
    </ScrollView>
  </View>;
}

/** Received → Being checked → Confirmed → Resolved, like the website's lifecycle track. */
function Track({ current, labels, rejected }: { current: number; labels: string[]; rejected: boolean }) {
  return <View accessibilityLabel={`Progress: ${labels[current]}`} style={{ flexDirection: 'row' }}>
    {labels.map((label, i) => {
      const done = i < current, now = i === current;
      const colour = rejected && now ? '#8F1C13' : done || now ? (now ? '#1F5A94' : SLATE[900]) : SLATE[300];
      return <View key={label} style={{ flex: 1, alignItems: 'flex-start', gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colour, backgroundColor: done ? colour : '#FFFFFF' }} />
          {i < labels.length - 1 ? <View style={{ flex: 1, height: 2, backgroundColor: done ? SLATE[900] : SLATE[200] }} /> : null}
        </View>
        <Text style={{ fontFamily: now ? FONT.semibold : FONT.regular, fontSize: 12, color: now ? colour : SLATE[600] }}>{label}</Text>
      </View>;
    })}
  </View>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: SLATE[100] },
  night: { backgroundColor: NIGHT.band, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 4 },
  nightTitle: { ...TYPE.display, color: NIGHT.text },
  nightSub: { ...TYPE.small, color: NIGHT.muted },
  body: { padding: 16, gap: 12, paddingBottom: 48 },
  card: { backgroundColor: '#FFFFFF', borderRadius: RADIUS.card, borderWidth: 1, borderColor: SLATE[200], padding: 14, gap: 12 },
  cardTitle: { ...TYPE.heading, color: SLATE[900] },
  meta: { ...TYPE.small, color: SLATE[600] },
  primary: { minHeight: 50, borderRadius: RADIUS.control, backgroundColor: NIGHT.bar, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 18 },
  primaryText: { color: '#FFFFFF', fontFamily: FONT.semibold, fontSize: 16 },
  secondary: { minHeight: 46, borderRadius: RADIUS.control, borderWidth: 1, borderColor: SLATE[200], alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 16 },
  secondaryText: { color: SLATE[900], fontFamily: FONT.semibold, fontSize: 15 },
  footnote: { ...TYPE.caption, color: SLATE[600] },
});
