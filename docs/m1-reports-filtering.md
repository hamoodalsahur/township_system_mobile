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

## Quick category navigation (added for integration phase)

The Reports screen now has one-tap category chips for **All categories, Flooding, Fallen Tree, Pothole, Roadworks, Road Obstruction, Storm Damage, and Other**. These map to the existing submission category vocabulary; neither the backend schema nor any existing incident data is changed. Category selection combines with full-text search and review-status filtering. Mock examples such as `Fallen Tree` and backend codes such as `fallen_tree` normalize to the same filter.

### Additional iPhone checks
- In Mock Demo, tap Fallen Tree, Pothole and Flooding; verify their matching demo examples appear.
- Combine Fallen Tree with Human reviewed; confirm DEMO-002 remains. Combine Pothole with Human reviewed; confirm a friendly no-matches state appears.
- In Local Backend, tap each category and confirm only fictional reports in that category are displayed, while free-text search still works.
- Tap All categories to remove the category filter; confirm other report types return.

Keep all PRs draft until an on-device integration test confirms behavior.
