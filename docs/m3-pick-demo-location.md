# M3 Batch 4 — Choose a fictional report point by tapping the map

This PR builds **on top of** the blue-road-overlay PR #4. It is deliberately a separate draft PR for an independent iPhone acceptance test.

The map has a new **Choose point on map** control. While this selection mode is active, tapping the map selects a demonstration point inside the public submission API's research rectangle (latitudes 3.06–3.11, longitudes 101.40–101.47). The selected position appears as a purple pin. Residents can tap **Use in Submit** to open the fictional report form with that point preselected. Old preset points remain available.

No GPS/location permission is requested. A chosen point lives only in memory and is lost when the app restarts. This is **not** a legal boundary, a verified incident coordinate or navigation guidance.

## Acceptance on iPhone
1. Pull PR #4 and PR #5 through their stacked branches; run `npx tsc --noEmit`.
2. Open Map, tap Choose point on map; tap empty map space inside BBR. Confirm the purple pin and coordinates appear.
3. Tap **Use in Submit**. The form should show the map-selected point selected alongside the three example presets.
4. In Mock Demo, preview an invented report. Nothing should reach the backend.
5. In Local Backend, submit an invented report from the map-selected point and confirm its reference appears on the management website and the Reports and Map tabs after refresh.
6. Select a point far outside the allowed research rectangle; the app should refuse it.
7. Clear the point or choose a preset; verify submit still works without GPS.

The real local BBR road dataset still must be prepared on the owner's PC via `scripts/prepare-bbr-roads.mjs`. This branch does not generate it or touch the website.

## Submission confirmation and navigation

After the Local Backend confirms a fictional report was saved and returns a valid ID, Submit presents an **in-app confirmation dialog**. It shows the report reference and explains that management review is still pending.

- **View Reports** closes the dialog and navigates away from Submit to the Reports tab. Refresh the feed if necessary.
- **Submit another fictional report** dismisses the dialog and stays on the cleared form.
- Mock mode previews only; rejection, connectivity failure or an uncertain server response must never show the success dialog or navigate away automatically.
- Verify both choices, including that a single tap produces only one report, on the physical iPhone. The earlier native Alert has been replaced because it did not visibly display on the user's device.

No changes to the management website, private data, GeoJSON or permissions.
