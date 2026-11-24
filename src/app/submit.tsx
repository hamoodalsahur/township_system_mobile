import { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { NightHeader } from '@/components/laluan/night-header';
import { HazardPin } from '@/components/laluan/hazard-pin';
import { useDataSettings } from '@/context/data-settings';
import { useDemoLocation } from '@/context/demo-location';
import { useTownship } from '@/hooks/use-township';
import { FONT, GREEN, NIGHT, RADIUS, SLATE, TAB_BAR_SPACE, TYPE } from '@/constants/night-desk';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendReport } from '@/lib/laptop';
import { rememberReport } from '@/lib/my-reports-store';
import { preparePrivateEvidence, uploadPrivateEvidence, type PrivateEvidencePhoto } from '@/lib/private-evidence';
import {
  DESCRIPTION_MAX, REPORT_CATEGORIES, RESIDENT_IMPACTS, boundsOf, categoryLabel, isInsideArea, regionFor, severityOf,
  stepProblem, submissionBody, symbolFor, toLatLng, type ReportDraft,
} from '@/lib/township';

const TITLES = { 1: 'What did you see?', 2: 'Where is it?', 3: 'A few words and a photo' } as const;
const NEXT = { 1: 'Next: where is it?', 2: 'Next: a few words', 3: 'Send report' } as const;
const EMPTY: ReportDraft = { category: null, impact: null, point: null, description: '' };

/** Report a problem in three steps, like the website (part 2 of the phone rebuild, 24 Nov 2026). */
export default function ReportScreen() {
  const router = useRouter();
  const { backendUrl } = useDataSettings();
  const { area } = useTownship();
  const { chosenLocation, chooseLocation } = useDemoLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<ReportDraft>(EMPTY);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<{ id: string; photo: string } | null>(null);
  const [photo, setPhoto] = useState<{ evidence: PrivateEvidencePhoto; uri: string } | null>(null);
  const [photoMessage, setPhotoMessage] = useState('');
  const busy = useRef(false);
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + TAB_BAR_SPACE; // keep buttons above the floating tab bar

  // A spot picked on the Map tab is used until the resident taps somewhere else here.
  const effective: ReportDraft = { ...draft, point: draft.point ?? chosenLocation };
  const problem = stepProblem(step, effective, area);

  function next() {
    setTried(true);
    if (problem) return;
    setTried(false); setError('');
    if (step < 3) setStep((step + 1) as 2 | 3); else void send();
  }

  async function pickPhoto(source: 'camera' | 'library') {
    setPhotoMessage('');
    try {
      if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) { setPhotoMessage('Camera access was not allowed. You can choose a photo instead.'); return; }
      const result = await (source === 'camera'
        ? ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, exif: false, quality: 1 })
        : ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, exif: false, quality: 1 }));
      if (result.canceled || !result.assets?.[0]) return;
      // Re-encode (no location or camera details) and shrink until it fits the laptop's 200 kB limit.
      for (const width of [960, 720, 480, 320]) {
        const out = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width } }], { compress: 0.45, format: ImageManipulator.SaveFormat.JPEG, base64: true });
        if (!out.base64) continue;
        try { setPhoto({ evidence: preparePrivateEvidence({ mimeType: 'image/jpeg', base64Data: out.base64 }), uri: out.uri }); return; } catch { /* try smaller */ }
      }
      setPhotoMessage('That photo is too large even after shrinking. Try another one.');
    } catch { setPhotoMessage('Could not use that photo.'); }
  }

  async function send() {
    if (busy.current) return;
    busy.current = true; setSending(true); setError('');
    try {
      const id = await sendReport(backendUrl, submissionBody(effective));
      await rememberReport({ id, category: effective.category!, impact: effective.impact!, sentAt: new Date().toISOString() });
      let photoNote = '';
      if (photo) {
        const upload = await uploadPrivateEvidence(backendUrl, id, photo.evidence).catch(() => ({ status: 'uncertain' as const, message: '' }));
        photoNote = upload.status === 'uploaded' ? 'Your photo went to the township team only. They decide whether others may see it.'
          : 'The report was sent, but the photo may not have arrived.';
      }
      setSent({ id, photo: photoNote });
      chooseLocation(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The report was not sent.');
    } finally { busy.current = false; setSending(false); }
  }

  function startAgain() { setDraft(EMPTY); setStep(1); setSent(null); setPhoto(null); setPhotoMessage(''); setTried(false); setError(''); }

  if (sent) return <View style={s.page}>
    <NightHeader />
    <View style={s.night}><Text style={s.nightTitle}>Sent. Thank you.</Text>
      <Text style={s.nightSub}>The township team will check it. Follow what happens in My reports.</Text></View>
    <View style={[s.body, { paddingBottom: bottom }]}>
      {sent.photo ? <Text style={s.note}>{sent.photo}</Text> : null}
      <Pressable accessibilityRole="button" style={s.primary} onPress={() => { startAgain(); router.navigate('/reports'); }}><Text style={s.primaryText}>See My reports</Text></Pressable>
      <Pressable accessibilityRole="button" style={s.secondary} onPress={startAgain}><Text style={s.secondaryText}>Report another problem</Text></Pressable>
    </View>
  </View>;

  const outer = area?.rings[0];
  const point = effective.point;

  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <NightHeader />
    <View style={s.night}>
      <Text accessibilityRole="header" style={s.nightTitle}>{TITLES[step]}</Text>
      <View style={s.progress}>{[1, 2, 3].map(n => <View key={n} style={[s.bar, n <= step && s.barOn]} />)}</View>
      <Text style={s.nightSub}>Step {step} of 3.{step === 1 ? ' Next: where it is, then a few words and a photo.' : ''}</Text>
    </View>

    {step === 2 ? <View style={{ flex: 1 }}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={point ? { ...point, latitudeDelta: 0.01, longitudeDelta: 0.01 } : outer ? regionFor(boundsOf(outer)!) : undefined}
        onPress={e => { setDraft(d => ({ ...d, point: e.nativeEvent.coordinate })); setTried(false); }} showsPointsOfInterests={false}>
        {outer ? <Polygon coordinates={outer.map(toLatLng)} strokeColor="#475569" strokeWidth={2} lineDashPattern={[8, 6]} fillColor="rgba(255,255,255,0)" tappable={false} /> : null}
        {point ? <Marker coordinate={point} anchor={{ x: 0.5, y: 0.5 }} draggable onDragEnd={e => setDraft(d => ({ ...d, point: e.nativeEvent.coordinate }))}>
          <HazardPin category={effective.category ?? 'other'} impact={effective.impact ?? 'unknown'} reviewState="corroborated" />
        </Marker> : null}
      </MapView>
      <View style={s.mapHint}><Text style={s.mapHintText}>{point
        ? area && !isInsideArea(area, point.longitude, point.latitude) ? `That spot is outside ${area.name}. Tap inside the dashed line.` : 'Got it. Tap again or drag the pin to move it.'
        : 'Tap the map where the problem is.'}</Text></View>
    </View> : <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
      {step === 1 ? <>
        <Text style={s.label}>Type of problem</Text>
        <View style={s.grid}>{REPORT_CATEGORIES.map(category => {
          const on = draft.category === category;
          return <Pressable key={category} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setDraft(d => ({ ...d, category }))}
            style={[s.tile, category === 'other' && s.tileWide, on && s.tileOn]}>
            <SymbolView name={symbolFor(category) as SFSymbol} tintColor={SLATE[900]} size={24} fallback={null} />
            <Text style={s.tileText}>{category === 'other' ? 'Something else' : categoryLabel(category)}</Text>
          </Pressable>;
        })}</View>
        <Text style={s.label}>Can cars get through?</Text>
        {RESIDENT_IMPACTS.map(choice => {
          const on = draft.impact === choice.value;
          return <Pressable key={choice.value} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setDraft(d => ({ ...d, impact: choice.value }))} style={[s.row, on && s.tileOn]}>
            <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: severityOf(choice.value).solid }} />
            <View style={{ flex: 1 }}><Text style={s.rowTitle}>{choice.label}</Text>{choice.hint ? <Text style={s.rowHint}>{choice.hint}</Text> : null}</View>
          </Pressable>;
        })}
      </> : <>
        <Text style={s.label}>What is happening?</Text>
        <TextInput style={s.input} value={draft.description} onChangeText={description => setDraft(d => ({ ...d, description }))} multiline maxLength={DESCRIPTION_MAX}
          textAlignVertical="top" placeholder="For example: water across both lanes, about ankle deep" placeholderTextColor={SLATE[500]} />
        <Text style={s.rowHint}>{draft.description.length}/{DESCRIPTION_MAX}. Don’t include names, faces or number plates.</Text>
        <Text style={s.label}>Photo <Text style={s.optional}>(optional)</Text></Text>
        {photo ? <Image source={{ uri: photo.uri }} style={s.preview} resizeMode="cover" /> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable accessibilityRole="button" style={[s.secondary, { flex: 1 }]} onPress={() => void pickPhoto('camera')}><Text style={s.secondaryText}>Take photo</Text></Pressable>
          <Pressable accessibilityRole="button" style={[s.secondary, { flex: 1 }]} onPress={() => void pickPhoto('library')}><Text style={s.secondaryText}>Choose photo</Text></Pressable>
        </View>
        {photo ? <Pressable accessibilityRole="button" onPress={() => setPhoto(null)}><Text style={s.link}>Remove photo</Text></Pressable> : null}
        {photoMessage ? <Text style={s.rowHint}>{photoMessage}</Text> : null}
        <Text style={s.rowHint}>Photos go to the township team only. They decide whether others may see it.</Text>
      </>}
    </ScrollView>}

    <View style={[s.footer, { paddingBottom: bottom }]}>
      {tried && problem ? <Text accessibilityLiveRegion="polite" style={s.problem}>{problem}</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={s.problem}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable accessibilityRole="button" style={[s.secondary, { paddingHorizontal: 18 }]} disabled={sending}
          onPress={() => { setTried(false); setError(''); if (step > 1) setStep((step - 1) as 1 | 2); else { setDraft(EMPTY); chooseLocation(null); router.navigate('/'); } }}>
          <Text style={s.secondaryText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={[s.primary, { flex: 1 }]} disabled={sending} onPress={next}>
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.primaryText}>{NEXT[step]}</Text>}
        </Pressable>
      </View>
    </View>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: SLATE[100] },
  night: { backgroundColor: NIGHT.band, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, gap: 10 },
  nightTitle: { ...TYPE.display, color: NIGHT.text },
  nightSub: { ...TYPE.small, color: NIGHT.muted },
  progress: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: NIGHT.edge },
  barOn: { backgroundColor: NIGHT.mint },
  body: { padding: 16, gap: 12, paddingBottom: 24 },
  label: { ...TYPE.heading, color: SLATE[900], marginTop: 4 },
  optional: { fontFamily: FONT.regular, fontSize: 15, color: SLATE[600] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '31.5%', minHeight: 78, backgroundColor: '#FFFFFF', borderRadius: RADIUS.card, borderWidth: 1, borderColor: SLATE[200], alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  tileWide: { width: '100%', minHeight: 50 },
  tileOn: { borderColor: GREEN[800], borderWidth: 2, backgroundColor: GREEN[50] },
  tileText: { fontFamily: FONT.medium, fontSize: 15, color: SLATE[900], textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: RADIUS.card, borderWidth: 1, borderColor: SLATE[200], padding: 14 },
  rowTitle: { fontFamily: FONT.semibold, fontSize: 17, color: SLATE[900] },
  rowHint: { ...TYPE.small, color: SLATE[600] },
  input: { ...TYPE.body, minHeight: 120, backgroundColor: '#FFFFFF', borderRadius: RADIUS.control, borderWidth: 1, borderColor: SLATE[300], padding: 12, color: SLATE[900] },
  preview: { width: '100%', height: 180, borderRadius: RADIUS.card, backgroundColor: SLATE[200] },
  link: { fontFamily: FONT.semibold, fontSize: 15, color: GREEN[800] },
  mapHint: { position: 'absolute', left: 12, right: 12, top: 12, backgroundColor: NIGHT.band, borderRadius: RADIUS.card, padding: 12 },
  mapHintText: { color: NIGHT.text, fontFamily: FONT.medium, fontSize: 15 },
  footer: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: SLATE[200], padding: 12, gap: 8 },
  problem: { ...TYPE.small, color: '#8F1C13' },
  primary: { minHeight: 52, borderRadius: RADIUS.control, backgroundColor: NIGHT.bar, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { color: '#FFFFFF', fontFamily: FONT.semibold, fontSize: 17 },
  secondary: { minHeight: 52, borderRadius: RADIUS.control, borderWidth: 1, borderColor: SLATE[200], backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: SLATE[900], fontFamily: FONT.semibold, fontSize: 16 },
  note: { ...TYPE.body, color: SLATE[600] },
});
