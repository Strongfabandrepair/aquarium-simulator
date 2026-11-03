November 3, 2026: [PERSISTENCE_AND_SETUP.md](PERSISTENCE_AND_SETUP.md) covers SQLite-backed profiles, individual decor sizing and global OmniRoute separation.

November 3, 2026 expansion: see [DECOR_AND_SPECIES.md](DECOR_AND_SPECIES.md) for purchasable decor/backgrounds, the 37-entry species catalog, anemone hosting and visible bounded growth.

November 3, 2026: [PHYSICAL_SIMULATION.md](PHYSICAL_SIMULATION.md) documents the current meter-scale tank generator, raycast aquascape editor, 33-species catalog, feeding/growth/mortality systems and verification. Earlier entries below describe previous versions.

Current habitat and behavior update: see [HABITAT_GUIDE.md](HABITAT_GUIDE.md) for continuous swimming, supported coral placement, cleanup anatomy/foraging, species-care guidance, references and simulation limits. [SMOKE_TEST_REPORT.md](SMOKE_TEST_REPORT.md) records verification. Earlier plans and session entries below are historical.

See [SMOKE_TEST_REPORT.md](SMOKE_TEST_REPORT.md) for the November 2 full-flow smoke tests and resulting reliability fixes.

<!-- Wildlife rendering update: 2026-11-02 -->

See [WILDLIFE.md](WILDLIFE.md) for the current 26-species models, procedural textures, movement system, cleanup-crew integration, rendering budgets, reference sources, and visual regression workflow. This supersedes older livestock-rendering descriptions below.

# ReefSim (Aquarium Simulator)

Procedural 3D saltwater aquarium learning simulator built with Three.js and modular ES6 architecture.

## Local development

Install dependencies:

- `npm install`

Bundle the app:

- `npm run build`

Start the local application and SQLite profile store (Node.js 22.13+):

- `npm start`
- Open `http://127.0.0.1:8766`

See [PERSISTENCE_AND_SETUP.md](PERSISTENCE_AND_SETUP.md) for database location/backups, browser identity, per-item sizing and the separate global OmniRoute installation. Static hosting supports local-only saves.

## Quality checks

- Unit tests: `npm test`
- Persistence API/restart tests: `npm run test:api`
- Browser tests: `npx playwright install chromium`, then `npm run test:ui` (starts the Node server)
- Build: `npm run build`
- Watch tests: `npm run test:watch`
- Lint: `npm run lint`
- Format: `npm run format`
