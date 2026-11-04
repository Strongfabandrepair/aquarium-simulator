# ReefSim

ReefSim is a procedural 3D saltwater aquarium learning simulator. Plan a tank, buy equipment and animals, practice cycling and maintenance, arrange an aquascape, and observe simulated feeding, movement, growth and mortality.

The browser runs JavaScript/Three.js; a local Node server serves the app and saves named profiles in SQLite. Static hosting also works with browser-local saving only.

## Start locally

Use Node.js **22.13+ within the 22.x line, or 24+**, npm, and a WebGL-capable browser.

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:8766**. Keep the same browser profile/address to recover the same saved collection. The database defaults to `data/reefsim.sqlite` and is created automatically. The server binds to loopback; it is not a public multi-user service.

## Features

- Rectangular, cube, cylinder and bow-front tanks with meter-scale models and shared boundaries.
- **37 catalog entries:** 15 fish, 13 coral/anemone entries and nine cleanup companions.
- Species-specific movement and feeding, bounded visible growth, mortality/remains removal, and clownfish association with living placed anemones.
- Six repeatable rock/decor purchases, three backgrounds, surface placement, rotation snapping and per-item decor sizing.
- Chemistry, nitrogen cycling, equipment, maintenance, lessons, quizzes and a journal.
- Named profiles, local recovery copies, SQLite persistence, revision conflicts and save-status feedback.

Growth, compatibility and chemistry are educational approximations. A successful simulation does not guarantee a safe real aquarium stocking plan.

## Documentation

Start with the [documentation index](docs/README.md).

| Guide | Purpose |
| --- | --- |
| [User guide](docs/user-guide.md) | First tank, daily actions, aquascaping and troubleshooting |
| [Architecture](docs/architecture.md) | Modules, simulation/rendering flow, physical units and state |
| [Development](docs/development.md) | Setup, tests, extending species/decor and dependency workflow |
| [Operations](docs/operations.md) | Configuration, database backup/restore and deployment limits |
| [Contributing](CONTRIBUTING.md) | Review workflow and evidence |
| [Security](SECURITY.md) | Security boundary, reporting and findings |
| [Verification](SMOKE_TEST_REPORT.md) | Dated integrated results and limitations |
| [API contract](server/openapi.yaml) | Local persistence payloads |

`SESSION.md`, `REVIEW_NOTES.md` and older `PERFORMANCE_PLAN.md` entries retain project history; they are not current setup instructions.

## Verify changes

```sh
npm run build
npm run lint
npm test
npm run test:api
npx playwright install chromium
npm run test:ui -- --workers=2
```

Read the development guide before testing against an existing server/database. Reports/screenshots are local artifacts excluded from Git. OmniRoute is optional external tooling, not a ReefSim dependency. No project license grant is declared in this repository; dependencies retain their own licenses.
