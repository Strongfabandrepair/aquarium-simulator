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
