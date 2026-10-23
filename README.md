# Township resident mobile prototype

A small Expo + React Native companion to the separate [township management website](https://github.com/hamoodalsahur/township_flood_system). The app explores **fictional Bandar Bukit Raja hazard-report scenarios** for a university research demonstration. It is **not an emergency reporting service, navigation tool, verified road-closure map or public safety information source**.

## Development environment

- **Repo:** `township_system_mobile` — separate from the website, its SQLite database, operator credentials and local BBR GeoJSON.
- **Expo SDK 57** / Expo Router / TypeScript; intended for Expo Go 57 on iPhone.
- **Map:** Apple Maps via `react-native-maps` with fictional markers.
- **Reports:** mock examples by default, or public fictional reports loaded from the development website backend.
- **Submit:** mock preview by default; Local Backend can submit fictional reports only when the website API is running in development mode.
- **About:** contains the Mock Demo / Local Backend selector and the PC connection test. Address/mode reset after app restart.

## Start on Windows

Open VS Code in this **mobile** repository and run:

```powershell
npm ci
npx tsc --noEmit
npx expo start -c
```

Scan the QR code with Expo Go on your iPhone. Keep the Windows PC and phone on your trusted private Wi-Fi. If the existing website backend is already running, leave it running; there is no reason to restart it. Otherwise start the separate website dev server according to that repo's instructions. In About, use the PC's private IPv4 address, for example `http://192.168.1.23:3000`. An iPhone's `localhost` does not point to the Windows PC.

**Do not tunnel the development write endpoints publicly.** The mobile app must never include or send `DEMO_OPERATOR_KEY`, access private evidence, or modify the website's local SQLite, `.env` or imported BBR road geometry.

## Progress & open feature branches

- M0: iPhone ↔ PC private LAN connectivity — complete.
- M1: four resident tabs, fictional report feed and connection settings — approved.
- M2: fictional mobile → management submission — approved.
- M3: native interactive map with fictional report markers — approved. Remaining: blue reference roads and map-selected report coordinates in **separate, unmerged PRs** requiring iPhone testing.
- M4: private fictional sample-photo workflow — planned, **not implemented**.
- M5: privacy, reliability, performance and repeatable FYP demonstration — ongoing.

### The local BBR road data

The actual BBR GeoJSON is held on the original website PC, not in this repository. The mobile map does **not** claim to contain or display that reference network until the owner runs the read-only preparation script described in `docs/m3-blue-road-overlays.md` on the road-overlay development branch. The only bundled road geometry on that branch is initially an **empty** placeholder. OpenStreetMap attribution is retained.

## Quality checks

```powershell
npx tsc --noEmit
```

The road overlay branch additionally includes `node --test tests/*.test.mjs` and automated checks. See [the iPhone test matrix](docs/mobile-acceptance-matrix.md) for the end-to-end FYP demonstration process.

### Prototype limitations

No account authentication or per-user private report identity is offered. Don't submit identifying personal data or actual emergencies. Human review of fictional report text is performed separately on the management website. The app neither decides that roads are blocked nor provides routing, live access, verified closures or emergency response.
