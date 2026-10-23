import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDemoLocation, validDemoLocation } from '@/context/demo-location';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { BBR_ROADS, BBR_ROAD_SOURCE_COUNT } from '@/data/bbr-roads.generated';
import { visibleRoads, ROAD_STYLES } from '@/lib/mobile-roads';
import { useDataSettings } from '@/context/data-settings';
import { loadPublicReports, normalizePrivateLanUrl, type PublicReport } from '@/lib/public-reports';

type MapReport = {
  id: string;
  category: string;
  description: string;
  impact: string;
  reviewState: string;
  latitude: number;
  longitude: number;
  hasApprovedPhoto: boolean;
  createdAt?: string;
};

const DEMO_LOCATIONS: MapReport[] = [
  { id: 'MOCK-A', category: 'flooding', description: 'Made-up flooding scenario. Not a real incident.', impact: 'caution', reviewState: 'unverified', latitude: 3.0876, longitude: 101.4318, hasApprovedPhoto: false },
  { id: 'MOCK-B', category: 'fallen_tree', description: 'Invented fallen-tree scenario. Not a real incident.', impact: 'partial_obstruction', reviewState: 'corroborated', latitude: 3.0891, longitude: 101.4392, hasApprovedPhoto: false },
  { id: 'MOCK-C', category: 'pothole', description: 'Sample road-surface issue. Not a real incident.', impact: 'caution', reviewState: 'unverified', latitude: 3.0833, longitude: 101.4257, hasApprovedPhoto: false }
];

const readable = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

function validCoordinate(r: PublicReport): boolean {
  return Number.isFinite(r.latitude) && Number.isFinite(r.longitude) &&
    r.latitude >= 3.06 && r.latitude <= 3.11 &&
    r.longitude >= 101.40 && r.longitude <= 101.47;
}

const DEFAULT_REGION: Region = { latitude: 3.087, longitude: 101.433, latitudeDelta: 0.025, longitudeDelta: 0.025 };

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { mode, backendUrl } = useDataSettings();
  const { chosenLocation, chooseLocation } = useDemoLocation();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const spotlightY = useRef(0);
  const [choosingLocation, setChoosingLocation] = useState(false);
  const [reportPanelOpen, setReportPanelOpen] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [photoErrorFor, setPhotoErrorFor] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState('');
  const [backendReports, setBackendReports] = useState<MapReport[]>([]);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [showRoads, setShowRoads] = useState(true);
  const roadsOnScreen = useMemo(() => showRoads ? visibleRoads(BBR_ROADS, region) : [], [region, showRoads]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const refresh = useCallback(() => setRefreshVersion(v => v + 1), []);

  useFocusEffect(useCallback(() => {
    if (mode === 'local') refresh();
  }, [mode, backendUrl, refresh]));

  useEffect(() => {
    setSelectedId(null);
    if (mode === 'mock') {
      setLoading(false);
      setError('');
      setBackendReports([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    setBackendReports([]);
    loadPublicReports(backendUrl)
      .then(reports => {
        if (!active) return;
        setBackendReports(reports.filter(validCoordinate));
        setLoading(false);
      })
      .catch(reason => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Could not load the fictional map reports.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [mode, backendUrl, refreshVersion]);

  const reports = mode === 'mock' ? DEMO_LOCATIONS : !loading && !error ? backendReports : [];
  const latest = useMemo(() => [...reports].sort((a, b) =>
    (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0)
  ), [reports]);
  const selected = latest.find(report => report.id === selectedId) ?? latest[0];
  const safeUrl = normalizePrivateLanUrl(backendUrl);
  const shown = showAllReports ? latest : latest.slice(0, 8);

  return (
    <ScrollView ref={scrollRef} style={s.page} contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}>
      <Text style={s.eyebrow}>{mode === 'mock' ? 'MOCK DEMO · SAMPLE SCENARIOS' : 'LOCAL BACKEND · FICTIONAL REPORTS'}</Text>
      <Text style={s.title}>Township Map</Text>
      <Text style={s.subtitle}>Bandar Bukit Raja · Explore fictional incident reports</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: reportPanelOpen }} style={s.reportToggle}
        onPress={() => { setReportPanelOpen(p => !p); setChoosingLocation(false); }}>
        <Text style={s.reportToggleTitle}>{reportPanelOpen ? '−' : '+'}  Report an Incident</Text>
        <Text style={s.reportToggleHint}>{reportPanelOpen ? 'Hide location selection' : 'Tap to choose a fictional report location'}</Text>
      </Pressable>
      {reportPanelOpen && <View style={s.locationPanel}>
        <Text style={s.cardTitle}>Choose an illustrative report location</Text>
        <Text style={s.body}>Choose a point, then tap an empty area of the map below. Only the fictional reporting area is allowed. Phone GPS is not used.</Text>
        <Pressable accessibilityRole="button" onPress={() => { setChoosingLocation(v => !v); setLocationHint(''); }} style={[s.refresh, choosingLocation && s.locationActive]}>
          <Text style={s.refreshText}>{choosingLocation ? 'Cancel picking' : 'Choose point on map'}</Text>
        </Pressable>
        {choosingLocation && <Text style={s.locationHint}>Selection active: tap the map directly below.</Text>}
        {locationHint ? <Text style={s.locationHint}>{locationHint}</Text> : null}
        {chosenLocation && <View style={s.chosen}>
          <Text style={s.detail}>Selected point: {chosenLocation.latitude.toFixed(5)}, {chosenLocation.longitude.toFixed(5)}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/submit')} style={s.refresh}>
            <Text style={s.refreshText}>Use in Submit</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { chooseLocation(null); setLocationHint(''); }}>
            <Text style={s.detail}>Clear selected point</Text>
          </Pressable>
        </View>}
      </View>}
      <View style={s.mapFrame}>
        <MapView
          style={s.map}
          initialRegion={DEFAULT_REGION}
          onRegionChangeComplete={setRegion}
          onPress={event => {
            if (!choosingLocation) return;
            const point = event.nativeEvent.coordinate;
            if (!validDemoLocation(point)) {
              setLocationHint('Please tap inside the fictional reporting rectangle: longitude 101.40–101.47, latitude 3.06–3.11.');
              return;
            }
            chooseLocation({ latitude: point.latitude, longitude: point.longitude });
            setLocationHint('Example location selected. You can now open Submit.');
            setChoosingLocation(false);
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {roadsOnScreen.map(road => <Polyline
            key={road.id}
            coordinates={road.coordinates.map(([latitude, longitude]) => ({ latitude, longitude }))}
            strokeColor={ROAD_STYLES[road.category].color}
            strokeWidth={ROAD_STYLES[road.category].width}
            geodesic={false}
          />)}
          {chosenLocation && <Marker
            coordinate={chosenLocation}
            pinColor="#7c3aed"
            title="Example submission location"
            description="Selected for a fictional report only"
          />}
          {reports.map(report => (
            <Marker
              key={report.id}
              coordinate={{ latitude: report.latitude, longitude: report.longitude }}
              pinColor={report.reviewState === 'corroborated' ? '#0f766e' : '#f59e0b'}
              title={readable(report.category) + ' · Fictional'}
              description={readable(report.impact) + ' · Not road guidance'}
              onPress={() => { setSelectedId(report.id); setPhotoErrorFor(null); scrollRef.current?.scrollTo({ y: spotlightY.current, animated: true }); }}
            />
          ))}
        </MapView>
        <View style={s.mapBadge} pointerEvents="none">
          <Text style={s.mapBadgeText}>FICTIONAL REPORTS ONLY</Text>
        </View>
      </View>

      <View style={s.roadToolbar}>
        <View style={s.roadSummary}>
          <Text style={s.roadTitle}>BBR blue reference roads</Text>
          <Text style={s.notice}>{BBR_ROAD_SOURCE_COUNT > 0
            ? BBR_ROAD_SOURCE_COUNT + ' OSM features · reference only'
            : 'Local reference roads have not been prepared'}</Text>
        </View>
        {BBR_ROAD_SOURCE_COUNT > 0 && <Pressable accessibilityRole="button" style={s.layerToggle} onPress={() => setShowRoads(v => !v)}>
          <Text style={s.layerText}>{showRoads ? 'Hide roads' : 'Show roads'}</Text>
        </Pressable>}
      </View>

      <View style={s.sectionHeading}>
        <View style={s.headingInfo}>
          <Text style={s.cardTitle}>Incident information</Text>
          <Text style={s.notice}>{latest.length} fictional reports · {latest.filter(r => r.reviewState === 'corroborated').length} human-reviewed</Text>
        </View>
        {mode === 'local' && <Pressable accessibilityRole="button" onPress={refresh} style={s.refresh}>
          <Text style={s.refreshText}>Refresh</Text>
        </Pressable>}
      </View>
      {loading && <View style={s.card}><ActivityIndicator color="#0f766e" /><Text style={s.body}>Loading reports from your PC…</Text></View>}
      {error && <View style={s.card}>
        <Text style={s.errorTitle}>Could not load incident information</Text>
        <Text style={s.body}>{error}</Text>
        <Text style={s.body}>No cached reports are shown as current. Check your PC connection in About.</Text>
        <Pressable accessibilityRole="button" onPress={refresh} style={s.refresh}><Text style={s.refreshText}>Retry</Text></Pressable>
      </View>}
      {!loading && !error && latest.length === 0 && <View style={s.card}>
        <Text style={s.cardTitle}>No fictional incidents to show</Text>
        <Text style={s.body}>There are no reports with demonstration-area map coordinates.</Text>
      </View>}

      {selected && !loading && !error && <View style={s.spotlight} onLayout={event => { spotlightY.current = event.nativeEvent.layout.y; }}>
        <Text style={s.eyebrow}>INCIDENT DETAILS · FICTIONAL</Text>
        <Text style={s.spotlightTitle}>{readable(selected.category)}</Text>
        <View style={s.statusPill}><Text style={s.statusText}>{selected.reviewState === 'corroborated'
          ? 'Human-reviewed demo report' : 'Awaiting human review'}</Text></View>
        <Text style={s.description}>{selected.description}</Text>
        <Text style={s.body}>Suspected impact: {readable(selected.impact)} (not verified)</Text>
        {selected.createdAt && <Text style={s.meta}>Submitted: {new Date(selected.createdAt).toLocaleString()}</Text>}
        <Text style={s.meta}>Reference: {selected.id}</Text>
        <Text style={s.meta}>Example coordinates: {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</Text>
        {mode === 'local' && selected.hasApprovedPhoto && safeUrl && photoErrorFor !== selected.id
          ? <View style={s.photoWrap}>
              <Text style={s.photoLabel}>Management-approved example photo</Text>
              <Image key={selected.id} accessibilityLabel="Approved fictional incident photo"
                source={{ uri: safeUrl + '/api/v2/hazards/' + encodeURIComponent(selected.id) + '/evidence/approved' }}
                style={s.photo} resizeMode="contain" onError={() => setPhotoErrorFor(selected.id)} />
            </View>
          : <Text style={s.notice}>{photoErrorFor === selected.id
            ? 'Approved photo could not be displayed; refresh to check its state.'
            : 'No photo approved for public viewing.'}</Text>}
        <Text style={s.notice}>Human review does not verify actual road conditions or travel safety.</Text>
      </View>}

      {!loading && !error && latest.length > 0 && <View style={s.listPanel}>
        <Text style={s.cardTitle}>Browse incidents</Text>
        <Text style={s.body}>Tap a marker on the map or a report below to select its information.</Text>
        {shown.map(report => <Pressable key={report.id} accessibilityRole="button"
          accessibilityState={{ selected: selected?.id === report.id }}
          style={[s.incidentRow, selected?.id === report.id && s.incidentRowActive]}
          onPress={() => { setSelectedId(report.id); setPhotoErrorFor(null); scrollRef.current?.scrollTo({ y: spotlightY.current, animated: true }); }}>
          <View style={s.incidentRowHead}>
            <Text style={s.incidentName}>{readable(report.category)}</Text>
            <Text style={s.incidentStatus}>{report.reviewState === 'corroborated' ? 'Reviewed' : 'Awaiting review'}</Text>
          </View>
          <Text style={s.snippet} numberOfLines={2}>{report.description}</Text>
          <Text style={s.meta}>Suspected impact: {readable(report.impact)}{mode === 'local' && report.hasApprovedPhoto ? ' · Approved image' : ''}</Text>
        </Pressable>)}
        {latest.length > 8 && <Pressable accessibilityRole="button" style={s.moreButton} onPress={() => setShowAllReports(v => !v)}>
          <Text style={s.moreText}>{showAllReports ? 'Show fewer reports' : 'Show all ' + latest.length + ' reports'}</Text>
        </Pressable>}
      </View>}

      <Text style={s.notice}>Academic prototype only. Reports and sample images are fictional. OSM reference geometry cannot verify closures, road conditions or safe routes. Use the Reports tab for category search and review filters.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 24, paddingBottom: 48, gap: 15 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b' },
  mapFrame: { height: 440, borderRadius: 20, overflow: 'hidden', backgroundColor: '#dbeafe' },
  map: { width: '100%', height: '100%' },
  mapBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  mapBadgeText: { fontSize: 10, fontWeight: '800', color: '#0f766e' },
  reportToggle: { backgroundColor: '#0f766e', borderRadius: 14, padding: 16, gap: 4 },
  reportToggleTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  reportToggleHint: { color: '#d1fae5', fontSize: 12 },
  locationPanel: { backgroundColor: '#fff', borderRadius: 18, padding: 19, gap: 12 },
  locationActive: { backgroundColor: '#7c3aed' },
  locationHint: { color: '#6d28d9', fontSize: 12, lineHeight: 19 },
  chosen: { gap: 11 },
  roadToolbar: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, borderRadius: 14, backgroundColor: '#fff' },
  roadSummary: { flex: 1, gap: 4 },
  roadTitle: { fontSize: 14, color: '#0f172a', fontWeight: '800' },
  layerToggle: { backgroundColor: '#e0f2fe', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
  layerText: { color: '#1d4ed8', fontWeight: '800', fontSize: 12 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingInfo: { flex: 1, gap: 4 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, gap: 10 },
  cardTitle: { fontSize: 17, color: '#0f172a', fontWeight: '800' },
  body: { color: '#475569', fontSize: 14, lineHeight: 21 },
  detail: { color: '#0f766e', fontSize: 12, lineHeight: 19 },
  notice: { color: '#64748b', fontSize: 12, lineHeight: 19 },
  meta: { color: '#64748b', fontSize: 12, lineHeight: 19 },
  description: { color: '#334155', fontSize: 14, lineHeight: 23 },
  refresh: { padding: 13, backgroundColor: '#0f766e', borderRadius: 12, alignItems: 'center', alignSelf: 'flex-start' },
  refreshText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  errorTitle: { color: '#9a3412', fontSize: 15, fontWeight: '800' },
  spotlight: { backgroundColor: '#fff', borderRadius: 18, padding: 19, gap: 11, borderWidth: 1, borderColor: '#d1e7e3' },
  spotlightTitle: { color: '#0f172a', fontSize: 23, fontWeight: '800' },
  statusPill: { alignSelf: 'flex-start', backgroundColor: '#f0fdfa', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 },
  statusText: { color: '#115e59', fontSize: 12, fontWeight: '800' },
  photoWrap: { gap: 8 },
  photoLabel: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
  photo: { width: '100%', height: 210, backgroundColor: '#f1f5f9', borderRadius: 12 },
  listPanel: { backgroundColor: '#fff', borderRadius: 18, padding: 17, gap: 10 },
  incidentRow: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 13, gap: 7 },
  incidentRowActive: { borderColor: '#0f766e', backgroundColor: '#f0fdfa' },
  incidentRowHead: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', alignItems: 'flex-start' },
  incidentName: { color: '#0f172a', fontWeight: '800', fontSize: 15, flex: 1 },
  incidentStatus: { color: '#0f766e', fontWeight: '800', fontSize: 11 },
  snippet: { fontSize: 12, color: '#475569', lineHeight: 19 },
  moreButton: { padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#e2e8f0' },
  moreText: { color: '#334155', fontWeight: '800', fontSize: 12 }
});
