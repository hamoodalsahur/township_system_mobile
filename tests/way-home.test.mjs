// Way home on the phone (part 3, 24 Nov 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WAY_HOME_KEY, parseWayHome, serializeWayHome, parseRouteAnswer, wayHomeText, extraTime, km, minutes, closuresKey } from '../src/lib/township.ts';

const line = (s, m) => ({ distanceM: m, durationS: s, coordinates: [[100.01, 5.01], [100.02, 5.02]] });

test('home and start are kept on the phone like the website: same key, rounded to about 1 m', () => {
  assert.equal(WAY_HOME_KEY, 'laluan.wayHome.v1');
  const raw = serializeWayHome({ home: [100.123456789, 5.987654321], start: { kind: 'place', at: [100.2, 5.3] } });
  assert.deepEqual(JSON.parse(raw).home, [100.12346, 5.98765]);
  assert.deepEqual(parseWayHome(raw), { home: [100.12346, 5.98765], start: { kind: 'place', at: [100.2, 5.3] } });
  assert.equal(parseWayHome('{"home":[1,2],"start":{"kind":"here"}}'), null, 'the phone needs a saved starting place');
  assert.equal(parseWayHome('nonsense'), null);
});

test('route answers are checked, and the laptop’s own error text is passed on', () => {
  const ok = parseRouteAnswer({ status: 'affected', usual: line(420, 4200), detour: line(480, 4000), closures: [{ id: 'c1', title: 'Jalan 1', kindLabel: 'Closed to cars', endsAt: 'x' }], provider: 'local', checkedAt: '2026-11-24T00:40:00Z' });
  assert.equal(ok.detour.distanceM, 4000);
  assert.equal(parseRouteAnswer({ status: 'clear', usual: { distanceM: 1 }, closures: [] }).usual, null, 'a broken line is dropped');
  assert.throws(() => parseRouteAnswer({ status: 'unavailable', error: 'Too many checks in a minute. Wait a moment and try again.' }), /Too many checks/);
});

test('the card says the same as the website', () => {
  assert.deepEqual(wayHomeText({ status: 'clear', usual: line(420, 4200), detour: null, closures: [] }), { title: 'Your way home is clear', detail: '7 min, 4.2 km' });
  const affected = wayHomeText({ status: 'affected', usual: line(420, 4200), detour: line(480, 4000), closures: [{ title: 'Jalan 1', kindLabel: 'Closed to cars' }, { title: 'Jalan 2', kindLabel: 'One lane only' }] });
  assert.equal(affected.title, 'Your way home is affected');
  assert.equal(affected.detail, 'Jalan 1 is closed (and 1 more). Detour 8 min (+1 min)');
  assert.equal(wayHomeText({ status: 'blocked', usual: null, detour: null, closures: [{ title: 'Jalan 1', kindLabel: 'One lane only' }] }).detail, 'Jalan 1 is down to one lane. Try again later.');
  assert.equal(extraTime(420, 430), 'about the same time');
  assert.equal(km(950), '950 m');
  assert.equal(minutes(10), 1);
});

test('the way home is checked again whenever closures change', () => {
  const a = closuresKey([{ id: 'b', endsAt: '2' }, { id: 'a', endsAt: '1' }]);
  assert.equal(a, closuresKey([{ id: 'a', endsAt: '1' }, { id: 'b', endsAt: '2' }]), 'order does not matter');
  assert.notEqual(a, closuresKey([{ id: 'a', endsAt: '1' }]), 'an ended closure changes it');
  assert.notEqual(a, closuresKey([{ id: 'a', endsAt: '1' }, { id: 'b', endsAt: '3' }]), 'an extended closure changes it');
  const hook = readFileSync('src/hooks/use-way-home.ts', 'utf8');
  assert.match(hook, /lastKey\.current === closuresKey/);
  assert.match(hook, /checkRoute\(backendUrl, current\.start\.at, current\.home\)/);
});

test('the map sets home, then the starting place, and draws the usual way and the detour', () => {
  const map = readFileSync('src/app/index.tsx', 'utf8');
  assert.match(map, /if \(picking === 'home'\) \{ setNewHome/);
  assert.match(map, /way\.save\(\{ home: newHome, start: \{ kind: 'place'/);
  assert.match(map, /<RouteLines answer=/);
  assert.match(readFileSync('src/components/laluan/way-home.tsx', 'utf8'), /lineDashPattern=\{affected \? \[2, 8\] : undefined\}/);
});
