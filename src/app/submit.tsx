import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataSettings } from '@/context/data-settings';
import { normalizePrivateLanUrl } from '@/lib/public-reports';
import { preparePrivateEvidence, uploadPrivateEvidence, type PrivateEvidencePhoto } from '@/lib/private-evidence';
import { useDemoLocation, validDemoLocation } from '@/context/demo-location';

const CATEGORIES = [
  ['flooding', 'Flooding'], ['roadworks', 'Roadworks'],
  ['fallen_tree', 'Fallen tree'], ['pothole', 'Pothole'],
  ['road_obstruction', 'Road obstruction'], ['storm_damage', 'Storm damage'], ['other', 'Other']
] as const;
const IMPACTS = [
  ['unknown', 'Unknown'], ['caution', 'Caution'],
  ['partial_obstruction', 'Partial obstruction'], ['suspected_closure', 'Suspected closure']
] as const;
const PLACES = [
  { label: 'Example junction A', longitude: 101.4318, latitude: 3.0876 },
  { label: 'Example junction B', longitude: 101.4392, latitude: 3.0891 },
  { label: 'Example junction C', longitude: 101.4257, latitude: 3.0833 }
] as const;
type Category = typeof CATEGORIES[number][0];
type Impact = typeof IMPACTS[number][0];

export default function SubmitScreen() {
  const insets = useSafeAreaInsets();
  const { mode, backendUrl } = useDataSettings();
  const router = useRouter();
  const { chosenLocation, chooseLocation } = useDemoLocation();
  const [category, setCategory] = useState<Category>('flooding');
  const [impact, setImpact] = useState<Impact>('unknown');
  const [place, setPlace] = useState<number | 'map'>(0);
  useEffect(() => {
    if (chosenLocation) setPlace('map');
    else setPlace(previous => previous === 'map' ? 0 : previous);
  }, [chosenLocation]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const [outcome, setOutcome] = useState('');
  const [successfulReportId, setSuccessfulReportId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<PrivateEvidencePhoto | null>(null);
  const [evidenceMessage, setEvidenceMessage] = useState('');
  const [evidenceBusy, setEvidenceBusy] = useState(false);
  const evidenceBusyRef = useRef(false);

  async function chooseSampleImage() {
    if (evidenceBusyRef.current || !successfulReportId || mode !== 'local') return;
    setEvidenceMessage('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        exif: false,
        quality: 1
      });
      if (result.canceled || !result.assets?.[0]) return;
      // Re-encode rather than uploading the original library file or its metadata.
      // Try progressively smaller JPEGs, staying under the backend's 200 kB limit.
      const image = result.assets[0];
      for (const width of [960, 720, 480, 320]) {
        const processed = await ImageManipulator.manipulateAsync(
          image.uri, [{ resize: { width } }],
          { compress: 0.45, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (!processed.base64) continue;
        try {
          setEvidence(preparePrivateEvidence({ mimeType: 'image/jpeg', base64Data: processed.base64 }));
          setEvidenceMessage('Sample image prepared. Upload is optional and separate from report submission.');
          return;
        } catch { /* Re-encode smaller if this attempt is still too large. */ }
      }
      setEvidence(null);
      setEvidenceMessage('Could not reduce this sample image below 200 kB. Choose a simpler example.');
    } catch {
      setEvidence(null);
      setEvidenceMessage('Image selection could not finish. The report is already saved.');
    }
  }

  async function sendSampleEvidence() {
    if (evidenceBusyRef.current || !evidence || !successfulReportId || mode !== 'local') return;
    evidenceBusyRef.current = true;
    setEvidenceBusy(true);
    setEvidenceMessage('');
    // Remove the image from state before sending: no automatic resubmit or retry.
    const photo = evidence;
    const reportId = successfulReportId;
    setEvidence(null);
    try {
      const result = await uploadPrivateEvidence(backendUrl, reportId, photo);
      setEvidenceMessage(result.status === 'uploaded'
        ? 'Sample evidence received privately. It awaits management review and is not public.'
        : result.message);
    } catch (error) {
      setEvidenceMessage(error instanceof Error ? error.message : 'Upload could not be confirmed. Check management.');
    } finally {
      evidenceBusyRef.current = false;
      setEvidenceBusy(false);
    }
  }

  async function submitReport() {
    if (inFlight.current) return;
    if (description.trim().length < 8 || description.length > 400) {
      Alert.alert('Description needed', 'Enter 8–400 characters describing a fictional scenario.');
      return;
    }
    if (mode === 'mock') {
      Alert.alert('Mock Demo only', 'Form preview complete. Nothing was sent to management or stored.');
      setOutcome('Mock Demo preview only — no report was saved.');
      return;
    }
    const url = normalizePrivateLanUrl(backendUrl);
    if (!url) {
      setOutcome('Set your trusted PC address in About before sending a fictional report.');
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setOutcome('');
    setSuccessfulReportId(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const location = place === 'map' ? chosenLocation : PLACES[place];
      if (!location || !validDemoLocation(location)) {
        setOutcome('Choose a valid fictional location from the map or preset options.');
        return;
      }
      const response = await fetch(url + '/api/v2/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category, impact, description: description.trim(),
          coordinates: [location.longitude, location.latitude]
        }),
        signal: controller.signal
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        let message = 'Backend could not accept the demo report.';
        if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') message = body.error;
        setOutcome(message);
        return;
      }
      if (!body || typeof body !== 'object' || !('report' in body) || typeof body.report !== 'object' || !body.report || !('id' in body.report) || typeof body.report.id !== 'string') {
        setOutcome('Backend responded unexpectedly. Check Reports before trying again to avoid duplicate submissions.');
        return;
      }
      setOutcome('Fictional report sent to management. Reference: ' + body.report.id + '. Open Reports and refresh to see its review state.');
      setSuccessfulReportId(body.report.id);
      setEvidence(null);
      setEvidenceMessage('');
      setDescription('');
    } catch (error) {
      setOutcome(error instanceof Error && error.name === 'AbortError'
        ? 'Request timed out. It may have reached the backend; check Reports before resending.'
        : 'Could not confirm delivery. Check Reports before trying again to avoid duplicates.');
    } finally {
      clearTimeout(timeout);
      inFlight.current = false;
      setSubmitting(false);
    }
  }
  if (successfulReportId !== null) {
    return (
      <ScrollView style={s.successPage} contentContainerStyle={[s.successContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={s.successCard}>
          <Text style={s.successIcon}>✓</Text>
          <Text accessibilityRole="header" style={s.successTitle}>Report submitted successfully!</Text>
          <Text style={s.modalBody}>Your fictional report was received by management and is awaiting human review.</Text>
          <Text selectable style={s.modalReference}>Reference: {successfulReportId}</Text>
          {mode === 'local' && (
            <View style={s.evidenceSection}>
              <Text style={s.evidenceTitle}>Optional fictional photo evidence</Text>
              <Text style={s.modalBody}>Use only a non-personal sample image. It stays private until a management operator reviews it. Avoid faces, addresses and identifying details.</Text>
              <Pressable accessibilityRole="button" disabled={evidenceBusy} style={[s.evidenceButton, evidenceBusy && s.disabled]} onPress={() => void chooseSampleImage()}>
                <Text style={s.evidenceButtonText}>{evidence ? 'Change sample image' : 'Choose sample from library'}</Text>
              </Pressable>
              {evidence && <Pressable accessibilityRole="button" disabled={evidenceBusy} style={[s.button, evidenceBusy && s.disabled]} onPress={() => void sendSampleEvidence()}>
                {evidenceBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Upload sample privately</Text>}
              </Pressable>}
              {evidenceMessage ? <Text accessibilityRole="text" style={s.evidenceMessage}>{evidenceMessage}</Text> : null}
            </View>
          )}
          <Pressable accessibilityRole="button" disabled={evidenceBusy} style={[s.button, evidenceBusy && s.disabled]} onPress={() => {
            setEvidence(null);
            setEvidenceMessage('');
            setSuccessfulReportId(null);
            setOutcome('');
            router.navigate('/reports');
          }}>
            <Text style={s.buttonText}>View Reports</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={evidenceBusy} style={[s.modalSecondary, evidenceBusy && s.disabled]} onPress={() => {
            setEvidence(null);
            setEvidenceMessage('');
            setSuccessfulReportId(null);
            setOutcome('');
            setCategory('flooding');
            setImpact('unknown');
            setPlace(chosenLocation ? 'map' : 0);
          }}>
            <Text style={s.modalSecondaryText}>Submit another fictional report</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>{mode === 'mock' ? 'MOCK DEMO · NOTHING SENT' : 'LOCAL BACKEND · FICTIONAL INTAKE'}</Text>
      <Text style={s.title}>Submit a Report</Text>
      <Text style={s.subtitle}>Practice reporting a made-up township condition. Not for actual hazards or emergencies.</Text>
      <View style={s.card}>
        <Text style={s.label}>Fictional category</Text>
        <View style={s.choices}>{CATEGORIES.map(([value, label]) => <Pressable key={value} onPress={() => setCategory(value)} accessibilityRole="button" accessibilityState={{ selected: category === value }} style={[s.chip, category === value && s.chipActive]}><Text style={[s.chipText, category === value && s.chipTextActive]}>{label}</Text></Pressable>)}</View>
        <Text style={s.label}>Suspected impact (not verified)</Text>
        <View style={s.choices}>{IMPACTS.map(([value, label]) => <Pressable key={value} onPress={() => setImpact(value)} accessibilityRole="button" accessibilityState={{ selected: impact === value }} style={[s.chip, impact === value && s.chipActive]}><Text style={[s.chipText, impact === value && s.chipTextActive]}>{label}</Text></Pressable>)}</View>
        <Text style={s.label}>Example location</Text>
        <Text style={s.small}>Choose a preset or select a fictional point in the Map tab. No GPS or personal location is requested.</Text>
        {chosenLocation && <Pressable style={[s.location, place === 'map' && s.locationActive]} onPress={() => setPlace('map')} accessibilityRole="radio" accessibilityState={{ checked: place === 'map' }}>
          <Text style={s.locationText}>{place === 'map' ? '◉' : '○'} Map-selected demo point ({chosenLocation.latitude.toFixed(5)}, {chosenLocation.longitude.toFixed(5)})</Text>
        </Pressable>}
        {PLACES.map((item, i) => <Pressable key={item.label} style={[s.location, place === i && s.locationActive]} onPress={() => setPlace(i)} accessibilityRole="radio" accessibilityState={{ checked: place === i }}><Text style={s.locationText}>{place === i ? '◉' : '○'} {item.label}</Text></Pressable>)}
        {chosenLocation && <Pressable accessibilityRole="button" onPress={() => { chooseLocation(null); setPlace(0); }}><Text style={s.small}>Clear map-selected point</Text></Pressable>}
        <Text style={s.label}>Fictional description</Text>
        <TextInput style={s.input} value={description} onChangeText={setDescription} multiline maxLength={400} textAlignVertical="top" placeholder="Describe an invented road or drainage issue…" placeholderTextColor="#94a3b8" />
        <Text style={s.small}>{description.length}/400 characters (minimum 8 non-space characters)</Text>
        <Pressable accessibilityRole="button" disabled={submitting} style={[s.button, submitting && s.disabled]} onPress={() => void submitReport()}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{mode === 'mock' ? 'Preview fictional submission' : 'Send fictional report to management'}</Text>}</Pressable>
        {outcome ? <Text accessibilityRole="text" style={s.outcome}>{outcome}</Text> : null}
      </View>
      <Text style={s.small}>Local Backend sends fictional data to your PC only. Reports remain unverified until a human operator reviews them. Nothing automatically closes or alters roads. Photos will be added in M4.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 22, paddingTop: 24, paddingBottom: 60, gap: 16 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: '#0f766e' },
  title: { fontSize: 28, color: '#0f172a', fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#64748b', lineHeight: 21 },
  card: { backgroundColor: '#fff', padding: 18, gap: 13, borderRadius: 18 },
  label: { color: '#0f172a', fontSize: 15, fontWeight: '800' },
  small: { color: '#64748b', fontSize: 12, lineHeight: 19 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 10, paddingHorizontal: 11 },
  chipActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  chipText: { fontSize: 12, color: '#334155', fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  location: { padding: 12, borderRadius: 12, backgroundColor: '#f1f5f9' },
  locationActive: { backgroundColor: '#ccfbf1' },
  locationText: { color: '#0f172a', fontSize: 13, fontWeight: '600' },
  input: { minHeight: 120, borderRadius: 12, padding: 13, borderWidth: 1, borderColor: '#cbd5e1', color: '#0f172a' },
  button: { borderRadius: 12, backgroundColor: '#0f766e', padding: 16, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', textAlign: 'center' },
  outcome: { color: '#0f766e', fontSize: 13, lineHeight: 21 },
  successPage: { flex: 1, backgroundColor: '#f8fafc' },
  successContent: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  evidenceSection: { gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  evidenceTitle: { color: '#0f172a', fontWeight: '800', textAlign: 'center' },
  evidenceButton: { backgroundColor: '#e2e8f0', padding: 13, borderRadius: 12, alignItems: 'center' },
  evidenceButtonText: { color: '#0f172a', fontWeight: '700' },
  evidenceMessage: { color: '#0f766e', fontSize: 12, lineHeight: 19, textAlign: 'center' },
  successCard: { backgroundColor: '#fff', borderRadius: 22, padding: 24, gap: 18 },
  successIcon: { textAlign: 'center', fontSize: 48, color: '#0f766e', fontWeight: '800' },
  successTitle: { textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#0f172a' },
  modalBody: { textAlign: 'center', color: '#475569', fontSize: 14, lineHeight: 22 },
  modalReference: { textAlign: 'center', color: '#0f766e', fontSize: 12, lineHeight: 19 },
  modalSecondary: { padding: 12, alignItems: 'center' },
  modalSecondaryText: { color: '#0f766e', fontWeight: '700', textAlign: 'center' }
});
