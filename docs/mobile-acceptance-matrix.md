# Mobile acceptance matrix — iPhone and FYP demo

**Purpose:** record actual device results separately from GitHub CI. Green TypeScript checks do not establish that an iPhone feature works smoothly.

| Area | Manual acceptance | Pass / issue |
| --- | --- | --- |
| Launch | Expo Go SDK 57 opens without red errors; four navigation tabs remain available | Not yet recorded here |
| Mock | Start app without backend; three fictional examples appear; Preview submission doesn't save | Not yet recorded here |
| LAN | About correctly rejects non-private/public backend URLs; PC's trusted LAN connection test works | Not yet recorded here |
| Reports | Local backend loads fictional feed, handles zero reports, displays loading and Retry on disconnect | Not yet recorded here |
| M2 submit | Invented report goes from iPhone into existing management queue with unverified status | Not yet recorded here |
| Human review | Management reviews a fictional record; Reports/Map reflect the updated review state after refresh | Not yet recorded here |
| Map basics | Pinch and pan on iPhone; press mock and backend markers; no GPS permission requested | Not yet recorded here |
| M3 roads | Local GeoJSON prepared read-only; major/local/service/other blue overlays render; toggling works | Requires PR #4 and local data |
| M3 position | Tap map to select fictional location; Submit uses it; out-of-bounds taps refused | Requires PR #5 |
| Offline recovery | Turn off PC backend; no stale feed or map markers presented as current; reconnect and retry | Not yet recorded here |
| Data privacy | Operator key, private evidence, SQLite, and .env never enter mobile bundle or GitHub | Not yet recorded here |
| Performance | Compare road counts, map pan/zoom speed and marker tap response on iPhone with overlay on/off | Requires local data |
| Evidence M4 | JPEG/PNG ≤200 KB after optimization; attach privately; operator approval precedes public display | Not implemented |
| Demo M5 | Repeat complete scripted demonstration on final branch with all manual tests and GitHub CI passing | Not yet recorded here |

## Safe testing

Use **invented descriptions and demonstration locations only**. Never present these scenarios as observed hazards, traffic conditions or official road closures. Do not reset the management SQLite database, reseed data or regenerate the owner's imported BBR source files.

## Final presentation flow

1. Open the iPhone app in Mock Demo. Show Map and Reports working offline.
2. Select Local Backend in About; test PC connection.
3. Submit a fictional issue, noting the returned report reference ID.
4. On the management website, find the same reference and show it starts unverified.
5. Complete a *manual* fictional review on the management site.
6. Refresh the iPhone Reports and Map tabs to show the review status changed.
7. Display blue BBR geographic reference ways if the local geometry module has been prepared. Explain these are not live road conditions.
8. Explain limitations and privacy controls: no automatic closure, operator keys stay on web, photo evidence requires separate approval.

## Recording results

For each PR, record: iPhone model/iOS version, Expo Go SDK version, date, PASS/FAIL per scenario, a brief error description if applicable, and the associated GitHub CI link. **Do not merge an untested feature solely because CI passed.**
