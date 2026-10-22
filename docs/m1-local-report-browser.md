# Resident mobile M1 — A clear choice of sample or PC data

The resident app now offers a **Mock Demo / Local Backend** choice under About. Mock Demo is always the default and never sends submissions to the PC. Local Backend only fetches the existing public fictional report feed; Submit remains a non-saving preview. The app does not request or store the management operator key, private images or database contents.

## Try on an iPhone

1. In the existing **web repo**, use `npm run dev -- -H 0.0.0.0` on your trusted private network. Do not run `db:push`, `db:seed`, or import/reset the owner's geographic data.
2. In the **mobile repo**, run `npm install`, `npx tsc --noEmit`, then `npx expo start -c`.
3. Open About; enter the Windows PC LAN address `http://<your-PC-IP>:3000` and tap **Test connection**. A valid response shows a report count, including zero.
4. Switch to **Local Backend**, open Reports, check its fictional records, and use **Refresh reports**. Disconnect Wi-Fi briefly: expect an error and **Retry loading**; no stale list is presented as current.
5. Switch back to **Mock Demo** and confirm the original three sample report cards work while offline.
6. Verify **Submit** still explains that nothing was saved; the actual resident-to-management submission workflow is planned for M2.

Connection mode and LAN URL are deliberately **in-memory only** in this first batch: an app restart resets them. The map stays a placeholder until M3. No UI should imply real observations or navigation safety.
