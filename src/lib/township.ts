/**
 * Shared logic for the Laluan phone app (Night Desk rebuild, 24 Nov 2026).
 * No imports, so `node --test` can load this file directly. Values match the website
 * (src/lib/hazard-presentation.ts, road-closures.ts, service-area.ts in township_road_hazard_system).
 */

export type LonLat = [number, number];

// ---------- Service area ----------

/** The area the laptop serves (GET /api/service-area). Outer ring first, then holes. */
export type ServiceArea = { id: string; name: string; rings: LonLat[][] };
export type Bounds = { west: number; south: number; east: number; north: number };

function insideRing(lon: number, lat: number, ring: LonLat[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** True when the point is inside the outer ring and outside every hole. */
export function isInsideArea(area: ServiceArea, lon: number, lat: number): boolean {
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || area.rings.length === 0) return false;
  const [outer, ...holes] = area.rings;
  return insideRing(lon, lat, outer) && !holes.some(hole => insideRing(lon, lat, hole));
}

export function boundsOf(points: readonly LonLat[]): Bounds | null {
  if (points.length === 0) return null;
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const [lon, lat] of points) {
    west = Math.min(west, lon); east = Math.max(east, lon);
    south = Math.min(south, lat); north = Math.max(north, lat);
  }
  return { west, south, east, north };
}

/** A map region (react-native-maps) that shows the bounds with a little room around them. */
export function regionFor(bounds: Bounds, margin = 1.15) {
  return {
    latitude: (bounds.south + bounds.north) / 2,
    longitude: (bounds.west + bounds.east) / 2,
    latitudeDelta: Math.max((bounds.north - bounds.south) * margin, 0.005),
    longitudeDelta: Math.max((bounds.east - bounds.west) * margin, 0.005),
  };
}

/** react-native-maps wants { latitude, longitude }; the API sends [longitude, latitude]. */
export const toLatLng = ([longitude, latitude]: LonLat) => ({ latitude, longitude });

// ---------- Hazards ----------

export type SeverityKey = 'suspected_closure' | 'partial_obstruction' | 'caution' | 'unknown';
export type Severity = { key: SeverityKey; label: string; solid: string; tint: string; text: string; glyph: string };

/** Severity colours are for hazards only, never for buttons or headings (same as the website). */
export const SEVERITY: Record<SeverityKey, Severity> = {
  suspected_closure: { key: 'suspected_closure', label: 'Possibly closed', solid: '#B42318', tint: '#FCEBE8', text: '#8F1C13', glyph: '#FFFFFF' },
  partial_obstruction: { key: 'partial_obstruction', label: 'Partly blocked', solid: '#B9480F', tint: '#FDEEE3', text: '#8A3509', glyph: '#FFFFFF' },
  caution: { key: 'caution', label: 'Take care', solid: '#F2B42C', tint: '#FDF4DC', text: '#7A5100', glyph: '#0F1513' },
  unknown: { key: 'unknown', label: 'Not sure', solid: '#68716C', tint: '#ECEDEA', text: '#47504B', glyph: '#FFFFFF' },
};

export function severityOf(impact: string | null | undefined): Severity {
  return Object.prototype.hasOwnProperty.call(SEVERITY, impact ?? '') ? SEVERITY[impact as SeverityKey] : SEVERITY.unknown;
}

export const CATEGORY_LABELS: Record<string, string> = {
  flooding: 'Flooding', roadworks: 'Roadworks', fallen_tree: 'Fallen tree',
  pothole: 'Pothole', road_obstruction: 'Blocked road', storm_damage: 'Storm damage', other: 'Other',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}

/** SF Symbols for each category (iOS). Unknown categories get a plain mark. */
export const CATEGORY_SYMBOLS: Record<string, string> = {
  flooding: 'water.waves', roadworks: 'cone.fill', fallen_tree: 'tree.fill', pothole: 'circle.bottomhalf.filled',
  road_obstruction: 'xmark.octagon.fill', storm_damage: 'cloud.bolt.fill', other: 'exclamationmark',
};
export const symbolFor = (category: string) => CATEGORY_SYMBOLS[category] ?? 'exclamationmark';

/** Resident words for review state: approved reports are "Confirmed", everything else is still being checked. */
export const reviewLabel = (reviewState: string) => (reviewState === 'corroborated' ? 'Confirmed' : 'Being checked');

export type PublicReport = {
  id: string; category: string; description: string; impact: string; reviewState: string;
  longitude: number; latitude: number; createdAt: string; hasApprovedPhoto: boolean;
};

/** Reports shown on the resident map: inside the area, newest first. The API already leaves out rejected and resolved ones. */
export function reportsForMap(reports: readonly PublicReport[], area: ServiceArea | null): PublicReport[] {
  return reports
    .filter(r => r.reviewState !== 'rejected' && (!area || isInsideArea(area, r.longitude, r.latitude)))
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}

// ---------- Road closures ----------

export type PublicClosure = {
  id: string; kind: string; kindLabel: string; endsAt: string; category: string; categoryLabel: string; title: string;
  roads: { wayId: string; name: string; coordinates: LonLat[] }[];
};

const two = (n: number) => String(n).padStart(2, '0');
const hhmm = (d: Date) => `${two(d.getHours())}:${two(d.getMinutes())}`;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "until 13:59", "until tomorrow 09:00", "until Fri 18:00", "until 3 Dec 18:00" (local time, like the website). */
export function untilLabel(endsAt: string | Date, now: Date = new Date()): string {
  const at = new Date(endsAt);
  if (!Number.isFinite(at.getTime())) return '';
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(at) - day(now)) / 86_400_000);
  if (days <= 0) return `until ${hhmm(at)}`;
  if (days === 1) return `until tomorrow ${hhmm(at)}`;
  if (days < 7) return `until ${WEEKDAYS[at.getDay()]} ${hhmm(at)}`;
  return `until ${at.getDate()} ${MONTHS[at.getMonth()]} ${hhmm(at)}`;
}

/** "Closed until 13:59" for the label on the map. */
export function mapClosureLabel(closure: Pick<PublicClosure, 'kind' | 'endsAt'>, now: Date = new Date()): string {
  return `${closure.kind === 'one_lane' ? 'One lane' : 'Closed'} ${untilLabel(closure.endsAt, now)}`;
}

/** Where the label sits: the middle point of the longest road in the closure. */
export function closureLabelPoint(closure: Pick<PublicClosure, 'roads'>): LonLat | null {
  const longest = [...closure.roads].sort((a, b) => b.coordinates.length - a.coordinates.length)[0];
  if (!longest || longest.coordinates.length === 0) return null;
  return longest.coordinates[Math.floor(longest.coordinates.length / 2)];
}

// ---------- Laptop address and API answers ----------

/**
 * The laptop's address on the home or campus Wi-Fi, e.g. http://192.168.1.23:3000.
 * Only private network addresses on port 3000, never localhost or the internet.
 */
export function normalizePrivateLanUrl(input: string): string | null {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (!/^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    const octets = url.hostname.split('.').map(Number);
    if (octets.length !== 4 || octets.some(x => !Number.isInteger(x) || x < 0 || x > 255)) return null;
    if (url.port !== '3000') return null;
    return trimmed;
  } catch { return null; }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isLonLat = (v: unknown): v is LonLat => Array.isArray(v) && v.length >= 2 && Number.isFinite(v[0]) && Number.isFinite(v[1]);

export function parseServiceArea(body: unknown): ServiceArea {
  const area = isRecord(body) && isRecord(body.area) ? body.area : null;
  if (!area || typeof area.id !== 'string' || typeof area.name !== 'string' || !Array.isArray(area.rings)
    || !area.rings.every(ring => Array.isArray(ring) && ring.length >= 4 && ring.every(isLonLat))) {
    throw new Error('The laptop sent an area this app does not understand.');
  }
  return { id: area.id, name: area.name, rings: area.rings.map(ring => (ring as LonLat[]).map(([lon, lat]) => [lon, lat] as LonLat)) };
}

export function parseReports(body: unknown): PublicReport[] {
  if (!isRecord(body) || !Array.isArray(body.reports)) throw new Error('Unexpected report response.');
  return body.reports.map(item => {
    const r = isRecord(item) ? item : {};
    if (typeof r.id !== 'string' || typeof r.category !== 'string' || typeof r.description !== 'string'
      || typeof r.impact !== 'string' || typeof r.reviewState !== 'string'
      || typeof r.latitude !== 'number' || typeof r.longitude !== 'number' || typeof r.createdAt !== 'string') {
      throw new Error('Report data does not match the public API.');
    }
    return { id: r.id, category: r.category, description: r.description, impact: r.impact, reviewState: r.reviewState,
      longitude: r.longitude, latitude: r.latitude, createdAt: r.createdAt, hasApprovedPhoto: r.hasApprovedPhoto === true };
  });
}

export function parseClosures(body: unknown): PublicClosure[] {
  if (!isRecord(body) || !Array.isArray(body.closures)) throw new Error('Unexpected closures response.');
  return body.closures.flatMap(item => {
    const c = isRecord(item) ? item : {};
    if (typeof c.id !== 'string' || typeof c.endsAt !== 'string' || !Array.isArray(c.roads)) return [];
    const roads = c.roads.flatMap(road => isRecord(road) && Array.isArray(road.coordinates) && road.coordinates.every(isLonLat) && road.coordinates.length >= 2
      ? [{ wayId: String(road.wayId ?? ''), name: String(road.name ?? 'Road'), coordinates: (road.coordinates as LonLat[]).map(([lon, lat]) => [lon, lat] as LonLat) }] : []);
    if (roads.length === 0) return [];
    return [{ id: c.id, kind: String(c.kind ?? 'closed'), kindLabel: String(c.kindLabel ?? 'Closed to cars'), endsAt: c.endsAt,
      category: String(c.category ?? 'road_obstruction'), categoryLabel: String(c.categoryLabel ?? 'Blocked road'), title: String(c.title ?? 'Road'), roads }];
  });
}

// ---------- Reporting (part 2, 24 Nov 2026) ----------

/** Same order and words as the website's report form. */
export const REPORT_CATEGORIES = ['flooding', 'fallen_tree', 'road_obstruction', 'pothole', 'roadworks', 'storm_damage', 'other'] as const;
export const RESIDENT_IMPACTS = [
  { value: 'partial_obstruction', label: 'Partly blocked', hint: 'Cars can still pass, slowly' },
  { value: 'suspected_closure', label: 'Possibly closed', hint: 'I don’t think cars can pass' },
  { value: 'caution', label: 'Take care', hint: 'Passable, but watch out' },
  { value: 'unknown', label: 'Not sure', hint: '' },
] as const;
export const DESCRIPTION_MIN = 8;
export const DESCRIPTION_MAX = 400;
export const descriptionOk = (text: string) => text.trim().length >= DESCRIPTION_MIN && text.length <= DESCRIPTION_MAX;

export type ReportDraft = { category: string | null; impact: string | null; point: { latitude: number; longitude: number } | null; description: string };

/** What is still missing before a step can move on, in the resident's words; null when it is ready. */
export function stepProblem(step: 1 | 2 | 3, draft: ReportDraft, area: ServiceArea | null): string | null {
  if (step === 1) return !draft.category ? 'Choose what you saw.' : !draft.impact ? 'Say whether cars can get through.' : null;
  if (step === 2) {
    if (!draft.point) return 'Tap the map where it is.';
    if (area && !isInsideArea(area, draft.point.longitude, draft.point.latitude)) return `That spot is outside ${area.name}.`;
    return null;
  }
  return descriptionOk(draft.description) ? null : `Write at least ${DESCRIPTION_MIN} characters.`;
}

/** The body for POST /api/v2/hazards. */
export function submissionBody(draft: ReportDraft) {
  if (!draft.category || !draft.impact || !draft.point) throw new Error('The report is not finished.');
  return { category: draft.category, impact: draft.impact, description: draft.description.trim(), coordinates: [draft.point.longitude, draft.point.latitude] };
}

// ---------- My reports ----------

/** Kept on the phone only: which reports this phone sent. Their progress is looked up; nothing else is sent. */
export type StoredReport = { id: string; category: string; impact: string; sentAt: string };
export const MY_REPORTS_LIMIT = 50;
export const REPORT_ID_PATTERN = /^[a-z0-9]{20,40}$/;

export function addStoredReport(list: readonly StoredReport[], entry: StoredReport): StoredReport[] {
  return [entry, ...list.filter(item => item.id !== entry.id)].slice(0, MY_REPORTS_LIMIT);
}

export function parseStoredReports(raw: string | null): StoredReport[] {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(value)) return [];
    return value.filter((r): r is StoredReport => isRecord(r) && typeof r.id === 'string' && REPORT_ID_PATTERN.test(r.id)
      && typeof r.category === 'string' && typeof r.impact === 'string' && typeof r.sentAt === 'string').slice(0, MY_REPORTS_LIMIT);
  } catch { return []; }
}

/** Public status of one report (GET /api/v2/hazards/status): never the operator's note. */
export type ReportStatus = { id: string; reviewState: string; incidentStatus: string | null; updatedAt: string };

export function parseStatuses(body: unknown): ReportStatus[] {
  if (!isRecord(body) || !Array.isArray(body.reports)) throw new Error('Unexpected status response.');
  return body.reports.flatMap(r => isRecord(r) && typeof r.id === 'string' && typeof r.reviewState === 'string'
    ? [{ id: r.id, reviewState: r.reviewState, incidentStatus: typeof r.incidentStatus === 'string' ? r.incidentStatus : null, updatedAt: String(r.updatedAt ?? '') }] : []);
}

export const LIFECYCLE_STEPS = ['Received', 'Being checked', 'Confirmed', 'Resolved'] as const;

/** Which step the report is on; a rejected report stops at step 3 as "Could not confirm" (like the website). */
export function lifecycleOf(status: ReportStatus | null | undefined): { current: number; labels: string[]; rejected: boolean } {
  const labels: string[] = [...LIFECYCLE_STEPS];
  if (!status) return { current: 0, labels, rejected: false };
  if (status.reviewState === 'rejected') { labels[2] = 'Could not confirm'; return { current: 2, labels, rejected: true }; }
  if (status.incidentStatus === 'resolved') return { current: 3, labels, rejected: false };
  if (status.reviewState === 'corroborated') return { current: 2, labels, rejected: false };
  return { current: 1, labels, rejected: false };
}

export function statusLine(status: ReportStatus | null | undefined): string {
  if (!status) return 'Not found. It may have been removed from this demo.';
  if (status.reviewState === 'rejected') return 'Could not confirm. It is not shown on the map.';
  if (status.incidentStatus === 'resolved') return 'Resolved. The township team has closed it.';
  if (status.reviewState === 'corroborated') return 'Confirmed. Shown on the map for everyone.';
  return 'Being checked by the township team.';
}

/** "Sent today 16:13", "Sent yesterday", "Sent Thursday" (within a week), else "Sent 12 Nov". */
export function sentLabel(sentAt: string, now: Date = new Date()): string {
  const at = new Date(sentAt);
  if (!Number.isFinite(at.getTime())) return 'Sent';
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(at)) / 86_400_000);
  if (days <= 0) return `Sent today ${hhmm(at)}`;
  if (days === 1) return 'Sent yesterday';
  if (days < 7) return `Sent ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][at.getDay()]}`;
  return `Sent ${at.getDate()} ${MONTHS[at.getMonth()]}`;
}

// ---------- Way home (part 3, 24 Nov 2026) ----------

/**
 * Home and the usual starting place, kept on this phone only (same shape and key as the website's
 * browser copy). Rounded to 5 decimals, about 1 m. Sent to the laptop only inside a route check.
 */
export const WAY_HOME_KEY = 'laluan.wayHome.v1';
export type WayHomeSettings = { home: LonLat; start: { kind: 'place'; at: LonLat } };

const trim5 = (p: LonLat): LonLat => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];

export function parseWayHome(raw: string | null): WayHomeSettings | null {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!isRecord(value) || !isLonLat(value.home) || !isRecord(value.start) || value.start.kind !== 'place' || !isLonLat(value.start.at)) return null;
    return { home: [value.home[0], value.home[1]], start: { kind: 'place', at: [value.start.at[0], value.start.at[1]] } };
  } catch { return null; }
}

export function serializeWayHome(settings: WayHomeSettings): string {
  return JSON.stringify({ home: trim5(settings.home), start: { kind: 'place', at: trim5(settings.start.at) } });
}

export type RouteLine = { distanceM: number; durationS: number; coordinates: LonLat[] };
export type WayHomeAnswer = {
  status: 'clear' | 'affected' | 'blocked' | 'no_route';
  usual: RouteLine | null; detour: RouteLine | null;
  closures: { id: string; title: string; kindLabel: string; endsAt: string }[];
  provider: string; checkedAt: string;
};

const isRouteLine = (v: unknown): v is RouteLine => isRecord(v) && Number.isFinite(v.distanceM) && Number.isFinite(v.durationS)
  && Array.isArray(v.coordinates) && v.coordinates.length >= 2 && v.coordinates.every(isLonLat);

/** Checks POST /api/v2/route's answer; throws the laptop's own error text when there is one. */
export function parseRouteAnswer(body: unknown): WayHomeAnswer {
  if (!isRecord(body)) throw new Error('The laptop sent no route.');
  if (!['clear', 'affected', 'blocked', 'no_route'].includes(String(body.status))) throw new Error(typeof body.error === 'string' ? body.error : 'Routes are not available right now.');
  const line = (v: unknown) => (isRouteLine(v) ? { distanceM: v.distanceM, durationS: v.durationS, coordinates: v.coordinates.map(([a, b]) => [a, b] as LonLat) } : null);
  const closures = Array.isArray(body.closures) ? body.closures.flatMap(c => isRecord(c) && typeof c.id === 'string'
    ? [{ id: c.id, title: String(c.title ?? 'A road'), kindLabel: String(c.kindLabel ?? 'Closed to cars'), endsAt: String(c.endsAt ?? '') }] : []) : [];
  return { status: body.status as WayHomeAnswer['status'], usual: line(body.usual), detour: line(body.detour), closures,
    provider: String(body.provider ?? ''), checkedAt: String(body.checkedAt ?? '') };
}

export const minutes = (seconds: number) => Math.max(1, Math.round(seconds / 60));
export const km = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
export function extraTime(usualS: number, detourS: number): string {
  const extra = Math.round(Math.max(0, detourS - usualS) / 60);
  return extra === 0 ? 'about the same time' : `+${extra} min`;
}

/** The card's headline and detail line, word for word as on the website. */
export function wayHomeText(answer: Pick<WayHomeAnswer, 'status' | 'usual' | 'detour' | 'closures'>): { title: string; detail: string } {
  const first = answer.closures[0];
  const closed = first ? `${first.title} is ${first.kindLabel === 'One lane only' ? 'down to one lane' : 'closed'}${answer.closures.length > 1 ? ` (and ${answer.closures.length - 1} more)` : ''}` : '';
  if (answer.status === 'no_route') return { title: 'No route found', detail: 'The route service could not find a way between these points.' };
  if (answer.status === 'clear') return { title: 'Your way home is clear', detail: answer.usual ? `${minutes(answer.usual.durationS)} min, ${km(answer.usual.distanceM)}` : '' };
  if (answer.status === 'blocked') return { title: 'No way home found around the closure', detail: `${closed}. Try again later.` };
  const extra = answer.detour && answer.usual ? extraTime(answer.usual.durationS, answer.detour.durationS) : '';
  return { title: 'Your way home is affected', detail: `${closed}. Detour ${answer.detour ? `${minutes(answer.detour.durationS)} min (${extra})` : ''}` };
}

/** Changes whenever a closure starts, ends or is extended, so the way home is checked again. */
export const closuresKey = (closures: readonly Pick<PublicClosure, 'id' | 'endsAt'>[]) => closures.map(c => `${c.id}@${c.endsAt}`).sort().join('|');
