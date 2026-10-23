import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const major = new Set(['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link']);
const local = new Set(['residential','living_street','unclassified']);
const service = new Set(['service','track']);

export function categoryFor(highway) {
  if (major.has(highway)) return 'major';
  if (local.has(highway)) return 'local';
  if (service.has(highway)) return 'service';
  return 'other';
}
const squareDistance = (a, b) => {
  const dx = (a[1] - b[1]) * 111194 * Math.cos(a[0] * Math.PI / 180);
  const dy = (a[0] - b[0]) * 111194;
  return dx * dx + dy * dy;
};
function distanceToSegmentSquared(p, a, b) {
  const lat = p[0];
  const scale = 111194 * Math.cos(lat * Math.PI / 180);
  const x = (p[1] - a[1]) * scale, y = (p[0] - a[0]) * 111194;
  const bx = (b[1] - a[1]) * scale, by = (b[0] - a[0]) * 111194;
  const norm = bx * bx + by * by;
  if (!norm) return squareDistance(p, a);
  const t = Math.max(0, Math.min(1, (x * bx + y * by) / norm));
  return (x - t * bx) ** 2 + (y - t * by) ** 2;
}
export function simplify(points, toleranceMeters = 2) {
  if (points.length <= 2) return points;
  const keep = new Set([0, points.length - 1]);
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let best = -1, furthest = toleranceMeters * toleranceMeters;
    for (let index = start + 1; index < end; index++) {
      const distance = distanceToSegmentSquared(points[index], points[start], points[end]);
      if (distance > furthest) { best = index; furthest = distance; }
    }
    if (best !== -1) {
      keep.add(best);
      stack.push([start, best], [best, end]);
    }
  }
  return points.filter((_, index) => keep.has(index));
}
const validPair = value => Array.isArray(value) && value.length >= 2 &&
  value.slice(0, 2).every(item => typeof item === 'number' && Number.isFinite(item)) &&
  value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;

export function prepareRoads(data) {
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features) ||
      data.features.length === 0 || data.features.length > 2000) {
    throw new Error('Expected a non-empty BBR GeoJSON FeatureCollection with at most 2,000 features.');
  }
  const seen = new Set();
  return data.features.map((feature, index) => {
    const coords = feature?.geometry?.coordinates;
    if (feature?.type !== 'Feature' || feature.geometry?.type !== 'LineString' ||
        !Array.isArray(coords) || coords.length < 2 || coords.length > 5000 ||
        !coords.every(validPair) ||
        typeof feature.properties?.highway !== 'string' ||
        typeof feature.properties?.id !== 'string' ||
        !/^osm-way-\d+$/.test(feature.properties.id) ||
        seen.has(feature.properties.id)) {
      throw new Error('Invalid or duplicate OSM reference road at feature ' + index);
    }
    seen.add(feature.properties.id);
    const points = coords.map(pair => [pair[1], pair[0]]);
    const distinct = points.filter((point, i) => i === 0 || squareDistance(point, points[i-1]) > 0);
    if (distinct.length < 2) throw new Error('Road feature has no distinct coordinates: ' + feature.properties.id);
    const minLat = Math.min(...points.map(point => point[0]));
    const maxLat = Math.max(...points.map(point => point[0]));
    const minLon = Math.min(...points.map(point => point[1]));
    const maxLon = Math.max(...points.map(point => point[1]));
    return {
      id: feature.properties.id,
      category: categoryFor(feature.properties.highway),
      coordinates: simplify(distinct).map(p => p.map(n => Number(n.toFixed(6)))),
      bounds: [minLat, minLon, maxLat, maxLon].map(n => Number(n.toFixed(6)))
    };
  });
}
export function formatModule(roads, count) {
  const text = JSON.stringify(roads);
  return `import type { MobileRoad } from './bbr-roads.generated-types';
// Generated from the owner's local BBR OSM road reference data.
// Map context only — not real-time road status, closure data or navigation.
// OpenStreetMap contributors ©, ODbL — https://www.openstreetmap.org/copyright
export const BBR_ROADS: readonly MobileRoad[] = ${text};
export const BBR_ROAD_SOURCE_COUNT: number = ${count};
`;
}

const calledAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (calledAsScript) {
  const source = process.argv[2];
  if (!source || path.basename(source).toLowerCase() !== 'bbr-roads.geojson') {
    console.error('Usage: node scripts/prepare-bbr-roads.mjs "C:\\path\\to\\township_flood_system\\public\\data\\bbr-roads.geojson"');
    process.exitCode = 1;
  } else {
    try {
      const raw = JSON.parse(await readFile(path.resolve(source), 'utf8'));
      const roads = prepareRoads(raw);
      const destination = path.resolve('src/data/bbr-roads.generated.ts');
      await writeFile(destination, formatModule(roads, raw.features.length), 'utf8');
      console.log('Prepared ' + roads.length + ' geographic reference roads for the mobile app.');
      console.log('Mobile output: ' + destination);
      console.log('Original website file was read only, and was not changed.');
    } catch (error) {
      console.error('Could not prepare mobile reference roads:', error.message);
      process.exitCode = 1;
    }
  }
}
