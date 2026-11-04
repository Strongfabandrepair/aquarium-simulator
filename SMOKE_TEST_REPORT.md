November 4, 2026: [Security policy](SECURITY.md) and the [documentation index](docs/README.md) describe the current release. Earlier entries below describe previous versions.

## Security remediation and documentation — November 4, 2026

The final frozen source passed **126 unit tests across 20 files, one real-server API/restart scenario, all 36 Chromium scenarios, build and lint**. The browser report has zero failures, skipped cases or flaky cases. A fresh full `npm run audit` including development dependencies reports **zero known vulnerabilities**, down from 11 (4 high, 7 moderate).

Compatible patch updates repaired Vitest/mocker, Vite, source-map-js and brace-expansion advisories. ESLint moved to 10.14.0 with explicit @eslint/js 10.0.1 and a targeted minimatch override at ^11.0.1 (resolved 11.0.4). This avoids npm's suggested breaking downgrade to ESLint 4. The modern minimatch API is exercised by the passing application lint run. Keep the override until upstream ESLint/config-array dependency ranges accept a patched version, then reassess it. Vitest is 4.1.12 and Vite resolves to 8.3.5.

Source review fixed stored HTML injection through journal/livestock fields, bounded saved numeric style values, and removed dangerous prototype keys before merging legacy saves. The API rejects dangerous keys and excessive nesting, checks cross-site request metadata, and emits framing protections. Regression cases include malicious persisted markup, isolated browser identities, restart durability, stale revisions, invalid payloads and private-file access.

A read-only GitHub Actions workflow runs dependency audit and the complete quality suite on pushes, pull requests, manual dispatch and weekly schedules. Official checkout/setup-node actions are pinned to immutable v6 commit hashes. Local validation is complete; the newly added hosted workflow is not claimed to have run before this push. Zero registry advisories is a point-in-time result, not proof that all possible source or platform vulnerabilities are eliminated. See SECURITY.md for the local-only deployment boundary and remaining limitations.

## Durable profiles and sizing — November 3, 2026

Final integrated validation passed: **124 unit tests across 19 files, one real-server API/restart scenario, all 35 Chromium scenarios, production build and lint**. Browser tests run against the Node application server. The API test verifies durable writes across a process restart, isolated browser identities, malformed writes, revision conflicts, origin checks and private-file protection. Browser tests additionally verify legacy migration, recovery after localStorage loss, honest failed-write status, immediate-save/reload preservation, reset, and individual ship scaling/movement/reload.

The first integration run exposed stale snapshot recovery and acknowledgement races; pending local writes now retain their active profile identity and cannot be erased by an older acknowledgement. Heavy scene generation no longer prematurely times out a save. Gallery harness routing stays inside Playwright without widening the server's private-file protections. The final complete run had no failures.

OmniRoute 3.8.50 was verified globally on the C drive and restarted successfully with healthy status. The old project installation and 1,147 extraneous packages were removed after backing up local configuration/data outside the repository. All 131,700 previously vendored node_modules entries were untracked. npm now audits 136 project packages, with 11 remaining findings (7 moderate, 4 high); this change does not claim to resolve every dependency advisory.

SQLite/browser-cookie recovery and backup limits are described in the setup guide. Profiles are local to a browser identity, not cross-device accounts. Runtime databases, private backups and generated test artifacts are excluded from publishing.

## Decor and companions expansion — November 3, 2026

Build and lint passed. **119 unit tests across 18 files and all 32 Chromium scenarios passed** in the final integrated run, with no failures. The new browser scenarios exercise six decor purchases, actual mouse-driven ship placement and rotation, backdrop purchase/free switching/hiding and reload, plus actual rendered fish/coral growth and saved size persistence. All 37 animal models render with finite geometry and no shader errors. Reviewed the lit decor scene and generated species gallery images.

New unit coverage verifies decor bounds/full-tank rejection/no filtration credit, species models, five-arm star anatomy, anemone hosting eligibility and bounded visual maturation. Existing cycling, maintenance, four tank shapes, profiles, feeding/removal, coral placement, mobile layout and quiz checks remain green. Fixed the aquascape editor reopening on pointer movement, recursive prop surface picking, and old-save growth reconstruction/clamping.

Growth and hosting remain illustrative. The new anemone and articulated serpent star add draw calls; dense scenes still need future LOD/instancing work. This verifies Chromium on the test machine, not every GPU or browser engine.

## Physical simulation upgrade — November 3, 2026

Production build and ESLint passed. All **105 unit tests across 15 files** and **30 Chromium browser scenarios** passed. The final browser report records no failed tests.

Coverage includes rectangular, cube, cylinder and bow-front creation and reload; meter-scale water outlines and livestock; all 33 species factories; continuous swimming, schooling and cleaner separation; raycast coral movement, rotation snapping and persistence; feeding and dead-animal removal; growth and old-save migration; nitrogen-cycle recovery; profiles, maintenance, purchases, quizzes, autosave, reset and mobile layout. Placement unit tests additionally cover rock edits, surface normals, overlap rejection, cancellation and growth requiring more space.

Fixed legacy assertions to use physical distances and procedural water geometry. Regression tests also protect against static-environment rebuilds during coral growth, new livestock inheriting an old tank's starvation age, malformed saved position vectors and replacement cleaners reviving dead cohorts. Corrected the LED fixture shadow that obscured most of the tank. Reviewed rendered tank and species-gallery screenshots.

These checks validate the exercised Chromium flows and deterministic simulation rules. Growth timing, cleanup cohort health and food offerings are simplified training models; see the physical-simulation guide for limits. Detailed coral geometry can still be expensive at high population counts.

# Full app smoke test — November 2, 2026

## Scope

Tested the local production bundle in Chromium. Browser scenarios cover welcome/startup, equipment purchases, a fresh tank reaching seawater salinity, accelerated nitrogen cycling, fish/coral/cleanup purchases, rejected early fish purchases, rendering all 26 wildlife models, resize, pause/speed, feeding and reload, maintenance chemistry, water testing, lesson/quiz completion and cancellation, profile-name escaping, malformed-storage recovery, autosave, reset, and a 390 × 844 mobile viewport. The simulation clock is advanced directly in the cycling scenario to avoid waiting through many real-time hours; purchases and maintenance use the visible UI.

## Fixes

- Added the missing initial salt-mixing progression (24 simulated hours).
- Enabled periodic autosave and save-on-navigation; persist a newly started game and update save status.
- Resume uses the saved simulation rate and restores pause/speed labels.
- Cancelled quizzes cannot reopen from delayed feedback callbacks; modal actions are cleared between lessons/quizzes.
- Profile dialogs recover from malformed saved JSON and escape names before HTML insertion. Profile switching saves the outgoing tank; reset suppresses save-on-unload to avoid resurrecting cleared data.
- Raised modal layering above the welcome screen and added a single-column layout for narrow viewports.
- Test Water now displays current measurements when the test kit is owned.
- Removed the unintended 35% minimum health clamp so sustained lethal conditions can trigger fish death once.

## Results

Build and lint passed. All 34 unit tests passed. All 22 Chromium browser scenarios passed (18 in the full regression run plus four profile/tank-size scenarios). The tests reproduced the defects before their corresponding fixes where applicable.

## Verification and limits

Run `npm run build`, `npm test`, `npm run lint`, and `npm run test:ui`. The smoke additions live in `tests/smoke*.spec.js` and `tests/SmokeSimulation.test.js`; existing wildlife gallery and regression checks remain part of the suite.

This verifies the tested Chromium flows and numerical assertions, not every possible save file, browser engine, GPU, or long-running population configuration. Optional OmniRoute is a separate development tool and was not started or changed by this app smoke test. Its previously documented dependency audit findings remain.

## Follow-up: cycling with nutrient export

The original fresh-start smoke case did not combine a skimmer with macroalgae. That combination exposed an incorrect minimum-nitrate requirement for completion. Completion now depends on the existing simulated cycle age (at least 12 days), ghost-feeding history, ammonia below 0.1 ppm, and nitrite below 0.15 ppm, irrespective of remaining nitrate. Existing stalled saves recover on their next unpaused tick without resetting progress. Added nine unit regressions covering filtration combinations, saved-tank recovery, premature completion guards, purchase eligibility and a single completion journal entry, plus a browser test that resumes a stalled save and purchases a clownfish.

## Follow-up: wildlife habitats and anatomy

Added a populated-reef browser scenario with all ten fish, ten coral types and all six cleanup types (23 individuals). It stops the chemistry timer and verifies continuous swimming, pause stability, supported/non-overlapping coral footprints, distinct cleanup positions and stable colony placement after reload. A separate browser scenario feeds a cleanup-only tank and verifies Nassarius emergence. The gallery renders all 26 species and checks geometry and shader errors.

Unit regressions cover supported coral contact and spacing at all three visual capacities (8/20/40), fish movement and habitat/colony avoidance, frame-rate consistency, anatomy, cleanup distribution, feeding emergence and corrected algae-consumption diets. See [HABITAT_GUIDE.md](HABITAT_GUIDE.md) for what these behaviors do and do not model. Wildlife paths are illustrative; this pass does not certify real-tank stocking, PAR, disease or compatibility outcomes.

The first full browser run passed 24/25 cases; the populated reef exceeded its initial five-second setup timeout while ten WebGL workers competed. Giving that scenario a 30-second initialization allowance passed on rerun without weakening geometry or movement assertions. Final verification totals are recorded after the last anatomy/contact correction below.

Final verification after the contact and environment-rebuild fixes: build and lint passed; all 68 unit tests and all 25 Chromium browser tests passed (`npm run test:ui -- --workers=2`). Reviewed the refreshed cleanup gallery and populated-reef screenshots. No shader or browser errors were reported by those scenarios.
