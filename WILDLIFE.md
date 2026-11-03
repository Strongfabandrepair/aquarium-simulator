November 3, 2026 expansion: see [DECOR_AND_SPECIES.md](DECOR_AND_SPECIES.md) for purchasable decor/backgrounds, the 37-entry species catalog, anemone hosting and visible bounded growth.

# Wildlife rendering

The catalog now has models for 37 entries: 15 fish, 13 coral/anemone types, and nine cleanup animals. See [PHYSICAL_SIMULATION.md](PHYSICAL_SIMULATION.md) for meter sizing, growth and the interactive editor. These are procedural, stylized anatomical models intended for real-time aquarium viewing, not scanned specimens.

## Fish

`FishModels.js` builds tapered, UV-mapped bodies, curved fin outlines with fin rays, paired pectoral/pelvic fins, eyes, mouths, gills, and species details. `FishTextures.js` generates and caches markings in sRGB: clownfish white/black bars, royal gramma purple/yellow division, firefish red tail gradient, yellow tang yellow body, blue tang palette marking, cardinal black bars/spots, blenny tail eyespot, wrasse stripes, mandarin reticulations, and flame angel bars/blue fin accents.

Body deformation uses a traveling vertex-shader wave; the tail and fins follow an integrated phase. Tail amplitude follows travel speed. Root motion now uses continuous active time independently of slow chemistry updates, species-specific habitat paths, measured shelter/perches, speed limits, body separation and coral avoidance. It includes stable hovering headings, pitch and banking. Pause freezes wildlife; simulation speed controls do not accelerate visual swimming. Death stops the local swim rig. Species proportions and swim frequencies vary.

## Corals and cleanup animals

`CoralModels.js` differentiates oral disks, eight-tentacle star polyps, feathery pulsing xenia, hammer-shaped/torch/clustered frogspawn tips, branching acropora/birdsnest, and layered montipora plates. Geometry provides polyp and corallite detail. Soft structures sway; xenia pulses; health affects extension.

`InvertebrateModels.js` provides coiled shells, snail feet and siphons, articulated crab legs/claws, and segmented shrimp with antennae. Legs, feelers and claws animate independently. Cleanup cohorts now have purchase controls and one visible model per individual. Individuals have distributed homes and neighbor separation. Turbo snails graze rock or side glass; Nassarius partially bury in sand and emerge after feeding; crabs forage on rock/sand; cleaner shrimp remain near stations; peppermint shrimp move less in daylight. Shells are single continuous surfaces, and visible legs match the animal type. Colonies are mounted on measured aquascape surfaces with separated footprints; old floating placements are repaired automatically. See [HABITAT_GUIDE.md](HABITAT_GUIDE.md) for behavior, care references and simulation limits.

## Rendering and budgets

Fish use approximately 6,200–6,900 triangles and 25–28 draw calls per individual. Detailed branching coral colonies can reach approximately 116,000 triangles, merged to four draw calls. Cached textures are retained when mesh geometry/materials are disposed. High population counts still need a future distance-based LOD pass; no hardware-independent frame-rate claim is made.

## Verification

`npm test` checks root interpolation, stationary stability, bounded cleanup movement, and local polyp/appendage movement. `npm run test:ui` builds a temporary gallery harness, renders every catalog entry in Chromium, checks finite vertices and shader errors, and saves labeled fish/coral/cleanup sheets under `artifacts/`. The existing gameplay and reef regression suites also run.

## Visual references

- [Aquarium of the Pacific: clownfish](https://www.aquariumofpacific.org/onlinelearningcenter/species/clown_anemonefish)
- [Aquarium of the Pacific: palette surgeonfish](https://www.aquariumofpacific.org/onlinelearningcenter/species/palette_surgeonfish)
- [NOAA: coral growth forms](https://oceanservice.noaa.gov/education/tutorial_corals/coral03_growth.html)
- [Smithsonian: coral shape and structure](https://3d.si.edu/corals/shape-structure)

References inform recognition cues; no third-party photographs, textures, or meshes are redistributed.
