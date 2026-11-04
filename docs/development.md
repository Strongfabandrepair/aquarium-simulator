# Development guide

## Setup and commands

Use Node.js 22.13+ within 22.x, or 24+, and npm. Run `npm ci`, `npm run build`, then `npm start`; open `http://127.0.0.1:8766`. The lockfile defines dependencies; do not copy another machine's `node_modules`.

Source uses ES modules. esbuild bundles `js/main.js` into committed `bundle.js`. The server does not automatically rebuild source. Watch in a separate terminal with:

```sh
npx esbuild js/main.js --bundle --outfile=bundle.js --watch
```

| Command | Purpose |
| --- | --- |
| `npm run build` | Generate browser bundle |
| `npm run lint` | ESLint for `js/**/*.js` |
| `npm test` / `npm run test:watch` | Vitest regression suite / watch |
| `npm run test:api` | Real-server validation, revision/isolation and restart checks |
| `npx playwright install chromium` | Install browser used by suite |
| `npm run test:ui -- --workers=2` | Chromium application/rendering scenarios |
| `npm run format` | Format JavaScript source |
| `npm audit` | Inspect current dependency advisories |

Lint's script does not cover every server/test file; passing it does not mean every file was examined. API/browser tests provide distinct evidence.

Playwright starts the Node service on 8766 and can reuse an existing server outside CI. Stop unrelated/personal servers first. Set `REEFSIM_DB` to a disposable test path to separate browser-test writes from personal data. Never test against an irreplaceable collection. Preserve the static-file allowlist; gallery test routing supplies its harness without exposing dependencies publicly.

Reports: `playwright-report/`; traces/results: `test-results/`; screenshots: `artifacts/`. These are ignored. Record completed results and limits in the [smoke report](../SMOKE_TEST_REPORT.md); do not describe a partial/old run as the latest full suite.

## Extend species, decor or equipment

For species, inspect both `SpeciesCatalog` metadata and `StoreService` registration. Supply adult/juvenile meter sizes, growth timing, diet and behavior assumptions, with sources. Add recognizable model, texture and animation details. Ensure rendering scales actual geometry, routes movement and cleans up removed/profile-switched meshes. Test anatomy, size caps, movement, food compatibility and placement where relevant; inspect the gallery and a populated tank.

Anemones are distinct from true corals although they share the colony path. Do not assign skeletal calcium/alkalinity consumption automatically. Hosting is illustrative, not guaranteed compatibility.

Decor definitions/models live in `DecorCatalog`/`DecorModels`. Purchases find space before charging. `kind: 'rock'` can mean synthetic decor, so do not infer biological credit from it. Preserve physical footprint, floor contact, owning IDs for child geometry and immutable `baseSize`. Previews must not mutate saves; invalid commits must fail; edits must survive reload. Backgrounds remain outside swimming space.

Equipment involves `PhysicalEnvironment`, `GameEngine`, `StoreService` and `EquipmentManager`. A visible mesh alone does not implement operating behavior.

## Simulation and persistence changes

Use shared `TankGeometry` helpers for all four shapes. Test body margins/headroom and extreme dimensions. Do not solve clipping by shrinking animals below their physical size. Keep chemistry in models rather than frame callbacks and make time conversions explicit. Test the concrete bug and premature-success guards, such as cycling with zero nitrate after nutrient export.

Persistence needs browser recovery and real-server tests. Preserve old saves, validate untrusted snapshots, keep revision conflicts, and distinguish acknowledgements from local copies. Update `server/openapi.yaml` when the contract changes. Never relax private-file restrictions for a test harness.

## Dependencies, CI and publication

Review runtime and development advisories. The November 2026 remediation updated ESLint 10 with compatible explicit `@eslint/js`, patched vulnerable dependencies and applied a targeted `minimatch` override. Reassess/remove that override when upstream constraints safely resolve a fixed compatible version. Zero audit findings reflect the checked advisory database/tree, not a security guarantee.

CI is configured for checks and recurring audit; consult the actual workflow for current triggers/tool versions. Review source and bundle diffs, include lockfile/docs/tests when relevant, and exclude databases, cookies, `.env`, backups, dependencies and generated reports. Major cross-module changes should pass build/lint/unit/API/browser checks. See [contributing](../CONTRIBUTING.md) and [security](../SECURITY.md).
