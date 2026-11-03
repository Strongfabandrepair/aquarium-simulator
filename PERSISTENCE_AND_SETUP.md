# Durable profiles, item sizing and local setup

## Start ReefSim

Use Node.js 22.13 or newer (verified with Node 26.4). Run `npm install`, `npm run build`, then `npm start`. Open **http://127.0.0.1:8766**. The Node server serves the app and stores profile snapshots in SQLite using Node's built-in SQLite support; no external database service is required.

The default database is `data/reefsim.sqlite`. Set `REEFSIM_DB` to an absolute path to keep it elsewhere, and `PORT` to change the listening port. Runtime databases and their WAL/SHM files are ignored by Git. To back up safely, stop the server and copy the database; do not copy only the main database while writes are active. For an online backup use a SQLite-aware backup mechanism.

## Saving and restoring

An HttpOnly, SameSite=Strict cookie identifies each browser's collection of named profiles. Existing localStorage profiles migrate on first connection. SQLite stores acknowledged snapshots; localStorage retains a durable pending-write marker and recovery copy until the latest save is acknowledged. Immediate reloads reconcile pending changes before resuming the active profile. The UI distinguishes successful database saves from local-only saves and errors. Optimistic revisions reject stale writes, and conflicting snapshots are preserved as backup profiles rather than silently discarded.

Closing and reopening the app or restarting the server retains saved profiles. Clearing localStorage alone restores profiles from SQLite when the identity cookie remains. Clearing cookies, changing browsers or using another browser profile creates a new identity: this version does not provide accounts or cross-device synchronization. Preserve the browser identity as well as the database when planning recovery.

The service binds to loopback and is intended for local use. The API contract is in `server/openapi.yaml`. Snapshot validation, revision conflicts, origin checks, private-file protection, browser isolation and restart durability are covered by the API smoke test. Static hosting remains supported with local-only saves.

## Resize individual rocks and decorations

Select a purchased rock or decoration in the Aquascape editor and use the **size slider**. The preview shows percent and physical centimeters. Click a valid surface or **Save placement** to commit. Changes are not saved while previewing; cancel restores the existing placement.

Sizing is relative to the item's immutable original size, so repeated edits do not compound. The supported range is 25–200%, additionally bounded to 2.5–50 cm. Wall, water, overlap and supporting-surface checks reject invalid changes. A rock supporting other items remains protected. Corals use biological growth instead of this decor control. Saved item sizes survive reload.

## OmniRoute is separate from ReefSim

OmniRoute is no longer a project dependency. The existing global installation on this Windows machine is version 3.8.50 under `C:\Users\silo1\AppData\Roaming\npm`; its CLI and service health were verified. Use `omniroute serve --no-open`, `omniroute health`, and `omniroute stop` independently of ReefSim.

The project-local 3.8.49 installation was removed after preserving its `.env` and data/cache directory at `C:\Users\silo1\AppData\Roaming\omniroute-backups\aquarium-project-2026-11-03`. Existing global/user configuration was retained. Those private files are outside the repository. Vendored `node_modules` files are now untracked; install dependencies from the lockfile on a new checkout.

## Verification

Run `npm run build`, `npm run lint`, `npm test`, `npm run test:api`, and `npm run test:ui -- --workers=2`. The browser suite starts the Node server automatically. See `SMOKE_TEST_REPORT.md` for the latest integrated counts and results.
