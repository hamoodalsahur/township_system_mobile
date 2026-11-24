import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useDemoLocation } from '@/context/demo-location';
import { useTownship } from '@/hooks/use-township';
import { NightHeader } from '@/components/laluan/night-header';
import { HazardPin } from '@/components/laluan/hazard-pin';
import { ClosureLines } from '@/components/laluan/closure-lines';
import { ClosureChip, ReviewChip, SeverityChip } from '@/components/laluan/chips';
import { RouteLines, WayHomeCard } from '@/components/laluan/way-home';
import { useWayHome } from '@/hooks/use-way-home';
import { FONT, GREEN, NIGHT, RADIUS, SLATE, TAB_BAR_SPACE, TYPE } from '@/constants/night-desk';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { boundsOf, categoryLabel, closuresKey, isInsideArea, regionFor, reportsForMap, toLatLng, untilLabel, type LonLat } from '@/lib/township';

/**
 * Map (Night Desk rebuild, 24 Nov 2026): the laptop's own area, its reports and road closures,
 * like the website's resident map. "Report a problem" asks for a tap on the map, then opens the report form.
 */
export default function MapScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { area, reports, closures, loading, error, reload, backendUrl } = useTownship();
  const { chooseLocation } = useDemoLocation();
  const mapRef = useRef<MapView>(null);
  // What a tap on the map means: a report's spot, or (way home) home, then the usual starting place.
  const [picking, setPicking] = useState<null | 'report' | 'home' | 'start'>(null);
  const [newHome, setNewHome] = useState<LonLat | null>(null);
  const way = useWayHome(closuresKey(closures));
  const [hint, setHint] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer); }, []);

  const shown = useMemo(() => reportsForMap(reports, area), [reports, area]);
  const outer = area?.rings[0] ?? null;
  const sheetHeight = Math.round(height * 0.4);
  const fitted = useRef<string | null>(null);

  // Fit the whole area once per area, leaving room for the sheet.
  useEffect(() => {
    if (!outer || !area || fitted.current === area.id) return;
    fitted.current = area.id;
    mapRef.current?.fitToCoordinates(outer.map(toLatLng), { edgePadding: { top: 40, right: 30, bottom: sheetHeight + 20, left: 30 }, animated: false });
  }, [area, outer, sheetHeight]);

  const initialRegion = outer ? regionFor(boundsOf(outer)!) : { latitude: 3.087, longitude: 101.433, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  function focus(id: string) {
    const report = shown.find(r => r.id === id);
    setSelectedId(id);
    if (report) mapRef.current?.animateToRegion({ latitude: report.latitude, longitude: report.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 400);
  }

  // Show the whole trip after each answer, below the way-home card and above the sheet.
  const shownAt = useRef<string | null>(null);
  useEffect(() => {
    const answer = way.answer;
    if (!answer || shownAt.current === answer.checkedAt) return;
    shownAt.current = answer.checkedAt;
    const points = [...(answer.usual?.coordinates ?? []), ...(answer.detour?.coordinates ?? [])];
    if (points.length) mapRef.current?.fitToCoordinates(points.map(toLatLng), { edgePadding: { top: 230, right: 40, bottom: sheetHeight + 30, left: 40 }, animated: true });
  }, [way.answer, sheetHeight]);

  const noAddress = !backendUrl;
  const counts = [closures.length ? `${closures.length} ${closures.length === 1 ? 'closure' : 'closures'}` : '', `${shown.length} ${shown.length === 1 ? 'report' : 'reports'}`].filter(Boolean).join(' · ');

  return <View style={s.page}>
    <NightHeader subtitle={area ? area.name : undefined} />
    <View style={{ flex: 1 }}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initialRegion} showsUserLocation={false} showsPointsOfInterests={false} toolbarEnabled={false}
        onPress={event => {
          if (!picking || !area) return;
          const { latitude, longitude } = event.nativeEvent.coordinate;
          if (picking === 'home') { setNewHome([longitude, latitude]); setPicking('start'); setHint(''); return; }
          if (picking === 'start') { if (newHome) void way.save({ home: newHome, start: { kind: 'place', at: [longitude, latitude] } }); setPicking(null); setNewHome(null); return; }
          if (!isInsideArea(area, longitude, latitude)) { setHint(`That spot is outside ${area.name}. Tap inside the dashed line.`); return; }
          chooseLocation({ latitude, longitude });
          setPicking(null); setHint('');
          router.navigate('/submit');
        }}>
        {area ? area.rings.slice(0, 1).map((ring, i) => <Polygon key={i} coordinates={ring.map(toLatLng)} strokeColor="#475569" strokeWidth={2} lineDashPattern={[8, 6]} fillColor="rgba(255,255,255,0)" tappable={false} />) : null}
        <RouteLines answer={picking ? null : way.answer} home={picking === 'start' ? newHome : picking ? null : way.settings?.home ?? null}
          start={picking ? null : way.settings?.start.at ?? null} />
        <ClosureLines closures={closures} now={now} />
        {shown.map(report => <Marker key={report.id} coordinate={{ latitude: report.latitude, longitude: report.longitude }} anchor={{ x: 0.5, y: 0.5 }}
          onPress={() => focus(report.id)} zIndex={selectedId === report.id ? 9 : 8}>
          <HazardPin category={report.category} impact={report.impact} reviewState={report.reviewState} selected={selectedId === report.id} />
        </Marker>)}
      </MapView>

      {picking ? <View style={s.pickBanner}>
        <Text style={s.pickText}>{hint || (picking === 'home' ? 'Tap your home on the map.' : picking === 'start' ? 'Now tap where you usually set off from, like your campus.' : 'Tap the map where the problem is.')}</Text>
        <Pressable accessibilityRole="button" onPress={() => { setPicking(null); setHint(''); setNewHome(null); }} style={s.pickCancel}><Text style={s.pickCancelText}>Cancel</Text></Pressable>
      </View> : area ? <View style={s.wayHome}>
        <WayHomeCard phase={way.phase} answer={way.answer} error={way.error} onCheck={way.check}
          onSet={() => { setPicking('home'); setSelectedId(null); }} onChange={() => { setPicking('home'); setSelectedId(null); }} />
      </View> : null}

      {!picking && area ? <Pressable accessibilityRole="button" onPress={() => { setPicking('report'); setHint(''); setSelectedId(null); }}
        style={[s.reportButton, { bottom: sheetHeight + 14 }]}>
        <Text style={s.reportButtonText}>＋  Report a problem</Text>
      </Pressable> : null}

      <View style={[s.sheet, { height: sheetHeight }]}>
        <View style={s.grabber} />
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle}>On the map now</Text>
          {area && !error ? <Text style={s.sheetCount}>{counts}</Text> : null}
        </View>
        <ScrollView contentContainerStyle={[s.sheetBody, { paddingBottom: insets.bottom + TAB_BAR_SPACE + 16 }]}>
          {noAddress ? <Card title="Connect to your laptop" body="Open Settings and type the laptop's address on this Wi-Fi, like http://192.168.1.23:3000. It is remembered after that."
            action="Open Settings" onAction={() => router.navigate('/about')} /> : null}
          {!noAddress && error ? <Card title="The laptop could not be reached" body={error} action="Try again" onAction={reload} /> : null}
          {!noAddress && !error && loading && !area ? <View style={s.loading}><ActivityIndicator color={GREEN[800]} /><Text style={TYPE.small}>Loading your area…</Text></View> : null}

          {closures.length ? <Text style={s.section}>Road closures</Text> : null}
          {closures.map(closure => <View key={closure.id} style={[s.card, s.closureCard]}>
            <ClosureChip text={closure.kindLabel} />
            <Text style={s.cardTitle}>{closure.title}</Text>
            <Text style={s.cardMeta}>{untilLabel(closure.endsAt, now).replace(/^until/, 'Until')} · {closure.categoryLabel}, confirmed by the township team</Text>
          </View>)}

          {shown.length ? <Text style={s.section}>Reports</Text> : null}
          {shown.map(report => <Pressable key={report.id} accessibilityRole="button" accessibilityState={{ selected: selectedId === report.id }}
            onPress={() => focus(report.id)} style={[s.card, s.reportCard, selectedId === report.id && s.selected]}>
            <HazardPin category={report.category} impact={report.impact} reviewState={report.reviewState} size={30} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={s.cardTitle}>{categoryLabel(report.category)}</Text>
              <Text style={s.cardMeta} numberOfLines={selectedId === report.id ? undefined : 2}>{report.description}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}><SeverityChip impact={report.impact} /><ReviewChip reviewState={report.reviewState} /></View>
            </View>
          </Pressable>)}

          {area && !error && !loading && shown.length === 0 && closures.length === 0
            ? <Card title="Nothing reported right now" body={`No problems are on the map in ${area.name}. Seen one? Tap Report a problem.`} /> : null}
          <Text style={s.footnote}>Fictional demo reports. They are not live road conditions and are not directions.</Text>
        </ScrollView>
      </View>
    </View>
  </View>;
}

function Card({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <View style={s.card}>
    <Text style={s.cardTitle}>{title}</Text>
    <Text style={s.cardMeta}>{body}</Text>
    {action && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={s.secondary}><Text style={s.secondaryText}>{action}</Text></Pressable> : null}
  </View>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: NIGHT.bar },
  wayHome: { position: 'absolute', top: 10, left: 10, right: 10 },
  pickBanner: { position: 'absolute', top: 12, left: 12, right: 12, backgroundColor: NIGHT.band, borderRadius: RADIUS.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickText: { flex: 1, color: NIGHT.text, fontFamily: FONT.medium, fontSize: 15, lineHeight: 20 },
  pickCancel: { borderWidth: 1, borderColor: NIGHT.edge, borderRadius: RADIUS.control, paddingHorizontal: 12, paddingVertical: 9 },
  pickCancelText: { color: NIGHT.text, fontFamily: FONT.semibold, fontSize: 14 },
  reportButton: { position: 'absolute', right: 14, backgroundColor: GREEN[800], borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14,
    shadowColor: '#0B131B', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  reportButtonText: { color: '#FFFFFF', fontFamily: FONT.semibold, fontSize: 17 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: SLATE[100], borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet,
    shadowColor: '#0B131B', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: -2 }, elevation: 8, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: SLATE[300], marginTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: '#FFFFFF' },
  sheetTitle: { ...TYPE.title, color: SLATE[900] },
  sheetCount: { ...TYPE.small, color: SLATE[600] },
  sheetBody: { padding: 14, gap: 10, paddingBottom: 110 },
  section: { fontFamily: FONT.semibold, fontSize: 14, color: SLATE[600], marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: RADIUS.card, borderWidth: 1, borderColor: SLATE[200], padding: 14, gap: 8 },
  closureCard: { borderLeftWidth: 4, borderLeftColor: '#B42318' },
  reportCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  selected: { borderColor: GREEN[800], backgroundColor: GREEN[50] },
  cardTitle: { ...TYPE.heading, color: SLATE[900] },
  cardMeta: { ...TYPE.small, color: SLATE[600] },
  loading: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12 },
  secondary: { alignSelf: 'flex-start', borderWidth: 1, borderColor: SLATE[200], borderRadius: RADIUS.control, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  secondaryText: { fontFamily: FONT.semibold, fontSize: 15, color: SLATE[900] },
  footnote: { ...TYPE.caption, color: SLATE[600], marginTop: 6 },
});
