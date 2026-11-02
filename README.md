# ReefSim (Aquarium Simulator)

Procedural 3D saltwater aquarium learning simulator built with Three.js and modular ES6 architecture.

## Local development

Install dependencies:

- `npm install`

Bundle the app:

- `npm run build`

Run a local static server (required for asset loading/WebGL):

- `python -m http.server 8000`

Then open:

- `http://localhost:8000`

## OmniRoute quick runbook

OmniRoute is configured as a **project-local dev dependency** so this repo does not rely on a global install.

### Start the server

- `npm run omniroute:serve`

### Check health

- `npm run omniroute:health`

### Stop the server

- `npm run omniroute:stop`

### Show CLI help

- `npm run omniroute:help`

### Default local endpoints

When running, OmniRoute exposes:

- Dashboard: `http://localhost:20128`
- API base: `http://localhost:20128/v1`

## Quality checks

- Unit tests: `npm test`
- Browser tests: `npx playwright install chromium`, then `npm run test:ui` (requires Python 3)
- Build: `npm run build`
- Watch tests: `npm run test:watch`
- Lint: `npm run lint`
- Format: `npm run format`
