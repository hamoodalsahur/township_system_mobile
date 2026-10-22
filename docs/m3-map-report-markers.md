# Mobile M3 — Map markers from the same fictional reports as the Reports tab

The Map tab now follows the same Mock Demo / Local Backend setting available under About. Mock Demo uses three clearly invented marker locations. Local Backend fetches the existing public fictional reports API and plots coordinates only inside the research area.

## iPhone acceptance check

1. Keep the website server running on a trusted private LAN. You do not need to start it again if it is already up.
2. From the mobile repository, checkout `feature/m3-interactive-bbr-map` after confirming your working tree is clean. Run `npx tsc --noEmit` and `npx expo start -c`.
3. In **About → Mock Demo**, open Map. Pan/zoom, tap three made-up markers and view details.
4. In **About → Local Backend**, enter/test the PC address if required. Open Map and tap **Refresh map reports**; the plotted fictional reports should correspond to Reports, provided they contain valid coordinates in the research rectangle.
5. Add a *fictional* report via Submit in Local Backend; return to Map and refresh. Tap the added marker; category, suspected impact and review status should appear.
6. Disable Wi-Fi briefly or stop the PC backend; refresh Map. It should show an error with a retry option rather than stale markers. Reconnect and retry.
7. Verify Mock Demo works again offline, without requesting the phone's location.

Note: Review states are fictional human-workflow labels, not claims about actual public safety. The local GeoJSON file (1,269 road features, about 1.12 MB) is deliberately not copied, changed, reimported, or drawn yet. The next batch will benchmark the blue-road overlay separately.
