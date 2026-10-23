# Township Road & Hazard Intelligence — Resident Mobile

**Academic FYP prototype | Expo / React Native | Fictional reports only**

This iPhone-focused companion app works with the separate **Township management website** (Next.js backend). It displays unverified Bandar Bukit Raja (BBR) reference roads and fictional incident reports. **It is not a live emergency warning service, official road-status source, route planner, or safety navigation tool.**

## Repositories and development directories

- **Mobile app:** `hamoodalsahur/township_system_mobile` (typically `C:\Users\ahmad\Desktop\township_system_mobile`).
- **Website/backend/management:** `hamoodalsahur/township_flood_system` (typically `C:\Users\ahmad\township_flood_system`).
- Develop and run them in **two separate VS Code windows**. Run the backend on port **3000** and Expo on its normal Metro port.

This README describes the tested development feature branch `feature/m4-map-incident-first`. The mobile branch includes earlier stacked features, some of which are not yet on `main`. Check the branch before assuming a fresh `main` checkout contains the same UI.

## Getting started

1. Start the **website/backend** first in its directory:

   ```powershell
   npm run dev
   ```

   On the PC, open `http://localhost:3000/management` to verify the operator website. The existing local `.env` and SQLite database are managed separately; **do not reset, reseed, migrate, or overwrite them for a teammate demo**.

2. In the **mobile** directory, install dependencies on a new machine from the project lockfile and start Expo:

   ```powershell
   npm ci
   npx expo start
   ```

   If dependencies are already installed and the project runs, only `npx expo start` is needed. On iPhone, open the Expo Go development session.

3. Connect the iPhone and PC to the same trusted private Wi-Fi network.

4. In the mobile app's **About** tab, choose **Local Backend**, enter `http://<PC-WIFI-IPv4>:3000` and check the connection. For example, `http://192.168.1.23:3000` (illustration only; use your actual adapter address). On Windows, `ipconfig` shows the PC's Wi-Fi IPv4. Do **not** enter `localhost` or blindly copy a virtual adapter address such as `192.168.56.1` on the iPhone.

5. Open **Reports** and refresh. Existing fictional records should appear when backend connectivity works.

## App workflow

1. **Map:** browse the BBR road reference and fictional hazard markers, tap an incident to inspect details, or expand the optional reporting controls.
2. **Submit:** choose a fictional location/category, write a clearly labelled demonstration report, and optionally attach a harmless, non-identifying camera/library image. The app re-encodes its sample image and applies the backend's **200 kB** size limit.
3. **Reports:** browse submitted fictional records and approved demonstration photos when available.
4. **Management website:** an operator separately reviews submissions and may approve/reject each report with an explanation. An attached photo does **not** become visible to residents simply because the report was approved. Photo publication requires a separate affirmative operator checkbox.

The mobile app never receives the private management operator key. The local backend must enforce permissions; the mobile UI alone is not a security boundary.

## Release acceptance checklist

- Confirm PC management and iPhone app both connect without changing the original SQLite database.
- Submit **FYP TEST A**, a fictional report with a safe sample photo; verify it reaches Management → Incidents and automatically appears in the authenticated operator's photo preview.
- Approve A **without** selecting the resident-photo checkbox; confirm the resident app does **not** display its private photo.
- Submit **FYP TEST B** with a non-identifying image; separately approve showing it in the resident app; verify it appears in Map/Reports.
- Submit **FYP TEST C** as a fictional sample and reject it; confirm it is not presented as an approved incident.
- Confirm the website's default management map shows submitted non-rejected records only; the four built-in scenario pins are optional and toggled off by default.
- Run the existing mobile GitHub Actions checks and website test/typecheck/build workflow after any final PR changes.
- Review the release commit/PR dependencies and **obtain explicit approval before merging**.

## Troubleshooting

- **Expo runs but no reports show:** check the website backend is running; use **About → Local Backend** to set the real PC Wi-Fi IPv4, and verify devices share a trusted LAN.
- **Port conflict:** stop an older `npm run dev` process instead of starting a competing website instance.
- **Photo not visible to residents:** it may be intentionally private. Only a separately approved fictional image should display publicly.
- **Timeout or uncertain submission:** check Reports/Management before retrying to prevent duplicate fictional reports.
- **Local map asset seems missing:** preserve any existing local road data, review `scripts/prepare-bbr-roads.mjs`, and do not run imports or destructive cleanup casually.
- **Working tree not clean:** inspect `git status --short` before switching branches. Never force checkout or delete untracked local files without first preserving them.

## Privacy, accuracy, and scope

Use only invented incidents and non-identifying sample images. Do not collect actual emergencies, real-world road closure claims, personal information, or operational imagery. This is a local academic demonstration; the road geometry is unverified reference data. Operator access in the website remains a local-development mechanism, **not production authentication**.

## Related docs

- `docs/m4-incident-first-map.md`
- `docs/m4-photo-flow.md`
- `docs/m3-blue-road-overlays.md`
- Website branch: `docs/management-final-ui-acceptance.md`
