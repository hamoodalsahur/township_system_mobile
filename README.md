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
4. In the app, open **Settings**, type `http://<laptop Wi-Fi IPv4>:3000` and tap **Check and save**. Find the address with `ipconfig` on Windows; `localhost` does not work from the phone. The address is remembered on the phone after that.
5. Open **Map**: it shows the laptop's service area (whatever `SERVICE_AREA` is set to), its reports and any road closures, and refreshes every minute.

**Do not** reset or reseed the laptop's database or road files to run the app. The phone never needs the operator key.

## End-to-end demonstration

1. **Map:** inspect BBR reference roads and fictional incident markers.
2. **Submit:** pick a fictional incident location and category; optionally attach a non-identifying sample photo.
3. **Management website:** review and approve/reject the demo report. Operators separately decide whether a sample image may appear to residents; approving a report alone does not publish its attached photo.
4. **Mobile Reports / Map:** refresh to see the updated report state and any separately approved sample photo.

The mobile app never needs the management operator key. That key stays with the local website/backend development setup.

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
