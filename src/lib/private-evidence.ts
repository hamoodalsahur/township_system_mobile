/**
 * M4 transport boundary for private *fictional* sample images.
 *
 * This is deliberately independent of the photo picker. Callers must first
 * re-encode the chosen sample (discarding image metadata) and keep it in memory.
 * Never cache image bytes, send an operator key, or display private evidence.
 */
export const MAX_PRIVATE_EVIDENCE_BYTES = 200_000;
export const MAX_PRIVATE_EVIDENCE_JSON_BYTES = 320_000;

export type PrivateEvidencePhoto = {
  mimeType: 'image/jpeg' | 'image/png';
  base64Data: string;
};

export type EvidenceUploadOutcome =
  | { status: 'uploaded' }
  | { status: 'rejected'; message: string }
  | { status: 'uncertain'; message: string };

/** Match the mobile app's private-LAN-only port 3000 policy; reject URLs with credentials or paths. */
export function requirePrivateBackendUrl(raw: string): string {
  if (typeof raw !== 'string') throw new Error('Configure a trusted private PC address in About.');
  const trimmed = raw.trim().replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Configure a trusted private PC address in About.');
  }
  const host = parsed.hostname;
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) throw new Error('Only a private PC IPv4 address is allowed.');
  const octets = host.split('.').map(Number);
  const [first, second] = octets;
  const isPrivate = first === 10 || (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31);
  if (octets.some(part => !Number.isInteger(part) || part < 0 || part > 255) ||
    !isPrivate || parsed.protocol !== 'http:' || parsed.port !== '3000' ||
    parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('Use a trusted private PC address such as http://192.168.1.23:3000.');
  }
  return trimmed;
}

/** Preflight mirrors the backend evidence policy; the server independently validates again. */
export function preparePrivateEvidence(input: unknown): PrivateEvidencePhoto {
  if (!input || typeof input !== 'object') throw new Error('Choose a fictional sample image.');
  const photo = input as Record<string, unknown>;
  if (photo.mimeType !== 'image/jpeg' && photo.mimeType !== 'image/png') {
    throw new Error('Only re-encoded JPEG or PNG sample images can be sent.');
  }
  const data = photo.base64Data;
  if (typeof data !== 'string' || data.length === 0 ||
    data.length % 4 !== 0 || data.length > Math.ceil(MAX_PRIVATE_EVIDENCE_BYTES * 4 / 3) + 4 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
    throw new Error('The sample image encoding is invalid or too large.');
  }
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  const bytes = data.length / 4 * 3 - padding;
  // Check pad bits as well so that noncanonical Base64 cannot pass client preflight.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lastValue = alphabet.indexOf(data[data.length - padding - 1]);
  const canonical = padding === 0 || (padding === 2 && (lastValue & 15) === 0) ||
    (padding === 1 && (lastValue & 3) === 0);
  if (!canonical || bytes > MAX_PRIVATE_EVIDENCE_BYTES || bytes === 0) {
    throw new Error('The sample image exceeds the 200,000-byte limit or has invalid encoding.');
  }
  // JPEG begins FF D8 FF; PNG begins with the standard eight-byte signature.
  const correctSignature = photo.mimeType === 'image/jpeg'
    ? bytes > 3 && data.startsWith('/9j/')
    : bytes > 8 && data.startsWith('iVBORw0KGgo');
  if (!correctSignature) throw new Error('Image contents do not match the declared JPEG/PNG type.');
  const clean: PrivateEvidencePhoto = { mimeType: photo.mimeType, base64Data: data };
  if (JSON.stringify(clean).length > MAX_PRIVATE_EVIDENCE_JSON_BYTES) {
    throw new Error('The evidence request is too large.');
  }
  return clean;
}

/**
 * Upload ONLY to an already-created fictional report. Never creates reports,
 * retries, requests private evidence, or approves anything for publication.
 * When delivery cannot be confirmed, the caller must check management first.
 */
export async function uploadPrivateEvidence(
  baseUrl: string,
  reportId: string,
  photo: unknown,
  request: typeof fetch = fetch
): Promise<EvidenceUploadOutcome> {
  const url = requirePrivateBackendUrl(baseUrl);
  if (typeof reportId !== 'string' || !/^[A-Za-z0-9_-]{5,128}$/.test(reportId)) {
    throw new Error('A valid saved fictional report reference is required.');
  }
  const payload = preparePrivateEvidence(photo);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await request(url + '/api/v2/hazards/' + encodeURIComponent(reportId) + '/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      if (response.status === 409) {
        return { status: 'rejected', message: 'Evidence may already be attached or the report was reviewed. Check management.' };
      }
      if (response.status === 413) {
        return { status: 'rejected', message: 'The backend rejected the image size. Use a smaller sample.' };
      }
      if (response.status === 400 || response.status === 403 || response.status === 404) {
        return { status: 'rejected', message: 'The development backend cannot accept this evidence for that report.' };
      }
      return { status: 'uncertain', message: 'Evidence delivery is unconfirmed. Check management before trying again.' };
    }
    const result: unknown = await response.json();
    if (response.status === 201 && result && typeof result === 'object' &&
      'saved' in result && result.saved === true) return { status: 'uploaded' };
    return { status: 'uncertain', message: 'Unexpected evidence response. Check management before trying again.' };
  } catch {
    return { status: 'uncertain', message: 'Evidence delivery is unconfirmed. Check management before trying again.' };
  } finally {
    clearTimeout(timeout);
  }
}
