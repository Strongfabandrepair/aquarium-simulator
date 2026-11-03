November 3, 2026: [DECOR_AND_SPECIES.md](DECOR_AND_SPECIES.md) documents the latest decor/backgrounds, 37-entry catalog, anemone hosting and visible growth expansion. Earlier entries below describe previous versions.

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
