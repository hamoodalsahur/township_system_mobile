import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Marker, Polyline } from 'react-native-maps';
import { SymbolView } from 'expo-symbols';
import { FONT, GREEN, NIGHT, RADIUS, SLATE, TYPE } from '@/constants/night-desk';
import { km, minutes, toLatLng, wayHomeText, type LonLat, type WayHomeAnswer } from '@/lib/township';

const BLUE = '#1F5A94';

/** The usual way and the detour, like the website: detour solid blue, usual way dotted when it is affected. */
export function RouteLines({ answer, home, start }: { answer: WayHomeAnswer | null; home: LonLat | null; start: LonLat | null }) {
  const affected = answer && answer.status !== 'clear';
  return <>
    {answer?.usual ? <Polyline coordinates={answer.usual.coordinates.map(toLatLng)} strokeColor={affected ? SLATE[700] : BLUE} strokeWidth={affected ? 4 : 6}
      lineDashPattern={affected ? [2, 8] : undefined} lineCap="round" lineJoin="round" zIndex={3} /> : null}
    {answer?.detour ? <Polyline coordinates={answer.detour.coordinates.map(toLatLng)} strokeColor={BLUE} strokeWidth={6} lineCap="round" lineJoin="round" zIndex={4} /> : null}
    {start ? <Marker coordinate={toLatLng(start)} anchor={{ x: 0.5, y: 0.5 }} zIndex={10} tracksViewChanges={false}>
      <View accessibilityLabel="Usual starting place" style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: NIGHT.bar }} />
    </Marker> : null}
    {home ? <Marker coordinate={toLatLng(home)} anchor={{ x: 0.5, y: 0.5 }} zIndex={10} tracksViewChanges={false}>
      <View accessibilityLabel="Home" style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: NIGHT.bar, borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <SymbolView name="house.fill" tintColor={NIGHT.mint} size={17} fallback={<Text style={{ color: NIGHT.mint, fontFamily: FONT.semibold }}>H</Text>} />
      </View>
    </Marker> : null}
  </>;
}

type Props = {
  phase: 'loading' | 'unset' | 'checking' | 'answer' | 'error';
  answer: WayHomeAnswer | null; error: string;
  onSet: () => void; onCheck: () => void; onChange: () => void;
};

/** "Your way home" card on the map: clear, or affected with the detour, or set your home first. */
export function WayHomeCard({ phase, answer, error, onSet, onCheck, onChange }: Props) {
  if (phase === 'loading') return null;
  if (phase === 'unset') return <View style={[s.card, s.row]}>
    <View style={s.icon}><SymbolView name="house" tintColor={SLATE[900]} size={18} fallback={null} /></View>
    <Text style={[s.title, { flex: 1 }]}>Check your way home</Text>
    <Pressable accessibilityRole="button" onPress={onSet} style={s.dark}><Text style={s.darkText}>Set my home</Text></Pressable>
  </View>;
  if (phase === 'checking' && !answer) return <View style={[s.card, s.row]}><ActivityIndicator color={GREEN[800]} /><Text style={s.title}>Checking your way home…</Text></View>;
  if (phase === 'error' || !answer) return <View style={s.card}>
    <Text style={s.title}>Your way home could not be checked</Text>
    <Text style={s.detail}>{error}</Text>
    <View style={s.row}><Small text="Try again" onPress={onCheck} /><Small text="Change home" onPress={onChange} /></View>
  </View>;

  const text = wayHomeText(answer);
  const ok = answer.status === 'clear';
  const checked = answer.checkedAt ? new Date(answer.checkedAt) : null;
  return <View style={[s.card, ok ? s.ok : s.bad]}>
    <View style={[s.row, { alignItems: 'flex-start' }]}>
      <View style={[s.icon, { backgroundColor: ok ? GREEN[100] : '#FCEBE8' }]}>
        <SymbolView name={ok ? 'checkmark' : 'exclamationmark'} tintColor={ok ? GREEN[800] : '#B42318'} size={16} weight="bold" fallback={null} />
      </View>
      <View style={{ flex: 1, gap: 2 }}><Text style={s.title}>{text.title}</Text><Text style={s.detail}>{text.detail}</Text></View>
    </View>
    {!ok && answer.detour && answer.usual ? <View style={{ gap: 4, paddingLeft: 2 }}>
      <Legend colour={BLUE} text={`Detour ${km(answer.detour.distanceM)}, ${minutes(answer.detour.durationS)} min`} />
      <Legend colour={SLATE[700]} dotted text={`Usual way ${km(answer.usual.distanceM)}, ${minutes(answer.usual.durationS)} min`} />
    </View> : null}
    <Text style={s.meta}>From your usual starting place{checked && Number.isFinite(checked.getTime()) ? ` · checked ${String(checked.getHours()).padStart(2, '0')}:${String(checked.getMinutes()).padStart(2, '0')}` : ''}</Text>
    <View style={s.row}><Small text={phase === 'checking' ? 'Checking…' : 'Check again'} onPress={onCheck} /><Small text="Change home" onPress={onChange} /></View>
  </View>;
}

function Legend({ colour, text, dotted }: { colour: string; text: string; dotted?: boolean }) {
  return <View style={s.row}>
    <View style={{ width: 22, height: 4, borderRadius: 2, backgroundColor: dotted ? 'transparent' : colour, borderTopWidth: dotted ? 3 : 0, borderStyle: 'dotted', borderColor: colour }} />
    <Text style={s.detail}>{text}</Text>
  </View>;
}

function Small({ text, onPress }: { text: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={s.small}><Text style={s.smallText}>{text}</Text></Pressable>;
}

const s = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: RADIUS.card, padding: 12, gap: 8, borderWidth: 1, borderColor: SLATE[200],
    shadowColor: '#0B131B', shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  ok: { borderColor: GREEN[200] },
  bad: { borderColor: '#F3B7AE', borderLeftWidth: 4, borderLeftColor: '#B42318' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: SLATE[100], alignItems: 'center', justifyContent: 'center' },
  title: { ...TYPE.heading, color: SLATE[900] },
  detail: { ...TYPE.small, color: SLATE[700] },
  meta: { ...TYPE.caption, color: SLATE[600] },
  dark: { backgroundColor: NIGHT.bar, borderRadius: RADIUS.control, paddingHorizontal: 14, paddingVertical: 10 },
  darkText: { color: '#FFFFFF', fontFamily: FONT.semibold, fontSize: 15 },
  small: { borderWidth: 1, borderColor: SLATE[200], borderRadius: RADIUS.control, paddingHorizontal: 12, paddingVertical: 8 },
  smallText: { fontFamily: FONT.semibold, fontSize: 14, color: SLATE[900] },
});
