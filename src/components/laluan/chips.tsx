import { Text, View } from 'react-native';
import { CLOSURE, FONT, REVIEW, SLATE } from '@/constants/night-desk';
import { reviewLabel, severityOf } from '@/lib/township';

const base = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, borderRadius: 999, paddingHorizontal: 10, minHeight: 26, alignSelf: 'flex-start' as const };
const label = { fontFamily: FONT.medium, fontSize: 13 };

export function SeverityChip({ impact }: { impact: string }) {
  const s = severityOf(impact);
  return <View style={[base, { backgroundColor: s.tint }]}>
    <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.solid }} />
    <Text style={[label, { color: s.text }]}>{s.label}</Text>
  </View>;
}

export function ReviewChip({ reviewState }: { reviewState: string }) {
  const confirmed = reviewState === 'corroborated';
  return <View style={[base, { backgroundColor: confirmed ? '#FFFFFF' : REVIEW.tint, borderWidth: confirmed ? 1 : 0, borderColor: SLATE[200] }]}>
    <Text style={[label, { color: confirmed ? SLATE[900] : REVIEW.text }]}>{confirmed ? '✓ ' : '○ '}{reviewLabel(reviewState)}</Text>
  </View>;
}

/** Red pill with the closure swatch: "Closed to cars" or "One lane only". */
export function ClosureChip({ text }: { text: string }) {
  return <View style={[base, { backgroundColor: CLOSURE.tint }]}>
    <ClosureSwatch />
    <Text style={[label, { color: CLOSURE.text, fontFamily: FONT.semibold }]}>{text}</Text>
  </View>;
}

export function ClosureSwatch() {
  return <View style={{ width: 18, height: 8, borderRadius: 4, backgroundColor: CLOSURE.line, justifyContent: 'center', paddingHorizontal: 3 }}>
    <View style={{ height: 2, borderRadius: 1, backgroundColor: '#FFFFFF' }} />
  </View>;
}
