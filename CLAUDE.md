Current habitat and behavior update: see [HABITAT_GUIDE.md](HABITAT_GUIDE.md) for continuous swimming, supported coral placement, cleanup anatomy/foraging, species-care guidance, references and simulation limits. [SMOKE_TEST_REPORT.md](SMOKE_TEST_REPORT.md) records verification. Earlier plans and session entries below are historical.

<!-- Wildlife rendering update: 2026-11-02 -->

See [WILDLIFE.md](WILDLIFE.md) for the current 26-species models, procedural textures, movement system, cleanup-crew integration, rendering budgets, reference sources, and visual regression workflow. This supersedes older livestock-rendering descriptions below.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

ReefSim utilizes standard quality-control frameworks (Vitest, ESLint, and Prettier) alongside esbuild for fast bundling.

### Build & Compilation
- **Bundle JS**: `npx esbuild js/main.js --bundle --outfile=bundle.js`
- **Watch & Live Compile**: `npx esbuild js/main.js --bundle --outfile=bundle.js --watch`

### Code Quality & Static Analysis
- **Lint Code (ESLint)**: `npm run lint`
- **Auto-Format Code (Prettier)**: `npm run format`

### Unit Testing
- **Run Tests (Vitest)**: `npm run test`
- **Test Watch Mode**: `npm run test:watch`

### Local Development Server
Because the application fetches assets and utilizes WebGL/Three.js, a local HTTP server is required to bypass CORS policies:
- **Python**: `python -m http.server 8000`
- **Node/NPM**: `npx serve`

---

## High-Level Architecture

ReefSim is a procedural 3D Saltwater Aquarium learning simulator built with WebGL (Three.js) and a decoupled, Object-Oriented ES6 Module design. 

```
  [ index.html ] <--- Loads bundle.js & styles.css
        |
   [ main.js ] ---> Instantiates GameEngine
        |
  [ GameEngine ] <========================================+ (Updates every tick)
     |       |                                            |
     |       +---> [ GameState ] (localStorage store)     |
     |                                                    |
     +---> [ Simulation Models ]                          +---> [ Rendering & UI ]
     |       * WaterChemistry (parameters, cycle)                 * ThreeRenderer (3D Context)
     |       * LivestockEngine (behavior, health)                   - TankBuilder (procedural stand/rocks)
     |       * EquipmentManager (status, tips)                      - LivestockRenderer (geometry/fins)
     |       * StoreService (database, costs)                     * UIController (DOM, toasts)
     |                                                              - SparklineManager (trends)
```

### 1. Orchestration & State Lifecycle
- **`js/main.js`**: The ES6 entry point. Listens for `DOMContentLoaded`, initializes the `GameEngine`, and defines global window-level modal triggers used by interactive elements in `index.html`.
- **`js/engine/GameEngine.js`**: The central orchestrator. Runs the main timing loop (`setInterval` adjusted by simulation speed) and distributes tick-updates to chemistry and biological engines. It coordinates user action triggers (e.g., buying fish, performing water changes, ghost feeding) and tells the UI and renderer to refresh. The GameEngine also coordinates quiz initialization, question display, answer processing, and score calculation, integrating with the UIController for modal presentation.
- **`js/engine/GameState.js`**: Defines the single-source-of-truth state schema (`DEFAULT_GAME_STATE`) tracking physical parameters, owned equipment, active alerts, livestock arrays, and journal logs. Manages saving/loading profiles via `localStorage`.

### 2. Biological & Chemical Physics
- **`js/model/WaterChemistry.js`**: Simulates the aquatic chemical engine. Calculates thermal inertia (heater vs. ambient), salinity creep from evaporation, diurnal pH swings, oxygen depletion from animal respiration, calcification from coral growth, and progression of the Nitrogen Cycle (Ammonia $\rightarrow$ Nitrite $\rightarrow$ Nitrate).
- **`js/model/LivestockEngine.js`**: Drives species life-history mechanics. Tracks animal health decay based on water stressors (temperature, salinity, toxic spikes) and manages procedural 3D swimming target coordination based on species-specific behavior states (hovering, cruising, darting, perching).
- **`js/model/StoreService.js`**: Holds static databases for all purchaseable items (equipment, fish, corals, cleanup crew) and validates purchasing requirements (e.g., verifying tank volume compatibility or cycle readiness). The quiz system extends StoreService with interactive assessment questions for each knowledge topic, providing immediate feedback and awarding knowledge points for correct answers.

### 3. Procedural 3D Graphics & Rendering
- **`js/graphics/ThreeRenderer.js`**: Manages the WebGL context, camera projection, orbit controls, custom lighting profiles (e.g., basic light vs. high-intensity actinic reef LEDs), water visibility, and bubble particles.
- **`js/graphics/TankBuilder.js`**: Procedurally generates the static environment group (wooden cabinet stand, glass tank pane, live sand bed, and live rocks with coralline algae). It hashes the owned equipment state to avoid rebuilding the 3D group on every frame.
- **`js/graphics/LivestockRenderer.js`**: Procedurally constructs 3D models for each species from basic geometric primitives (spheres, cylinders, custom extruded shapes) and drives skeletal animation (such as clownfish tail-wagging or coral tentacle sways).

### 4. User Interface & Dashboards
- **`js/ui/UIController.js`**: Binds game state properties to the DOM layout, updating equipment toggles, real-world cost comparisons, progress timelines, and nitrogen cycle diagrams. The UIController also manages quiz presentation through the existing modal system and handles user interactions with knowledge topics and quiz buttons.
- **`js/ui/SparklineManager.js`**: Collects rolling historical parameter readings and plots real-time trends onto small `<canvas>` sparklines embedded directly into the parameter dashboard.