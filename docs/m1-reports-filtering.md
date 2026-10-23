# Browse fictional resident reports more comfortably

Search by description, category, impact or report reference, and use three simple filters: all, awaiting review and human-reviewed. Both Mock Demo and Local Backend use the same controls. A clear count shows how many records match.

This is an independent feature branch based on approved M3 Batch 2. It does not depend on the pending road-overlay or map location-selection PRs.

## iPhone checks
- Open Reports in Mock Demo and search for `pothole` and `MOCK` / `DEMO`; verify visible records change without network requests.
- Tap **Human reviewed** and confirm only the fictional corroborated report appears; tap **Awaiting review** to see uncorroborated examples.
- Clear search and switch modes. In Local Backend, the same filters should apply to current fictional backend reports.
- Disconnect the backend: you should see a connection error and **Retry loading**, not stale records.
- Confirm tapping a report expands and collapses its description; reopening Reports does not trigger operator actions.
- Run `npx tsc --noEmit` and confirm no red Expo Go screen.

All review labels describe the human workflow in the fictional demonstration, not actual road conditions.
