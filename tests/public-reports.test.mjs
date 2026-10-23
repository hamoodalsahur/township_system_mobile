import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPublicReports, normalizePrivateLanUrl } from '../src/lib/public-reports.ts';

const PC = 'http://192.168.1.23:3000';
const report = {
  id: 'demo-report-1',
  category: 'flooding',
  description: 'Fictional example, not a real flood.',
  impact: 'caution',
  reviewState: 'unverified',
  longitude: 101.4318,
  latitude: 3.0876,
  createdAt: '2026-10-23T00:00:00.000Z',
  hasApprovedPhoto: false
};

async function withFetch(mock, run) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try { return await run(); } finally { globalThis.fetch = original; }
}

test('private PC URL policy rejects public, unauthenticated and unsafe network targets', () => {
  assert.equal(normalizePrivateLanUrl(PC + '/'), PC);
  assert.equal(normalizePrivateLanUrl('http://10.1.2.3:3000'), 'http://10.1.2.3:3000');
  assert.equal(normalizePrivateLanUrl('http://172.16.2.3:3000'), 'http://172.16.2.3:3000');
  for (const raw of [
    'https://192.168.1.23:3000', 'http://localhost:3000', 'http://8.8.8.8:3000',
    'http://172.32.1.2:3000', 'http://192.168.1.23:8080',
    'http://192.168.1.23:3000/admin', 'http://192.168.1.23:3000/?secret=1',
    'http://user:secret@192.168.1.23:3000', 'file:///tmp/demo'
  ]) assert.equal(normalizePrivateLanUrl(raw), null, raw);
});

test('public fictional reports load without cookies or cache; public fields only', async () => {
  let calls = 0;
  await withFetch(async (url, opts) => {
    calls++;
    assert.equal(url, PC + '/api/v2/hazards');
    assert.equal(opts.cache, 'no-store');
    assert.ok(opts.signal);
    return Response.json({ reports: [report] });
  }, async () => {
    assert.deepEqual(await loadPublicReports(PC), [report]);
    assert.deepEqual(await loadPublicReports(PC), [report]);
  });
  assert.equal(calls, 2, 'each explicit refresh must make a fresh request');
});

test('empty fictional report list is valid', async () => {
  await withFetch(async () => Response.json({ reports: [] }), async () => {
    assert.deepEqual(await loadPublicReports(PC), []);
  });
});

test('server errors never turn into accepted or cached report data', async () => {
  await withFetch(async () => new Response('', { status: 500 }), async () => {
    await assert.rejects(loadPublicReports(PC), /unavailable/i);
  });
  await withFetch(async () => new Response('', { status: 403 }), async () => {
    await assert.rejects(loadPublicReports(PC), /refused/i);
  });
});

test('malformed responses and missing review fields fail closed', async () => {
  const invalid = [
    null, {}, { reports: null }, { reports: 'not an array' },
    { reports: [null] }, { reports: [{ ...report, id: 123 }] },
    { reports: [{ ...report, latitude: '3.08' }] },
    { reports: [{ ...report, hasApprovedPhoto: undefined }] },
    { reports: [{ ...report, reviewState: null }] }
  ];
  for (const body of invalid) {
    await withFetch(async () => Response.json(body), async () => {
      await assert.rejects(loadPublicReports(PC), /report|response/i);
    });
  }
});

test('refuse non-LAN URLs before making any network request', async () => {
  await withFetch(async () => { throw Error('fetch should not be called'); }, async () => {
    await assert.rejects(loadPublicReports('http://example.com:3000'), /trusted private PC address/);
  });
});

test('backend network failure is reported, not replaced with old data', async () => {
  await withFetch(async () => { throw Error('offline'); }, async () => {
    await assert.rejects(loadPublicReports(PC), /offline/);
  });
});
