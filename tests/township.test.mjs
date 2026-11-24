// Shared phone logic (Night Desk rebuild, 24 Nov 2026). Node loads the TypeScript file directly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  isInsideArea, boundsOf, regionFor, toLatLng, severityOf, categoryLabel, symbolFor, reviewLabel, reportsForMap,
  untilLabel, mapClosureLabel, closureLabelPoint, normalizePrivateLanUrl, parseServiceArea, parseReports, parseClosures,
} from '../src/lib/township.ts';

const square = [[100, 5], [100.1, 5], [100.1, 5.1], [100, 5.1], [100, 5]];
const hole = [[100.04, 5.04], [100.06, 5.04], [100.06, 5.06], [100.04, 5.06], [100.04, 5.04]];
const area = { id: 'local', name: 'My area', rings: [square, hole] };
const report = (id, lon, lat, extra = {}) => ({ id, category: 'flooding', description: 'Water across both lanes', impact: 'caution', reviewState: 'unverified', longitude: lon, latitude: lat, createdAt: '2026-11-24T01:00:00Z', hasApprovedPhoto: false, ...extra });

test('the area comes from the laptop: inside the outer ring and outside holes', () => {
  assert.equal(isInsideArea(area, 100.02, 5.02), true);
  assert.equal(isInsideArea(area, 100.05, 5.05), false, 'inside a hole');
  assert.equal(isInsideArea(area, 101.43, 3.08), false, 'the old BBR box is not special any more');
  assert.equal(isInsideArea(area, NaN, 5.02), false);
});

test('the map fits the area and swaps [lon, lat] for react-native-maps', () => {
  assert.deepEqual(boundsOf(square), { west: 100, south: 5, east: 100.1, north: 5.1 });
  const region = regionFor(boundsOf(square));
  assert.ok(Math.abs(region.latitude - 5.05) < 1e-9 && Math.abs(region.longitude - 100.05) < 1e-9);
  assert.ok(region.latitudeDelta > 0.1);
  assert.deepEqual(toLatLng([100.1, 5.2]), { latitude: 5.2, longitude: 100.1 });
});

test('colours, labels and symbols match the website', () => {
  assert.equal(severityOf('suspected_closure').solid, '#B42318');
  assert.equal(severityOf('partial_obstruction').label, 'Partly blocked');
  assert.equal(severityOf('nonsense').label, 'Not sure');
  assert.equal(categoryLabel('road_obstruction'), 'Blocked road');
  assert.equal(categoryLabel('mystery_thing'), 'Mystery thing');
  assert.equal(symbolFor('flooding'), 'water.waves');
  assert.equal(symbolFor('mystery'), 'exclamationmark');
  assert.equal(reviewLabel('corroborated'), 'Confirmed');
  assert.equal(reviewLabel('unverified'), 'Being checked');
});

test('the map lists reports inside the area, newest first, never rejected ones', () => {
  const list = reportsForMap([
    report('old', 100.02, 5.02, { createdAt: '2026-11-23T01:00:00Z' }),
    report('new', 100.03, 5.03, { createdAt: '2026-11-24T05:00:00Z' }),
    report('outside', 101.43, 3.08),
    report('rejected', 100.02, 5.02, { reviewState: 'rejected' }),
  ], area);
  assert.deepEqual(list.map(r => r.id), ['new', 'old']);
});

test('closure labels read like the website', () => {
  const now = new Date(2026, 10, 24, 9, 0);
  assert.equal(untilLabel(new Date(2026, 10, 24, 13, 59), now), 'until 13:59');
  assert.equal(untilLabel(new Date(2026, 10, 25, 9, 0), now), 'until tomorrow 09:00');
  assert.equal(untilLabel(new Date(2026, 10, 27, 18, 0), now), 'until Fri 18:00');
  assert.equal(untilLabel(new Date(2026, 11, 3, 18, 0), now), 'until 3 Dec 18:00');
  assert.equal(mapClosureLabel({ kind: 'closed', endsAt: new Date(2026, 10, 24, 13, 59).toISOString() }, now), 'Closed until 13:59');
  assert.equal(mapClosureLabel({ kind: 'one_lane', endsAt: new Date(2026, 10, 24, 13, 59).toISOString() }, now), 'One lane until 13:59');
  assert.deepEqual(closureLabelPoint({ roads: [{ coordinates: [[1, 1], [2, 2]] }, { coordinates: [[3, 3], [4, 4], [5, 5]] }] }), [4, 4]);
});

test('only a home-network laptop address on port 3000 is accepted', () => {
  assert.equal(normalizePrivateLanUrl(' http://192.168.1.23:3000/ '), 'http://192.168.1.23:3000');
  assert.equal(normalizePrivateLanUrl('http://10.0.0.5:3000'), 'http://10.0.0.5:3000');
  assert.equal(normalizePrivateLanUrl('http://localhost:3000'), null);
  assert.equal(normalizePrivateLanUrl('https://192.168.1.23:3000'), null);
  assert.equal(normalizePrivateLanUrl('http://192.168.1.23:8080'), null);
  assert.equal(normalizePrivateLanUrl('http://8.8.8.8:3000'), null);
  assert.equal(normalizePrivateLanUrl('http://192.168.1.23:3000/api'), null);
});

test('answers from the laptop are checked before use', () => {
  assert.deepEqual(parseServiceArea({ area: { id: 'local', name: 'My area', rings: [square] } }).rings[0][1], [100.1, 5]);
  assert.throws(() => parseServiceArea({ area: { id: 'x', name: 'x', rings: [[[1, 2]]] } }));
  assert.equal(parseReports({ reports: [report('a', 100.02, 5.02)] })[0].hasApprovedPhoto, false);
  assert.throws(() => parseReports({ reports: [{ id: 1 }] }));
  const closures = parseClosures({ closures: [
    { id: 'c1', kind: 'closed', kindLabel: 'Closed to cars', endsAt: '2026-11-24T06:00:00Z', category: 'fallen_tree', categoryLabel: 'Fallen tree', title: 'Jalan 1', roads: [{ wayId: 'w1', name: 'Jalan 1', coordinates: [[100.01, 5.01], [100.02, 5.02]] }] },
    { id: 'broken', endsAt: '2026-11-24T06:00:00Z', roads: [{ coordinates: [[1, 2]] }] },
  ] });
  assert.deepEqual(closures.map(c => c.id), ['c1'], 'a closure without a usable road is skipped');
});

test('the app no longer carries BBR roads or BBR-only checks', () => {
  const map = readFileSync('src/app/index.tsx', 'utf8');
  assert.doesNotMatch(map, /bbr-roads|101\.40|3\.06/);
  assert.match(map, /isInsideArea\(area, longitude, latitude\)/);
  assert.doesNotMatch(readFileSync('src/app/submit.tsx', 'utf8'), /validDemoLocation|PLACES/);
  assert.match(readFileSync('src/context/data-settings.tsx', 'utf8'), /AsyncStorage\.setItem\(STORAGE_KEY, url\)/);
});

test('no Expo template look is left: Laluan name, icon and splash, no Expo-logo animation', () => {
  const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
  assert.equal(app.name, 'Laluan');
  assert.equal(app.ios?.icon, undefined, 'iOS uses the Laluan icon.png');
  const splash = app.plugins.find(p => Array.isArray(p) && p[0] === 'expo-splash-screen')[1];
  assert.equal(splash.backgroundColor, '#0B131B');
  assert.doesNotMatch(readFileSync('src/app/_layout.tsx', 'utf8'), /AnimatedSplashOverlay/);
});
