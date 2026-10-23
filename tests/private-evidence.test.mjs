import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PRIVATE_EVIDENCE_BYTES,
  preparePrivateEvidence,
  requirePrivateBackendUrl,
  uploadPrivateEvidence
} from '../src/lib/private-evidence.ts';

const demoJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64');
const demoPng = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]).toString('base64');
const jpeg = { mimeType: 'image/jpeg', base64Data: demoJpeg };

test('only a trusted private PC IPv4:3000 without paths or credentials is accepted', () => {
  assert.equal(requirePrivateBackendUrl(' http://192.168.1.23:3000/ '), 'http://192.168.1.23:3000');
  assert.equal(requirePrivateBackendUrl('http://10.1.2.3:3000'), 'http://10.1.2.3:3000');
  assert.equal(requirePrivateBackendUrl('http://172.31.0.1:3000'), 'http://172.31.0.1:3000');
  for (const bad of [
    'https://192.168.1.23:3000', 'http://localhost:3000', 'http://8.8.8.8:3000',
    'http://172.32.0.1:3000', 'http://192.168.1.23:8080',
    'http://192.168.1.23:3000/admin', 'http://192.168.1.23:3000/?key=test',
    'http://user:pass@192.168.1.23:3000', 'http://192.168.1.23:3000#fragment'
  ]) assert.throws(() => requirePrivateBackendUrl(bad), { name: 'Error' }, bad);
});

test('preflight allows only matching canonical JPEG/PNG image signatures', () => {
  assert.deepEqual(preparePrivateEvidence(jpeg), jpeg);
  const png = { mimeType: 'image/png', base64Data: demoPng };
  assert.deepEqual(preparePrivateEvidence(png), png);
  assert.throws(() => preparePrivateEvidence({ ...jpeg, mimeType: 'image/png' }));
  assert.throws(() => preparePrivateEvidence({ ...jpeg, mimeType: 'image/gif' }));
  assert.throws(() => preparePrivateEvidence({ ...jpeg, base64Data: '/9j/AA=A' }));
  assert.throws(() => preparePrivateEvidence({ ...jpeg, base64Data: '/9j/AAAA ' }));
  assert.throws(() => preparePrivateEvidence({ ...jpeg, base64Data: 'AB==' }));
  assert.throws(() => preparePrivateEvidence(null));
});

test('200,000 decoded bytes are accepted and 200,001 are blocked before network', () => {
  const bytes = Buffer.alloc(MAX_PRIVATE_EVIDENCE_BYTES);
  bytes.set([0xff, 0xd8, 0xff, 0]);
  const exact = { mimeType: 'image/jpeg', base64Data: bytes.toString('base64') };
  assert.deepEqual(preparePrivateEvidence(exact), exact);
  const tooBig = Buffer.concat([bytes, Buffer.from([0])]);
  assert.throws(() => preparePrivateEvidence({ ...exact, base64Data: tooBig.toString('base64') }));
});

test('upload sends only the evidence JSON to the already-created report, never a key', async () => {
  let calls = 0;
  const result = await uploadPrivateEvidence('http://192.168.0.5:3000', 'demo_report-123', jpeg,
    async (url, init) => {
      calls++;
      assert.equal(url, 'http://192.168.0.5:3000/api/v2/hazards/demo_report-123/evidence');
      assert.equal(init.method, 'POST');
      assert.deepEqual(init.headers, { 'Content-Type': 'application/json' });
      assert.deepEqual(JSON.parse(init.body), jpeg);
      assert.ok(init.signal);
      return Response.json({ saved: true }, { status: 201 });
    });
  assert.equal(calls, 1);
  assert.deepEqual(result, { status: 'uploaded' });
});

test('invalid report reference and oversized evidence never reach the network', async () => {
  const never = async () => { throw Error('Network should not have been called'); };
  await assert.rejects(uploadPrivateEvidence('http://192.168.1.23:3000', '../not-a-report', jpeg, never));
  await assert.rejects(uploadPrivateEvidence('https://192.168.1.23:3000', 'demo-report-123', jpeg, never));
  await assert.rejects(uploadPrivateEvidence('http://192.168.1.23:3000', 'demo-report-123',
    { ...jpeg, base64Data: 'not-base64' }, never));
});

test('backend rejection is not confused with upload success', async () => {
  const conflict = await uploadPrivateEvidence('http://10.0.0.7:3000', 'report123', jpeg,
    async () => Response.json({ error: 'already attached' }, { status: 409 }));
  assert.equal(conflict.status, 'rejected');
  const tooLarge = await uploadPrivateEvidence('http://10.0.0.7:3000', 'report123', jpeg,
    async () => Response.json({}, { status: 413 }));
  assert.equal(tooLarge.status, 'rejected');
  const serverFail = await uploadPrivateEvidence('http://10.0.0.7:3000', 'report123', jpeg,
    async () => Response.json({}, { status: 500 }));
  assert.equal(serverFail.status, 'uncertain');
});

test('timeout, disconnected network and unusual success response are not retried', async () => {
  let calls = 0;
  const disconnected = await uploadPrivateEvidence('http://10.0.0.7:3000', 'report123', jpeg,
    async () => { calls++; throw new Error('Disconnected'); });
  assert.equal(disconnected.status, 'uncertain');
  const strange = await uploadPrivateEvidence('http://10.0.0.7:3000', 'report123', jpeg,
    async () => { calls++; return Response.json({ saved: false }, { status: 201 }); });
  assert.equal(strange.status, 'uncertain');
  assert.equal(calls, 2);
});
