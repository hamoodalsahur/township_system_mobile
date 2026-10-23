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

You will need Node.js, npm, Expo Go on a compatible phone and the [main backend](https://github.com/hamoodalsahur/township_road_hazard_system) running locally.

1. Clone both repositories into separate folders.
2. Follow the [main repository setup](https://github.com/hamoodalsahur/township_road_hazard_system#quick-start--website-and-backend) and start `npm run dev`; management is at `http://localhost:3000/management` on the PC.
3. From this mobile repository run:

   ```powershell
   npm ci
   npx expo start
   ```

4. Open the Expo development session on your iPhone using Expo Go.
5. Connect your phone and computer to the same trusted Wi-Fi.
6. In the mobile app, open **About → Local Backend**, enter `http://<PC-WIFI-IPv4>:3000` and check the connection. Find the computer's Wi-Fi IPv4 address with `ipconfig` on Windows; **do not use `localhost` on the phone**.
7. View the **Reports** screen or submit a fictional test incident to verify connectivity.

**Do not** overwrite, reseed, or reset existing local SQLite data or road GeoJSON just to run the demo. The mobile repository does not contain the PC's private database or operator credentials.

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
