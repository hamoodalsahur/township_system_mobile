import type { Region } from 'react-native-maps';
import type { MobileRoad } from '@/data/bbr-roads.generated-types';

export const ROAD_STYLES = {
  major: { color: '#2563eb', width: 3.8 },
  local: { color: '#60a5fa', width: 3.5 },
  service: { color: '#93c5fd', width: 2.4 },
  other: { color: '#bfdbfe', width: 2 },
} as const;

const priority = { major: 0, local: 1, service: 2, other: 3 };
export function visibleRoads(roads: readonly MobileRoad[], region: Region, limit = 180): MobileRoad[] {
  const expand = 1.35;
  const south = region.latitude - region.latitudeDelta * expand / 2;
  const north = region.latitude + region.latitudeDelta * expand / 2;
  const west = region.longitude - region.longitudeDelta * expand / 2;
  const east = region.longitude + region.longitudeDelta * expand / 2;
  return roads.filter(road => road.bounds[0] <= north && road.bounds[2] >= south &&
     road.bounds[1] <= east && road.bounds[3] >= west)
     .sort((a,b) => priority[a.category] - priority[b.category] || a.id.localeCompare(b.id))
     .slice(0, limit);
}
