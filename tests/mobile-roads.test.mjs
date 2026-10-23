import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryFor, simplify, prepareRoads, formatModule } from '../scripts/prepare-bbr-roads.mjs';

const f = (id, highway, coordinates) => ({
  type: 'Feature', geometry: { type: 'LineString', coordinates },
  properties: { id, highway, verification: 'osm_unverified' }
});
test('website and mobile road categories agree', () => {
  for(const key of ['primary', 'trunk_link', 'tertiary']) assert.equal(categoryFor(key),'major');
  for(const key of ['residential','unclassified']) assert.equal(categoryFor(key),'local');
  assert.equal(categoryFor('service'),'service');
  assert.equal(categoryFor('footway'),'other');
});
test('roads keep their original endpoints and category', () => {
  const data={type:'FeatureCollection',features:[f('osm-way-1','residential',[[101.42,3.08],[101.42001,3.08001],[101.43,3.09]])]};
  const roads=prepareRoads(data);
  assert.equal(roads.length,1);
  assert.equal(roads[0].category,'local');
  assert.deepEqual(roads[0].coordinates[0],[3.08,101.42]);
  assert.deepEqual(roads[0].coordinates.at(-1),[3.09,101.43]);
  assert.match(formatModule(roads,1), /OpenStreetMap contributors/);
});
test('malformed geometry and repeated OSM IDs fail without writing', () => {
  assert.throws(()=>prepareRoads({type:'FeatureCollection',features:[]}));
  assert.throws(()=>prepareRoads({type:'FeatureCollection',features:[f('bad','track',[[101.4,3.07],[101.5,3.09]])]}));
  assert.throws(()=>prepareRoads({type:'FeatureCollection',features:[f('osm-way-1','track',[[101.4,3.07],[101.5,3.09]]),f('osm-way-1','service',[[101.4,3.07],[101.5,3.09]])]}));
});
