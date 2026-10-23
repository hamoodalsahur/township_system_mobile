import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDemoLocation, validDemoLocation } from '@/context/demo-location';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { BBR_ROADS, BBR_ROAD_SOURCE_COUNT } from '@/data/bbr-roads.generated';
import { visibleRoads, ROAD_STYLES } from '@/lib/mobile-roads';
import { useDataSettings } from '@/context/data-settings';
import { loadPublicReports, type PublicReport } from '@/lib/public-reports';

type MapReport = {
  id: string;
  category: string;
  description: string;
  impact: string;
  reviewState: string;
  latitude: number;
  longitude: number;
  hasApprovedPhoto: boolean;
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
  const { mode, backendUrl } = useDataSettings();
  const { chosenLocation, chooseLocation } = useDemoLocation();
  const router = useRouter();
  const [choosingLocation, setChoosingLocation] = useState(false);
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
  const selected = reports.find(report => report.id === selectedId);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>{mode === 'mock' ? 'MOCK DEMO · SAMPLE MARKERS' : 'LOCAL BACKEND · FICTIONAL REPORTS'}</Text>
      <Text style={s.title}>Township Map</Text>
      <Text style={s.subtitle}>Bandar Bukit Raja · Academic prototype</Text>
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
              onPress={() => setSelectedId(report.id)}
            />
          ))}
        </MapView>
        <View style={s.mapBadge} pointerEvents="none">
          <Text style={s.mapBadgeText}>FICTIONAL REPORTS ONLY</Text>
        </View>
      </View>

      <View style={s.locationPanel}>
        <Text style={s.cardTitle}>Choose an illustrative report location</Text>
        <Text style={s.body}>Tap an empty part of the map to choose a fictional report point. Only the backend's research rectangle is accepted. This does not use phone GPS.</Text>
        <Pressable accessibilityRole="button" onPress={() => { setChoosingLocation(v => !v); setLocationHint(''); }} style={[s.refresh, choosingLocation && s.locationActive]}>
          <Text style={s.refreshText}>{choosingLocation ? 'Cancel picking' : 'Choose point on map'}</Text>
        </Pressable>
        {choosingLocation && <Text style={s.locationHint}>Selection mode is active. Tap the map where you want to place the fictional report.</Text>}
        {locationHint ? <Text style={s.locationHint}>{locationHint}</Text> : null}
        {chosenLocation && <View style={s.chosen}>
          <Text style={s.detail}>Chosen demo point: {chosenLocation.latitude.toFixed(5)}, {chosenLocation.longitude.toFixed(5)}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/submit')} style={s.refresh}><Text style={s.refreshText}>Use in Submit</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => { chooseLocation(null); setLocationHint(''); }}><Text style={s.detail}>Clear chosen point</Text></Pressable>
        </View>}
      </View>
      <View style={s.roadPanel}>
        <Text style={s.cardTitle}>BBR reference road overlay</Text>
        <Text style={s.body}>{BBR_ROAD_SOURCE_COUNT === 0
          ? 'Local road geometry has not been prepared on this device. The native map and fictional markers still work normally.'
          : BBR_ROAD_SOURCE_COUNT + ' imported OSM reference features. Showing up to 180 nearby road features to keep the map responsive.'}</Text>
        {BBR_ROAD_SOURCE_COUNT > 0 && <Pressable accessibilityRole="button" onPress={() => setShowRoads(value => !value)} style={s.refresh}>
          <Text style={s.refreshText}>{showRoads ? 'Hide blue roads' : 'Show blue roads'}</Text>
        </Pressable>}
        <Text style={s.legend}>━━━━ Major   ━━━━ Local   ━━━━ Service   ━━━━ Other</Text>
        <Text style={s.notice}>OpenStreetMap contributors © · ODbL · Reference geometry only. No road-access, closure or navigation claims.</Text>
      </View>

      {mode === 'local' && <Pressable accessibilityRole="button" onPress={refresh} style={s.refresh}><Text style={s.refreshText}>Refresh map reports</Text></Pressable>}
      {loading && <View style={s.card}><ActivityIndicator color="#0f766e"/><Text style={s.body}>Loading fictional reports from your PC…</Text></View>}
      {error ? <View style={s.card}><Text style={s.errorTitle}>The map reports could not load</Text><Text style={s.body}>{error}</Text><Text style={s.body}>No old markers are shown as current. Check About for your PC connection.</Text><Pressable style={s.refresh} onPress={refresh}><Text style={s.refreshText}>Retry</Text></Pressable></View> : null}
      {mode === 'local' && !loading && !error && reports.length === 0 ? (
        <View style={s.card}><Text style={s.cardTitle}>No map reports yet</Text><Text style={s.body}>This backend has no fictional reports with coordinates in the demonstration area.</Text></View>
      ) : null}

      {selected && !loading && !error ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>{readable(selected.category)} · Fictional report</Text>
          <Text style={s.body}>{selected.description}</Text>
          <Text style={s.detail}>Suspected impact: {readable(selected.impact)}</Text>
          <Text style={s.detail}>Review: {selected.reviewState === 'corroborated' ? 'Human-corroborated demonstration report' : 'Not human-corroborated'}</Text>
          <Text style={s.detail}>Reference: {selected.id}</Text>
          <Text style={s.detail}>{selected.hasApprovedPhoto ? 'Approved demonstration photo available in the backend (not shown here).' : 'No approved demonstration photo shown.'}</Text>
        </View>
      ) : !loading && !error && reports.length > 0 ? (
        <View style={s.card}>
          <Text style={s.cardTitle}>Explore the map</Text>
          <Text style={s.body}>Pan or pinch to zoom, then tap one of the {reports.length} fictional report markers to read more.</Text>
        </View>
      ) : null}

      <Text style={s.notice}>Academic prototype only. No real incidents, reliable live road status, verified closures, emergency reporting, or navigation advice. Blue OSM overlays are geographic reference only and must not be used for travel.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 24, paddingBottom: 45, gap: 15 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b' },
  mapFrame: { height: 440, borderRadius: 20, overflow: 'hidden', backgroundColor: '#dbeafe' },
  map: { width: '100%', height: '100%' },
  mapBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  mapBadgeText: { fontSize: 10, fontWeight: '800', color: '#0f766e' },
  card: { padding: 20, backgroundColor: '#fff', borderRadius: 18, gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  body: { fontSize: 14, lineHeight: 22, color: '#475569' },
  detail: { fontSize: 12, color: '#0f766e', lineHeight: 19 },
  notice: { fontSize: 12, lineHeight: 19, color: '#64748b' },
  refresh: { padding: 13, backgroundColor: '#0f766e', borderRadius: 12, alignItems: 'center', alignSelf: 'flex-start' },
  refreshText: { color: '#fff', fontWeight: '800' },
  errorTitle: { color: '#9a3412', fontSize: 15, fontWeight: '800' },
  roadPanel: { backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 10 },
  locationPanel: { backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 12 },
  locationActive: { backgroundColor: '#7c3aed' },
  locationHint: { color: '#6d28d9', fontSize: 12, lineHeight: 19 },
  chosen: { gap: 11 },
  legend: { color: '#2563eb', fontSize: 12, fontWeight: '700' }
});
