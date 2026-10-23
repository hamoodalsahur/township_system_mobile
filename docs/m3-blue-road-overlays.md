# M3 Batch 3 — Blue BBR road overlays, without altering the website

The native map can render nearby imported OSM reference ways in the same blue category hierarchy as the management website. The source GeoJSON remains on the owner's Windows PC, not GitHub: the tracked mobile module is intentionally empty rather than fabricated.

## Build the local-only geometry module

Use a **mobile-project VS Code terminal**, with the original website project open separately. Run:

```powershell
node scripts/prepare-bbr-roads.mjs "C:\Users\ahmad\Desktop\township_flood_system\public\data\bbr-roads.geojson"
npx tsc --noEmit
```

If the website folder lives somewhere else, substitute the correct absolute path. This tool **reads** the source GeoJSON and writes only `src/data/bbr-roads.generated.ts` inside the mobile repo. It does not touch SQLite, network databases, schema, the website server, .env or the source GeoJSON. There is no import/reseed step.

The simplified output preserves OSM way IDs, blue road categories, the exact unsimplified spatial bounds and the first/last geometry vertices. Small bends may be simplified for iPhone rendering, so these are not surveyed or navigation-grade geometries. The mobile module includes OpenStreetMap attribution and links to the ODbL notice.

## iPhone acceptance

- Open Map with Mock Demo and Local Backend, verify the same fictional markers and details still work.
- Move around the map and confirm the overlay renders a bounded maximum of 180 nearby roads and remains responsive while dragging, zooming, tapping markers and refreshing reports.
- Toggle **Hide blue roads** / **Show blue roads**. Only the additional blue overlay should change.
- Look for major `#2563eb`, local `#60a5fa`, service `#93c5fd` and other `#bfdbfe` line styling. The underlying Apple Maps tiles retain their own built-in colours.
- If the conversion script has not been run, a truthful missing-data message appears and the map stays usable. Never display generated or guessed road geometries in its place.
- If performance is poor with 180 nearby polylines, reduce `limit` in `visibleRoads` and rerun; do not overwrite the original road file.

Run `node --test tests/*.test.mjs` and `npx tsc --noEmit`. A review of the actual generated dataset and iPhone performance is required before merging this PR.
