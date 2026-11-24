import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT, NIGHT } from '@/constants/night-desk';

/** The navy top bar from the website: logo, name, and the "Demo data" reminder. */
export function NightHeader({ subtitle }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return <View style={{ backgroundColor: NIGHT.bar, paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: NIGHT.line }}>
    <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: NIGHT.mint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 18, color: NIGHT.onMint }}>L</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: FONT.display, fontSize: 20, color: NIGHT.text }}>Laluan</Text>
      {subtitle ? <Text numberOfLines={1} style={{ fontFamily: FONT.regular, fontSize: 12, color: NIGHT.muted }}>{subtitle}</Text> : null}
    </View>
    <View style={{ borderWidth: 1, borderColor: NIGHT.edge, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: NIGHT.muted }}>Demo data</Text>
    </View>
  </View>;
}
