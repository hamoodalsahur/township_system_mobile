export type MobileRoadCategory = 'major' | 'local' | 'service' | 'other';
export type MobileRoad = {
  id: string;
  category: MobileRoadCategory;
  coordinates: readonly (readonly [number, number])[]; // [latitude, longitude]
  bounds: readonly [number, number, number, number]; // south, west, north, east
};
