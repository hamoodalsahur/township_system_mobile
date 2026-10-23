# M4 groundwork — private fictional sample photo workflow (not yet implemented)

The management backend supports a second **development-only** request: `POST /api/v2/hazards/:id/evidence`, after the fictional report itself has been created. It accepts JSON with `mimeType` as `image/jpeg` or `image/png` and `base64Data` containing actual image bytes. The decoded image must be at most **200,000 bytes** (not 200 KiB); the total JSON request must stay below **320,000 bytes**. The uploaded evidence is initially `private_unreviewed`; only an operator on the separate management website may approve it for a public demo.

The next isolated implementation must:
- Add Expo SDK **57-compatible** `expo-image-picker` and `expo-image-manipulator` dependencies using `npx expo install`, and update `package-lock.json` using npm on a connected development PC.
- Avoid arbitrary photos of real incidents or faces. Choose fictional sample images and remove metadata where possible by creating a new resized/compressed JPEG.
- Compress repeatedly to under 200,000 bytes *before* generating base64. Validate byte count, MIME and payload length locally and let the server independently validate again.
- Make report creation and evidence attachment **two separate calls** with clear partial success messaging. Do **not** resend a report automatically when image attachment fails: first verify the created report's ID. Don't silently display a private upload on public map or Reports screens.
- On a timeout, explicitly warn that the first or second request may have succeeded. Avoid silently resending duplicate data.
- Keep operator access credentials, private image retrieval and publication controls outside the resident app.

**This document is a contract and test plan, not a claim that M4 photo upload is available.** It requires iPhone testing, privacy review and the human approval workflow before being described as complete.
