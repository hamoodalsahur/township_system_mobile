# M2 — Try a fictional resident submission from the phone

The first genuine mobile-to-management interaction is available **only in Local Backend mode**. Mock Demo remains non-saving, and the Map tab is still a placeholder until M3.

## What to try on an actual iPhone
1. In the website repo, run `npm run dev -- -H 0.0.0.0` over a trusted private local network. Preserve existing SQLite, edited BBR GeoJSON, and .env. Never run db:push, seeding, geo imports or resets.
2. In the mobile repo, check a clean Git working tree, checkout the M2 test branch, run `npx tsc --noEmit` and `npx expo start -c`.
3. Confirm About → Mock Demo. Open Submit, choose any made-up category and describe an imaginary issue, tap Preview. Verify **nothing is stored** or sent to management.
4. Set the private PC address under About, test connectivity, choose Local Backend. Open Submit, enter fictional data, select a preset **illustrative** map point, and tap Send once. You should receive a report reference ID.
5. Open website `/management/incidents`, sign in using the key **only in the website**, and confirm the submitted report is **unverified**. No road status should change.
6. On mobile Reports, refresh and verify the new record appears. If the operator manually corroborates it, refresh to see the updated state. Do not expose any operator credentials on mobile.
7. Test an invalid description; ensure it does not send. Disconnect the network before submitting and check the app gives a cautious outcome (the user should check Reports before retrying). Duplicate submits are blocked while a request is in flight.

## Known limits
The app has no resident account or ownership model, GPS/location services, photo uploads, live safety status, or server-side idempotency. A submission that times out may still have reached the server; **never blindly resubmit**. The first M2 pass has only three preset invented points within the backend research rectangle. This is a university demonstration, not an emergency reporting tool.
