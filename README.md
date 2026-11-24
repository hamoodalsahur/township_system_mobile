# Township Road & Hazard Intelligence — Resident Mobile

**Sime Darby Property University Hackathon · Expo / React Native · Companion application**

This mobile app is part of the [Township Road & Hazard Intelligence System](https://github.com/hamoodalsahur/township_road_hazard_system). Residents can explore unverified BBR reference roads, see fictional hazard markers, submit a fictional incident with an optional non-identifying sample photo and inspect report outcomes.

> **Fictional hackathon demonstration only.** Not an emergency warning system, a verified road-closure service or a safe navigation tool.

## Related repositories and demo

| Component | Link |
| --- | --- |
| **Main website + backend + management** | [township_road_hazard_system](https://github.com/hamoodalsahur/township_road_hazard_system) |
| **Mobile app source** | **This repository** |
| **Public browser-only judge demo** | [Open demo](https://hamoodalsahur.github.io/township_road_hazard_system/) |

The public GitHub Pages demo runs independently. It does **not** share a live database with the Expo app.

## Local setup

You need Node.js, npm, Expo Go on your iPhone, and the [Laluan website](https://github.com/hamoodalsahur/township_road_hazard_system) running on your laptop (`npm run dev`).

1. From this repository run:

   ```powershell
   npm ci
   npx expo start
   ```

2. Scan the QR code with the iPhone camera to open the app in Expo Go.
3. Put the phone and the laptop on the same Wi-Fi.
4. In the app, open **Settings**, type `http://<laptop Wi-Fi IPv4>:3000` and tap **Check and save**. Find it in PowerShell with `(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress`. Don't use the **Network** line that `npm run dev` prints: on Windows it can be a virtual adapter (like 192.168.112.1) the phone cannot reach. `localhost` does not work from the phone either. Campus Wi-Fi often blocks phone-to-laptop traffic; the iPhone's Personal Hotspot avoids that. The address is remembered on the phone after that.
5. Open **Map**: it shows the laptop's service area (whatever `SERVICE_AREA` is set to), its reports and any road closures, and refreshes every minute.

**Do not** reset or reseed the laptop's database or road files to run the app. The phone never needs the operator key.

## End-to-end demonstration

1. **Map:** your area's outline, its reports (solid = confirmed, ring = being checked) and any closed roads in red.
2. **Report:** tap **Report a problem** on the map, tap the spot, then follow the three steps (what, where, a few words and an optional photo).
3. **Management website:** approve the report and close the road (the Close roads window opens right after approving a "Possibly closed" report).
4. **Phone:** the closure appears on the Map within a minute; **My reports** shows Confirmed, then Resolved after **Road cleared**.
5. **Way home:** on the Map, tap **Set my home**, tap home, then tap where you usually set off from (like campus). The card says clear or affected and draws the detour around closures; it checks again whenever a closure starts or ends. Home and start are kept on the phone only.

## Demo acceptance checklist

- [ ] Phone connects to the laptop backend over trusted Wi-Fi.
- [ ] A fictional report from mobile appears in Management → Incidents.
- [ ] Operator can review the report without automatically publishing its attached photo.
- [ ] A separately approved sample photo is visible on the resident app.
- [ ] Rejected fictional reports do not appear as approved hazard markers.
- [ ] Public browser preview is presented as a **separate** simulation, not live backend integration.

## Troubleshooting

- **No reports:** confirm the PC backend is running on port `3000`, the Wi-Fi IPv4 address is correct, and both devices use the same trusted network.
- **Expo connection problems:** follow the normal Expo Go connection flow; a PC's `localhost` cannot be used as the phone's backend address.
- **Photo missing:** publication is intentionally separate from incident approval.
- **Road data missing:** the PC's original local road data and the public browser demo's bundled GeoJSON are not the same deployment location; do not overwrite either.
- **Uncertain submission:** inspect Reports and Management before retrying to avoid duplicates.

## Code and project notes

- Expo / React Native source is maintained here; the Next.js APIs and SQLite storage are maintained in the [website repository](https://github.com/hamoodalsahur/township_road_hazard_system).
- `docs/m4-incident-first-map.md` — map interaction design
- `docs/m4-photo-flow.md` — photo approval and visibility workflow
- `docs/m3-blue-road-overlays.md` — map styling notes

This is a **hackathon prototype**, not production software. Use only fictional reports and non-identifying example images.
