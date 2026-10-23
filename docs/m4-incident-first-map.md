# Incident-first Map layout (fictional resident demo)

## User experience
The Map tab now prioritizes viewing existing fictional incident reports. A compact **Report an Incident** button is collapsed by default. Opening it reveals the existing choose-point-on-map workflow and **Use in Submit** link, without GPS or changes to the backend.

Immediately under the map, a compact overlay toggle preserves the imported 1,269 OSM reference features without consuming an entire large card.

The Incident information section shows a current fictional report, including category, description, suspected impact, human review status, reference, demo coordinates, optional submission date, and **only a separately management-approved** public photo. Other reports are browsable below; selecting a marker or report brings the details into view. The first/latest report is selected by default.

Private or unapproved photos are never requested or displayed. Even a human-reviewed fictional report is not a verified real-world closure or safe-route claim. No changes to permission handling, original GeoJSON or management data.

## Physical iPhone tests
1. Open Map: incident details visible and **Report an Incident** collapsed.
2. Tap multiple incident pins and report cards: correct category, description, status, and reference appear.
3. In Local Backend, select a report with an approved sample photo: its photo displays.
4. Select a report without approved photo: no private photo is fetched or displayed.
5. Expand Report an Incident; select an illustrative map point and use it in Submit. Return to Map; collapse panel and make sure regular map selection still works.
6. Confirm blue reference roads and Hide/Show toggle work after local converter generation.
7. Disconnect the backend: error shown; no stale live data appears. Mock Demo still works offline.
8. Run `npx tsc --noEmit` and Expo Go. Do not merge until tested.

Only fictional reports are supported. The report feed and approved-image endpoints already exist in the management project.
