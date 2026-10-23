import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const sortedReports = useMemo(() => [...reports].sort((a, b) => {
    const left = a.createdAt ? Date.parse(a.createdAt) || 0 : 0;
    const right = b.createdAt ? Date.parse(b.createdAt) || 0 : 0;
    return right - left;
  }), [reports]);
  const selected = sortedReports.find(report => report.id === selectedId) ?? sortedReports[0];
  const reviewedCount = sortedReports.filter(report => report.reviewState === 'corroborated').length;
  const safeBackendUrl = normalizePrivateLanUrl(backendUrl);
  const shownReports = showAllReports ? sortedReports : sortedReports.slice(0, 8);

  return (
    <ScrollView style={s.page} contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>{mode === 'mock' ? 'MOCK DEMO · SAMPLE SCENARIOS' : 'LOCAL BACKEND · FICTIONAL REPORTS'}</Text>
      <Text style={s.title}>Township Map</Text>
      <Text style={s.subtitle}>Bandar Bukit Raja · Explore fictional incident reports</Text>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: reportPanelOpen }} style={s.reportToggle} onPress={() => {
        setReportPanelOpen(open => !open);
        setChoosingLocation(false);
      }}>
        <Text style={s.reportToggleTitle}>{reportPanelOpen ? '−' : '+'}  Report an Incident</Text>
        <Text style={s.reportToggleHint}>{reportPanelOpen ? 'Hide location selection' : 'Expand to choose a fictional report location'}</Text>
      </Pressable>
      {reportPanelOpen && (
        <View style={s.locationPanel}>
          <Text style={s.cardTitle}>Choose an illustrative report location</Text>
          <Text style={s.body}>Tap Choose point on map, then tap an empty part of the map below. Only the demo reporting rectangle is accepted. Phone GPS is not used.</Text>
          <Pressable accessibilityRole="button" onPress={() => { setChoosingLocation(v => !v); setLocationHint(''); }} style={[s.refresh, choosingLocation && s.locationActive]}>
            <Text style={s.refreshText}>{choosingLocation ? 'Cancel picking' : 'Choose point on map'}</Text>
          </Pressable>
          {choosingLocation && <Text style={s.locationHint}>Selection mode active. Tap the map directly below to select your fictional location.</Text>}
          {locationHint ? <Text style={s.locationHint}>{locationHint}</Text> : null}
          {chosenLocation && (
            <View style={s.chosen}>
              <Text style={s.detail}>Selected point: {chosenLocation.latitude.toFixed(5)}, {chosenLocation.longitude.toFixed(5)}</Text>
              <Pressable accessibilityRole="button" onPress={() => router.navigate('/submit')} style={s.refresh}>
                <Text style={s.refreshText}>Use in Submit</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => { chooseLocation(null); setLocationHint(''); }}>
                <Text style={s.detail}>Clear selected point</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
