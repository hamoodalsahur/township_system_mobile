# M5 groundwork — resident report feed regression checks

This draft adds tests around the existing public `GET /api/v2/hazards` client. No mobile screen or backend behavior has been changed.

The tests assert that only a trusted private development PC URL is accepted, that refreshing makes a fresh request with `cache: 'no-store'`, that an empty list is valid, and that offline / server / malformed-response cases fail without showing invented or stale report results. The tests use mock HTTP responses and never contact the real development website or its SQLite database.

Run from the **mobile VS Code** project:

```powershell
npx tsc --noEmit
node --experimental-strip-types --test tests/public-reports.test.mjs
```

CI runs both commands. This is independent of pending M3 PRs and M4 development.

## Physical iPhone acceptance still needed

After review, test Reports and Map in both Mock Demo and Local Backend. In the latter, confirm a fictional report appears after submission and refresh, try the PC offline to see the connection error rather than an old list, and check that the public data still excludes unapproved photos. No new permissions, road imports, or database changes are required.

Passing these unit checks is not permission to merge without the owner's iPhone acceptance.
