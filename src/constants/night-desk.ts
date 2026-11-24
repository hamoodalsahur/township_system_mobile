/**
 * Night Desk for the phone app (24 Nov 2026): the same colours, fonts and shapes as the website
 * (township_road_hazard_system src/lib/design-tokens.ts and tailwind.config.ts).
 */
export const NIGHT = {
  bar: '#0B131B', band: '#0E1720', raised: '#1A2733', line: '#1F2C38', edge: '#2A3946',
  text: '#E4ECF2', muted: '#9FB0BE', subtle: '#7E91A3', mint: '#7FD4AE', onMint: '#0B1F17',
} as const;

/** Jade green for actions, links and selection. 800 is the primary green. */
export const GREEN = { 50: '#EEF8F3', 100: '#E3F4EC', 200: '#C3E6D5', 700: '#0D7752', 800: '#0B7350', 900: '#064E36' } as const;

export const SLATE = { 50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1', 500: '#64748B', 600: '#475569', 700: '#334155', 900: '#0F172A' } as const;

/** Closures: the same red as "Possibly closed", with a dashed white centre so it is not colour alone. */
export const CLOSURE = { line: '#B42318', tint: '#FCEBE8', text: '#8F1C13' } as const;

/** Review-state blue ("Being checked"); never green, so a confirmed flood is not read as "road is fine". */
export const REVIEW = { tint: '#E8F0FB', text: '#1F5A94' } as const;

/** Loaded in the root layout with expo-font. Display = headings, sans = everything else. */
export const FONT = {
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
  display: 'BarlowSemiCondensed_600SemiBold',
} as const;

/** Controls 10, cards 18, sheets 24 (DESIGN.md section 8). */
export const RADIUS = { control: 10, card: 18, sheet: 24, pill: 999 } as const;

export const TYPE = {
  display: { fontFamily: FONT.display, fontSize: 30, lineHeight: 34 },
  title: { fontFamily: FONT.display, fontSize: 24, lineHeight: 28 },
  heading: { fontFamily: FONT.display, fontSize: 19, lineHeight: 24 },
  body: { fontFamily: FONT.regular, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16 },
} as const;
