# Operations and recovery

## Run locally

Use Node.js 22.13+ within 22.x, or 24+. Install with npm ci, build and npm start. The service binds to loopback at http://127.0.0.1:8766. PORT changes the port; REEFSIM_DB changes the SQLite path (default repository/data/reefsim.sqlite). Prefer an absolute database path.

```powershell
$env:PORT = '8766'
$env:REEFSIM_DB = Join-Path (Get-Location) 'data\reefsim.sqlite'
npm start
```

The parent directory is created automatically. SQLite uses WAL and a collections table with identity, revision and JSON payload. OmniRoute is separate global tooling, not required here.

## Recovery context

SQLite holds acknowledged snapshots; the browser can hold newer pending/recovery copies. The HttpOnly reefSimIdentity cookie selects a collection. A database backup cannot recreate a lost cookie or provide account recovery. Preserve the browser profile through private browser/OS backups.

Keep the same browser/hostname. localhost and 127.0.0.1 are different origins; port changes also change localStorage scope. Do not clear site data as the first troubleshooting step.

## Offline backup

1. Wait for acknowledged database-save status. For local-only/error/pending status, preserve browser data and resolve saving first.
2. Close all app tabs and stop Node with Ctrl+C.
3. Copy the database plus any matching -wal/-shm files that remain into a private backup directory. Keep the family to preserve uncheckpointed WAL content.
4. Record commit/date/database path/browser-profile context without publishing cookies. Keep backups outside Git.

```powershell
$backupDirectory = Join-Path $env:USERPROFILE 'ReefSimBackups\manual-backup'
New-Item -ItemType Directory -Path $backupDirectory -Force
Get-ChildItem -LiteralPath '.\data' -Filter 'reefsim.sqlite*' |
    Copy-Item -Destination $backupDirectory
```

Only use this copy after stopping writes. Copying the main file alone during active writes is not a reliable online backup. Use a SQLite-aware backup mechanism online and verify the resulting database.

## Restore without overwriting current data

1. Close tabs/stop the service. Back up current SQLite and preserve browser recovery data first.
2. Copy the backup family to a separate recovery directory with matching base filenames.
3. Set REEFSIM_DB to the recovered main file and start; retain the original database for rollback.
4. Use the original browser identity cookie. Pending local snapshots may reconcile into the restored database; opening an old backup does not automatically replace newer local data.
5. To make the database backup authoritative, preserve current browser data, remove only the ReefSim profile/pending/migration localStorage keys through browser storage tools, retain the cookie, then reopen.
6. Verify profile names, active tank, progress, budget and decor sizes before resuming/editing.

Keys: reefSimProfiles, reefSimActiveProfile, reefSimPendingSync and reefSimMigrated. Removing them discards recovery copies, so preserve those first. No account-recovery or collection-transfer UI exists for lost cookies. Direct database editing is not a supported routine recovery workflow.

## Conflicts, upgrades and deployment

Writes carry expected revisions. Another tab can advance a revision and cause stale-write rejection. Reload and inspect backup profiles; avoid concurrent edits to the same collection. Failed writes retain local pending data: do not delete localStorage in response. Check service, path/permissions and origin. See [API contract](../server/openapi.yaml) and [security](../SECURITY.md).

Back up before upgrades. Stop the service, npm ci using the reviewed lockfile, rebuild, run checks and restart with the intended database. Review state/schema changes before reusing old data. Tables initialize automatically; no general migration CLI exists.

Static hosting has no SQLite and saves locally only. Publish browser assets, never .git, dependencies, runtime data, backups or environment files. Public multi-user hosting needs separate authentication/authorization, HTTPS, session/quota/concurrency, monitoring and recovery design. Do not expose this loopback service through an unrestricted public proxy.

Consult the dated [verification report](../SMOKE_TEST_REPORT.md). Keep test databases, cookies and personal tanks out of published commits.
