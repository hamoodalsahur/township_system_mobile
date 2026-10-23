# M4 batch 1 — private evidence transport, not yet a photo picker

This draft branch adds `src/lib/private-evidence.ts`, a reusable, deliberately narrow client for the existing **development-only** evidence endpoint. It does **not** add an image picker, media library permission, or a new button to Submit; the iPhone photo workflow is still pending. It is independent of PRs #4–#7.

## Contract confirmed against the website backend

1. First create a **fictional** report using `POST /api/v2/hazards`, and keep the returned report ID.
2. **Only if that report was confirmed saved**, prepare a fictional JPEG/PNG sample photo. Before calling the transport helper, use SDK-compatible picker/manipulator modules to make a new small encoded image with metadata removed. Do not reuse the original image bytes or attach real incident/identifying photographs.
3. Call `uploadPrivateEvidence(baseUrl, reportId, { mimeType: 'image/jpeg', base64Data })` exactly once. The helper refuses non-private-LAN URLs, IDs containing path characters, noncanonical base64, mismatched JPEG/PNG signatures, and decoded payloads over **200,000 bytes**. JSON remains below **320,000 bytes**.
4. The backend separately validates the same constraints and initially stores `private_unreviewed` evidence. No photo is made public automatically. Only the separate website operator can approve publication.
5. A result of `uploaded` means the server confirmed `201 {saved:true}`. A `rejected` result requires correction or management review. An `uncertain` result means **check the management website** before any retry: the request may have arrived. The helper never auto-retries or resends the original report.

## Automated contract tests

On Node.js 22, run from the **mobile project** terminal:

```powershell
npx tsc --noEmit
node --experimental-strip-types --test tests/private-evidence.test.mjs
```

Tests mock network requests: they do not write to the management database, and their tiny image-header fixtures are **not** representative photos. The test cases cover private IP restrictions, matching MIME signatures, precise byte limits, unsafe references, one-request behavior, conflict responses, and uncertain delivery.

## Required follow-up before any iPhone acceptance

- On the mobile project, install `expo-image-picker` and `expo-image-manipulator` using **`npx expo install` with Expo SDK 57**, update the lockfile, and check the versioned Expo docs before integrating their APIs.
- Implement an explicit opt-in gallery selector limited to fictional samples. Re-encode a new image without metadata, progressively compress/rescale until the actual decoded byte count is safely below 200,000, or decline it.
- Integrate with Submit after a confirmed report ID; preserve the selected sample only temporarily, prevent double taps, and show independent results for report saving and evidence attachment.
- Test rejection, no-connectivity, cancellation, storage, privacy, operator approval and public-display behavior on a **physical iPhone**. Keep mock mode network-free.
- Do not include `DEMO_OPERATOR_KEY` in the resident app, fetch private evidence into the resident app, or modify the original website's SQLite, GeoJSON or `.env`.

This batch establishes a safe transport contract and CI tests; it does **not** claim M4 is finished or approved for merge.
