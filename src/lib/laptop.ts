/**
 * Talks to the Laluan website running on the owner's laptop (same Wi-Fi). Read-only here;
 * submitting reports stays in the report flow. Every request gives up after 8 seconds.
 */
import { normalizePrivateLanUrl, parseClosures, parseReports, parseServiceArea, type PublicClosure, type PublicReport, type ServiceArea } from './township';

export class LaptopError extends Error {}

export async function getJson(baseUrl: string, path: string): Promise<unknown> {
  const safeUrl = normalizePrivateLanUrl(baseUrl);
  if (!safeUrl) throw new LaptopError('Set your laptop address in Settings, for example http://192.168.1.23:3000');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(safeUrl + path, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new LaptopError(response.status >= 500 ? 'The laptop could not answer. Is the database running?' : 'The laptop refused the request.');
    return await response.json();
  } catch (error) {
    if (error instanceof LaptopError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new LaptopError('No answer from the laptop. Check the Wi-Fi and the address in Settings.');
    throw new LaptopError('Could not reach the laptop. Is npm run dev running, and are both on the same Wi-Fi?');
  } finally { clearTimeout(timeout); }
}

export const loadServiceArea = async (baseUrl: string): Promise<ServiceArea> => parseServiceArea(await getJson(baseUrl, '/api/service-area'));
export const loadReports = async (baseUrl: string): Promise<PublicReport[]> => parseReports(await getJson(baseUrl, '/api/v2/hazards'));
export const loadClosures = async (baseUrl: string): Promise<PublicClosure[]> => parseClosures(await getJson(baseUrl, '/api/v2/closures/public'));
