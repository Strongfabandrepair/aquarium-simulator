# ReefSim physical aquarium and husbandry modules

## Units and tank geometry

The rendered world uses **1 Three.js unit = 1 meter**. The tank center is the origin; +Y is up. The internal bottom is `-height / 2`, and the fill line is `height / 2 - 0.025` (2.5 cm headspace). Species metadata contains meter dimensions. Model artwork is measured once and uniformly scaled to the animal's current physical size; raw model-authoring coordinates are not world coordinates.

`js/model/TankGeometry.js` is the shared source for dimensions, footprint outlines, volume, containment and boundary projection. Rectangular and cube footprints are rectangular, cylinders use a circular footprint, and bow-front tanks use a parabolic front with shallower corners. The displayed water surface, substrate, glass, placement validation, fish movement and glass-crawling snails use this same definition.

| API | Purpose |
| --- | --- |
| `normalizeTankSpec(spec, preset)` | Validate shape and dimensions; cube sides and cylinder diameter are coupled. |
| `getTankSpec(state)` | Resolve custom dimensions or a standard preset. |
| `tankOutline(spec)` | Sample the footprint for geometry and glass paths. |
| `tankVolumeLiters(spec)` | Volume to the fill line, in liters. |
| `containsPoint(spec, x, z, margin)` | Footprint containment with body/placement clearance. |
| `constrainPoint(spec, point, margin)` | Constrain a point to the interior and fill line. |
| `substrateHeight(state)` | Estimate substrate depth from purchased sand mass. |

The 20/55/120 gallon scenarios retain their nominal rated capacities for existing purchase rules and saves. Their display dimensions now approximate standard aquarium dimensions. Custom scenarios calculate their capacity from the selected interior shape and fill line. The HUD shows calculated fill-line liters; neither this volume nor current chemistry deducts rock/sand displacement. Preset dimensions are approximately 61×30.5×42, 122×33×53 and 122×61×61 cm (width×depth×height). The custom form accepts 25–300 cm, not a structural glass/stand engineering specification.

`PhysicalEnvironment.js` constructs meter-sized glass, rims, stand, substrate, rocks and equipment. Heater cables/suction mounts, pump cages, skimmer cup/foam, LED chips/fins, sump baffles, dosing lines, probes and instrument labels identify purchases. The renderer fits camera clipping and orbit limits to the tank, uses millimeter-scale surface waves and food/bubble particles, and configures a 1024² soft shadow map for the scaled light. Caustics are a restrained emissive approximation; this is not a spectral lighting or PAR solver.

## Custom tanks and aquascaping

Open **Design a custom tank** on the welcome screen, select the shape, and enter centimeters. Cube uses the width for all sides; cylinder uses width as diameter. The form previews fill-line volume. Existing scenarios still start through their original buttons.

Purchase live rock or a coral frag, then open **Aquascape editor** beneath the tank. Enable editing, select an owned item (or click it in the tank), and choose **Move selected**. Move the pointer over substrate or rock and click a valid green preview to save. Red previews explain invalid boundaries, overlap, steep surfaces or insufficient headroom. Rotation buttons and left/right arrows snap to 15°. Escape or Cancel discards the preview. Disable editing to resume orbiting the camera.

`PlacementController` uses a Three.js Raycaster against actual habitat surfaces. Hovering never changes saved state. Commit validates again, aligns the object's local up axis to the surface normal, applies yaw, and writes `state.placedItems`. Moving a rock supporting another placed object is rejected until its dependents are moved.

```js
{
  id: 'coral-1', kind: 'coral', livestockId: 1,
  position: { x: 0.2, y: -0.18, z: 0.1 },
  normal: { x: 0, y: 1, z: 0 },
  rotation: Math.PI / 12, // radians about the surface normal
  size: 0.055,           // current diameter in meters
  supportId: null        // supporting rock ID, or substrate
}
```

Default purchased rock placements are seeded once and persisted. Legacy coral coordinates are re-seated against actual surfaces. Saved manual placements retain their location and rotation. If growth exceeds available room, the colony is marked **Needs space** and held in the placement tray; it is not invisibly shrunk or moved elsewhere. Use its **Place / move frag** button to find room. Colony health continues to simulate while in this abstract tray.

## Data-driven species and behavior

`SpeciesCatalog.js` contains 33 marine entries: **13 fish, 12 corals and 8 cleanup species**. Seven additions are lyretail anthias, blue-green chromis, yellow watchman goby, toadstool leather, candy cane coral, Trochus snail and Cerith snail. Each has a model, catalog card and physical metadata. Freshwater tetras are intentionally outside this saltwater catalog.

`getSpecies(id)` supplies `adultLengthM`, `juvenileLengthM`, `growthDays`, `movement`, `diet`, and model family. `physicalSize(animal, kind)` resolves saved `lengthM` or coral `diameterM`. To add a species, add metadata and its store definition, provide recognizable model/texture details, and cover it in the model and movement tests.

Movement profiles distinguish cruising, territorial hovering, shelter association, perch/hop behavior, bottom foraging and schooling. Anthias/chromis use local cohesion, alignment and separation while remaining inside the chosen tank shape. Food approach depends on diet and event age. Cleaners use sand, rock and curved glass contacts, with scavenging, burrowing, grazing and sheltered activity differences. These profiles represent tendencies; they do not guarantee that any proposed group will remain compatible.

## Feeding, growth and mortality

The Maintenance panel offers mixed, algae, meaty, plankton and copepod foods. **Feed Livestock** works in cleanup-only tanks, creates a saved feeding event and a short visible food-particle burst, and records meals only for compatible diets. Mixed food does not satisfy the mandarin's copepod specialization. Overfeeding still adds waste. This is an abstract food offering, not a modeled live prey population.

`Husbandry.js` tracks animal age, meal history, growth progress and physical size. Healthy, nourished fish and cleanup animals grow; coral growth depends on light and health. Maturation follows a bounded curve toward a species target rather than growing indefinitely. Catalog growth times and coral target diameters are illustrative training parameters, not biological predictions. Coral visual growth expands the colony mesh; it does not generate a full branching/reproduction ecosystem.

Fish, corals and cleanup cohorts can die. Dead fish no longer swim; dead coral cannot recover; dead cleanup cohorts stop grazing and moving. Remains add a simple ammonia decay load until removed. The Livestock panel exposes **Remove remains** for affected entries, preserving journal history and stopping their subsequent decay. Cleanup health is currently tracked per purchased cohort, not per individual.

## Persistence, performance and verification

Snapshots retain custom specs, placement transforms, food events, sizes, maturity and meals. Defaults keep older saves loadable. Switching profiles clears incompatible scene meshes even when animal IDs match. Movement uses active visual seconds, pauses with the simulation, and stays readable while the husbandry clock runs at 5x/20x.

Environment geometry rebuilds only when its signature changes. Habitat candidate surfaces, movement probes, model measurements and coral bounds are cached. Shadow resolution and device pixel ratio are capped. Detailed coral meshes remain expensive at high population counts; distance-based LOD and instancing are future work, and no universal FPS claim is made.

Run `npm run build`, `npm run lint`, `npm test`, and `npm run test:ui -- --workers=2`. Tests cover four shapes, geometry/analytic volume agreement, confinement, surface raycasts, persistent edits, normal alignment, rotation snapping, cancel/invalid placement, all 33 factories, physical sizes, schooling, feeding, growth, death/removal and save/reload. Browser screenshots are generated under `artifacts/`.

## References and learning limits

- [Aqueon aquarium dimensions](https://www.aqueon.com/-/media/project/oneweb/aqueon/files/us/set-up-guides/criticaldimensions2023.pdf) informed standard tank proportions.
- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html) describes surface hit testing; implementation uses the installed r128 API.
- [Australian Museum: blue tang](https://australian.museum/learn/animals/fishes/blue-tang-paracanthurus-hepatus/) and [National Aquarium: Banggai cardinalfish](https://aqua.org/explore/animals/banggai-cardinalfish) inform species size/habitat references.
- [LiveAquaria: lyretail anthias](https://www.liveaquaria.com/products/lyretail-anthias) informs schooling-space and feeding guidance.
- See [HABITAT_GUIDE.md](HABITAT_GUIDE.md) for additional diet, habitat and coral-care references.

Use the simulator to practice planning, observation, feeding and maintenance. Real aquariums require measured chemistry, adequate swimming length, adult-size and compatibility research, acclimation/quarantine, and appropriate light/flow. Disease transmission, structural engineering, live food-web sustainability, coral stinging and full territorial behavior remain outside this model.
