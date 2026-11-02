# Wildlife rendering

The catalog has dedicated models for all 26 entries: ten fish, ten coral types, and six cleanup animals. These are procedural, stylized anatomical models intended for real-time aquarium viewing, not scanned specimens.

## Fish

`FishModels.js` builds tapered, UV-mapped bodies, curved fin outlines with fin rays, paired pectoral/pelvic fins, eyes, mouths, gills, and species details. `FishTextures.js` generates and caches markings in sRGB: clownfish white/black bars, royal gramma purple/yellow division, firefish red tail gradient, yellow tang yellow body, blue tang palette marking, cardinal black bars/spots, blenny tail eyespot, wrasse stripes, mandarin reticulations, and flame angel bars/blue fin accents.

Body deformation uses a traveling vertex-shader wave; the tail and fins follow an integrated phase. Tail amplitude follows travel speed. Root motion uses elapsed-time smoothing, stable hovering headings, pitch and banking. Death stops the local swim rig. Species proportions and swim frequencies vary.

## Corals and cleanup animals

`CoralModels.js` differentiates oral disks, eight-tentacle star polyps, feathery pulsing xenia, hammer-shaped/torch/clustered frogspawn tips, branching acropora/birdsnest, and layered montipora plates. Geometry provides polyp and corallite detail. Soft structures sway; xenia pulses; health affects extension.

`InvertebrateModels.js` provides coiled shells, snail feet and siphons, articulated crab legs/claws, and segmented shrimp with antennae. Legs, feelers and claws animate independently. Cleanup cohorts now have purchase controls and one visible model per individual. Their deterministic foraging lanes stay near the foreground sand bed.

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
