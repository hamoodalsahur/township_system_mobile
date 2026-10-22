export type PublicReport = {
  id: string;
  category: string;
  description: string;
  impact: string;
  reviewState: string;
  longitude: number;
  latitude: number;
  createdAt: string;
  hasApprovedPhoto: boolean;
};

export function normalizePrivateLanUrl(input: string): string | null {
  const trimmed = input.trim().replace(/\/+$/, '');
  const match = /^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(trimmed);
  if (!match) return null;
  try {
    const url = new URL(trimmed);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    const octets = url.hostname.split('.').map(Number);
    if (octets.length !== 4 || octets.some(x => !Number.isInteger(x) || x < 0 || x > 255)) return null;
    if (!url.port || url.port !== '3000') return null;
    return trimmed;
  } catch { return null; }
}

export async function loadPublicReports(baseUrl: string): Promise<PublicReport[]> {
  const safeUrl = normalizePrivateLanUrl(baseUrl);
  if (!safeUrl) throw new Error('Enter a trusted private PC address, e.g. http://192.168.1.23:3000');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(safeUrl + '/api/v2/hazards', { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(response.status >= 500 ? 'Township backend unavailable.' : 'Backend refused the request.');
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || !('reports' in result) || !Array.isArray(result.reports)) throw new Error('Unexpected report response.');
    return result.reports.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new Error('Invalid report received.');
      const r = item as Record<string, unknown>;
      if (typeof r.id !== 'string' || typeof r.category !== 'string' || typeof r.description !== 'string' ||
        typeof r.impact !== 'string' || typeof r.reviewState !== 'string' ||
        typeof r.latitude !== 'number' || typeof r.longitude !== 'number' ||
        typeof r.createdAt !== 'string' || typeof r.hasApprovedPhoto !== 'boolean') {
        throw new Error('Report data does not match the expected public API.');
      }
      return {
        id: r.id, category: r.category, description: r.description,
        impact: r.impact, reviewState: r.reviewState,
        longitude: r.longitude, latitude: r.latitude,
        createdAt: r.createdAt, hasApprovedPhoto: r.hasApprovedPhoto
      } as PublicReport;
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Connection timed out. Check your Wi-Fi and PC address.');
    throw error;
  } finally { clearTimeout(timeout); }
}
