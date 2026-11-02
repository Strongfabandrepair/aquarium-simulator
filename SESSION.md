<!-- Wildlife rendering update: 2026-11-02 -->

See [WILDLIFE.md](WILDLIFE.md) for the current 26-species models, procedural textures, movement system, cleanup-crew integration, rendering budgets, reference sources, and visual regression workflow. This supersedes older livestock-rendering descriptions below.

# ReefSim Development Session - Quiz System Added

## Session Summary (Aug 21, 2026)
In this session, we extended the learning capabilities of the ReefSim aquarium simulator by implementing an interactive quiz system. Users can now test their knowledge on key aquarium topics (nitrogen cycle, water chemistry, salinity, temperature, lighting, filtration, live rock, and fish selection) after reaching a basic understanding threshold (40% knowledge). The quiz system provides immediate feedback with detailed explanations and awards knowledge points based on performance, reinforcing learning through active recall.

## Changes Made

### js/model/StoreService.js
- Enhanced the `KNOWLEDGE_BASE` object to include quiz data for each of the 8 existing knowledge topics.
- Each topic now contains 3-5 multiple-choice questions with question text, 4 answer options, correct answer index, and detailed explanation for learning.

### js/engine/GameEngine.js
- Enhanced the `readKnowledge()` method to notify users when they can take a quiz (after reaching 40% knowledge in a topic).
- Added quiz management methods:
  - `takeQuiz(key)`: Initializes and starts a quiz for a given topic.
  - `showQuizQuestion()`: Displays the current question and answer options.
  - `submitQuizAnswer(selectedIndex)`: Processes user answers, provides immediate feedback, and tracks quiz progress.
  - `finishQuiz()`: Calculates the quiz score, awards knowledge points (5-25 points based on performance, capped at 100), and displays results.
  - `showModal(title, content, onShowCallback)`: Helper method to display quiz modals (reusing the existing modal system).
- Updated the `render()` method to include the `onTakeQuiz` callback in the UIController integration.
- Added a global `window.takeQuiz` handler for quiz activation from the UI.

### js/ui/UIController.js
- Modified `renderKnowledge(state, _callbacks)` to display a "Take Quiz" button when knowledge for a topic reaches 40% or higher and quiz data is available.
- Updated `initListeners()` to handle both read knowledge and take quiz actions using event delegation.

## Benefits
- Transforms passive knowledge reading into active learning through immediate assessment.
- Provides measurable learning outcomes via quiz scores and knowledge point awards.
- Encourages revisiting topics to improve understanding and achieve higher scores.
- Maintains full compatibility with existing features and architecture.
- Follows established code patterns (modal system, event delegation, state updates).

---
# ReefSim Development Session - Refactoring Completed

## Session Summary (Aug 19, 2026)
In this session, we successfully completed a major architectural modernization of the **ReefSim 3D Saltwater Aquarium Simulator**. We transitioned the application from an unoptimized full-panel repainting loop to a state-of-the-art **Reactive, State-Driven, and Highly Decoupled module architecture** while preserving 100% of the underlying physical, biological, and 3D coordinate mathematics.

---

## 🏗️ Architectural Changes Implemented

### 1. Reactive Deep Proxy State Store (`js/engine/ObservableStore.js`)
- Introduced `ObservableStore` which wraps your core game state in a recursive JavaScript Proxy.
- Intercepts all nested state mutations (e.g. `state.water.temperature += 0.05`) across all physics/livestock engines **without requiring any changes to their mathematical equations**.
- Queues notifications and automatically debounces/batches them inside a microtask (`Promise.resolve().then()`) so that observers are notified only **once per tick/frame**, avoiding redundant calculations.

### 2. Zero-Thrashing Rendering & Event Delegation (`js/ui/UIController.js`)
- Refactored `UIController.js` to utilize an optimized `updateHTML()` helper. It checks the existing DOM's `innerHTML` and **skips writes if the contents have not changed**, fully resolving layout recalculations.
- ulations.
- Replaced the high-overhead, tick-based query-selector and `.onclick` event rebinding loops with **Event Delegation**. Click listeners are now bound exactly **once** on application boot to parent panels (`#equipmentPanel`, `#maintenancePanel`, `#tab-store`, etc.). Event handlers are never lost, and memory overhead is heavily reduced.

### 3. Modern Local Bundling & Sourcing
- Pinned local Three.js dependency inside `package.json` to `"three": "0.128.0"` to ensure full compatibility with the existing rendering, material, and coordinate logics.
- Refactored `ThreeRenderer.js`, `TankBuilder.js`, and `LivestockRenderer.js` to import `THREE` and JSM `OrbitControls` directly from local node modules.
- Removed legacy CDN script tags from `index.html`, making the application fully offline-ready and bundling-capable.
- Fixed a compile-time warning/error where `THREE.CapsuleGeometry` (not available in r128) was used for the tailspot blenny, replacing it with an equivalent, fully compatible `THREE.CylinderGeometry`.

---

## 📋 Current Build State

| Parameter | Current Value / Status |
|---|---|
| **Compilation Status** | **Local Bundle Ready** (all import pathways verified) |
| **Three.js Core** | Local `"three": "0.128.0"` (pinned for r128 API stability) |
| **Dependencies Sourcing** | Piped locally (CDN scripts removed from `index.html`) |
| **DOM Rendering Flow** | Targeted string comparison memoization & Event Delegation |
| **Physics/State Sync** | Reactively observed via Deep State Proxies |

---

## 🏃 Next Steps (How to Build and Run)
To compile the local bundle and boot the development server, run these three simple commands in your terminal:

```bash
# 1. Install local dependencies (downloads local Three.js r128)
npm install

# 2. Compile the self-contained local bundle (packages dependencies offline)
npx esbuild js/main.js --bundle --outfile=bundle.js

# 3. Boot the local development server (bypasses CORS for WebGL loading)
python -m http.server 8000
```
Open your browser and navigate to **`http://localhost:8000`** to play ReefSim!

---

## 🧪 Quality Assurance & Code Integrity Sweeps

In the second half of this session, we introduced a robust Quality Assurance (QA) pipeline to guarantee the mathematical correctness of our biological/chemical simulations and enforce coding conventions across the codebase.

### 1. Robust Static Analysis & Consistency
* **ESLint Configuration (`eslint.config.js`)**: Configured flat file linting with custom browser and `THREE` globals. Successfully identified and cleared all warnings.
* **Prettier Standard (`.prettierrc`)**: Prettier handles auto-formatting across the codebase to ensure 4-space tab indentation consistency.
* **Silent Bug Resolution**: Cleared critical syntax and import errors, most notably a **missing `CLEANUP_DATABASE` import** in `LivestockEngine.js` that was silently causing crashes when adding snails or hermits during active gameplay.

### 2. Full Simulation Unit Tests (Vitest)
Integrated **Vitest** for fast native ES6 module unit testing and wrote 25 comprehensive tests inside the `tests/` directory:
* **`tests/WaterChemistry.test.js` (15 Tests Passed)**:
  * Thermals: Verifies heater active temperature climbs towards 78°F vs ambient defaults.
  * Salinity: Asserts evaporation salinity increases when ATO is offline vs stable levels when active.
  * Nitrogen Cycle: Validates Ammonia spikes from ghost-feeding under 24h, and Ammonia $\rightarrow$ Nitrite $\rightarrow$ Nitrate bacterial conversion paths.
  * Bioload/Filtration: Confirms Nitrate generation from live fish, and removal rates from protein skimmers, refugiums, and GFO media reactors.
  * Oxygenation: Asserts O2 drops from respiration vs surface aeration limits.
* **`tests/LivestockEngine.test.js` (10 Tests Passed)**:
  * 3D Coordinates: Verifies new fish correctly seed bounds and target ranges.
  * Behavior States: Asserts species-specific traits ('cruising', 'hovering', 'perching', 'darting').
  * Health Stress: Validates health decays from bad temperatures, salinities, oxygen depletion, or Ammonia/Nitrite toxin spikes.
  * Metabolism: Asserts health decay from starvation, healing boosts from daily feedings, and algae-grazing bonuses for tangs/blennys.

### 3. Browser Lab Telemetry Dashboard (`qa-report.html`)
Created a gorgeous local interactive HTML page (`qa-report.html`) containing:
* **Real-time Sandbox Simulator**: Runs the simulator's exact mathematical differential equations in-browser. You can toggle heaters, skimmers, ATOs, and ghost feeding, drag a tick slider, and watch live parameters and fish health calculate instantly.
* **Interactive Test Suite Matrix**: A filterable table displaying passing status, assertions, and descriptions for all 25 unit tests.
* **Linter & Build Analytics**: Detailed metrics on zero warnings, zero errors, and bundling status.

---

## 🚀 Quality Assurance Utility Commands

Keep your codebase pristine by using these standard scripts:

```bash
# 1. Run all 25 unit tests in the suite once
npm run test

# 2. Run the test suite in watch mode for active development
npm run test:watch

# 3. Check for code styling, variable safety, and syntax guidelines
npm run lint

# 4. Automatically style and format all files to standard
npm run format
```