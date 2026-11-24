import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Text, View } from 'react-native';
import { categoryLabel, severityOf, symbolFor } from '@/lib/township';

/**
 * A report pin, like the website's: filled in its severity colour once the township team has
 * confirmed it, white with a coloured ring while it is still being checked.
 */
export function HazardPin({ category, impact, reviewState, size = 34, selected = false }: {
  category: string; impact: string; reviewState: string; size?: number; selected?: boolean;
}) {
  const severity = severityOf(impact);
  const confirmed = reviewState === 'corroborated';
  const glyph = confirmed ? severity.glyph : severity.solid;
  const fallback = <Text style={{ color: glyph, fontSize: size * 0.42, fontWeight: '700' }}>{categoryLabel(category).charAt(0)}</Text>;
  return <View accessibilityLabel={`${categoryLabel(category)}, ${severity.label}`} style={{
    width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: confirmed ? severity.solid : '#FFFFFF', borderWidth: confirmed ? 2 : 3, borderColor: confirmed ? '#FFFFFF' : severity.solid,
    transform: [{ scale: selected ? 1.18 : 1 }],
    shadowColor: '#0B131B', shadowOpacity: 0.28, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3,
  }}>
    <SymbolView name={symbolFor(category) as SFSymbol} tintColor={glyph} size={size * 0.5} fallback={fallback} />
  </View>;
}
