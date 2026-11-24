// Report in three steps and My reports (part 2 of the phone rebuild, 24 Nov 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  REPORT_CATEGORIES, RESIDENT_IMPACTS, stepProblem, submissionBody, descriptionOk, addStoredReport, parseStoredReports,
  parseStatuses, lifecycleOf, statusLine, sentLabel, MY_REPORTS_LIMIT,
} from '../src/lib/township.ts';

const area = { id: 'local', name: 'My area', rings: [[[100, 5], [100.1, 5], [100.1, 5.1], [100, 5.1], [100, 5]]] };
const ID = 'cmwtych1b00007d0kjx78yht2';

test('the form offers the website’s categories and the four "can cars get through" answers', () => {
  assert.deepEqual([...REPORT_CATEGORIES].sort(), ['fallen_tree', 'flooding', 'other', 'pothole', 'road_obstruction', 'roadworks', 'storm_damage']);
  assert.deepEqual(RESIDENT_IMPACTS.map(i => i.label), ['Partly blocked', 'Possibly closed', 'Take care', 'Not sure']);
});

test('each step says what is missing before moving on', () => {
  const draft = { category: null, impact: null, point: null, description: '' };
  assert.equal(stepProblem(1, draft, area), 'Choose what you saw.');
  assert.equal(stepProblem(1, { ...draft, category: 'flooding' }, area), 'Say whether cars can get through.');
  assert.equal(stepProblem(1, { ...draft, category: 'flooding', impact: 'caution' }, area), null);
  assert.equal(stepProblem(2, draft, area), 'Tap the map where it is.');
  assert.equal(stepProblem(2, { ...draft, point: { latitude: 3.08, longitude: 101.43 } }, area), 'That spot is outside My area.');
  assert.equal(stepProblem(2, { ...draft, point: { latitude: 5.05, longitude: 100.05 } }, area), null);
  assert.equal(stepProblem(3, { ...draft, description: '  short ' }, area), 'Write at least 8 characters.');
  assert.equal(descriptionOk('x'.repeat(401)), false);
});

test('the report body matches what the laptop accepts: [longitude, latitude], trimmed text', () => {
  assert.deepEqual(submissionBody({ category: 'flooding', impact: 'caution', point: { latitude: 5.05, longitude: 100.05 }, description: '  Water across both lanes ' }),
    { category: 'flooding', impact: 'caution', description: 'Water across both lanes', coordinates: [100.05, 5.05] });
  assert.throws(() => submissionBody({ category: null, impact: 'caution', point: null, description: 'xxxxxxxxx' }));
});

test('My reports keeps up to 50 on the phone, newest first, without duplicates or junk', () => {
  let list = [];
  for (let i = 0; i < 55; i++) list = addStoredReport(list, { id: `cmwt${String(i).padStart(21, '0')}`, category: 'flooding', impact: 'caution', sentAt: '2026-11-24T01:00:00Z' });
  assert.equal(list.length, MY_REPORTS_LIMIT);
  list = addStoredReport(list, list[10]);
  assert.equal(list.length, MY_REPORTS_LIMIT);
  assert.equal(parseStoredReports('not json').length, 0);
  assert.equal(parseStoredReports(JSON.stringify([{ id: 'bad id!', category: 'x', impact: 'y', sentAt: 'z' }])).length, 0);
  assert.equal(parseStoredReports(JSON.stringify([{ id: ID, category: 'flooding', impact: 'caution', sentAt: '2026-11-24T01:00:00Z' }])).length, 1);
});

test('the four-step track and status line match the website, including Resolved', () => {
  const st = (reviewState, incidentStatus = null) => ({ id: ID, reviewState, incidentStatus, updatedAt: '' });
  assert.equal(lifecycleOf(st('unverified')).current, 1);
  assert.equal(lifecycleOf(st('corroborated')).current, 2);
  assert.equal(lifecycleOf(st('corroborated', 'resolved')).current, 3);
  const rejected = lifecycleOf(st('rejected'));
  assert.deepEqual([rejected.current, rejected.labels[2], rejected.rejected], [2, 'Could not confirm', true]);
  assert.match(statusLine(st('corroborated', 'resolved')), /^Resolved/);
  assert.match(statusLine(null), /^Not found/);
  assert.deepEqual(parseStatuses({ reports: [{ id: ID, reviewState: 'corroborated', incidentStatus: 'resolved', updatedAt: 'x' }, { nope: 1 }] }).map(s => s.incidentStatus), ['resolved']);
});

test('sent times read naturally', () => {
  const now = new Date(2026, 10, 24, 18, 0);
  assert.equal(sentLabel(new Date(2026, 10, 24, 9, 5).toISOString(), now), 'Sent today 09:05');
  assert.equal(sentLabel(new Date(2026, 10, 23, 9, 5).toISOString(), now), 'Sent yesterday');
  assert.equal(sentLabel(new Date(2026, 10, 1, 9, 5).toISOString(), now), 'Sent 1 Nov');
});

test('screens use the shared logic; the old mock data and BBR checks are gone', () => {
  const report = readFileSync('src/app/submit.tsx', 'utf8');
  assert.match(report, /stepProblem\(step, effective, area\)/);
  assert.match(report, /rememberReport\(\{ id,/);
  assert.match(report, /uploadPrivateEvidence\(backendUrl, id, photo\.evidence\)/, 'photos are only sent after the report exists');
  const mine = readFileSync('src/app/reports.tsx', 'utf8');
  assert.match(mine, /loadStatuses\(backendUrl/);
  assert.doesNotMatch(mine + report, /mock-reports|public-reports|validDemoLocation/);
  assert.match(readFileSync('src/components/app-tabs.tsx', 'utf8'), /My reports/);
});
