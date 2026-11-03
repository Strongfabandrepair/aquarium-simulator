# Observing a practice reef

ReefSim now animates wildlife between chemistry ticks and places colonies against the rendered aquascape. Pausing freezes animal travel and local animation. The 1x/5x/20x controls accelerate husbandry time; swimming stays at an observable pace. A reloaded tank preserves livestock and colony placement but restarts animal animation paths.

## What to observe

| Animal | Display behavior | Planning lesson |
| --- | --- | --- |
| Clownfish | Small station-keeping excursions | Leave room for a territory; an anemone is not required. |
| Royal gramma | Hovers close to rock ledges | Provide sheltered rockwork and retreat space. |
| Firefish | Hovers near shelter | Provide retreats and a secure lid in a real tank. |
| Yellow and blue hippo tangs | Broad cruising paths | Open swimming space matters as well as total water volume. |
| Banggai cardinal | Slow hovering | Ensure deliberate feeders can obtain suitable food. |
| Tailspot blenny | Rests on measured ledges, then makes short hops | Provide perches, shelter and grazing surfaces. |
| Mandarin dragonet | Slow foraging near surfaces | A functioning nitrogen cycle alone does not supply a sustainable copepod population. |
| Six-line wrasse | Faster reef weaving | Activity and territorial compatibility need consideration before purchase. |
| Flame angel | Moves around reef surfaces | Observe coral interactions; reef safety varies. |
| Turbo snail | Glides on rock or side glass | Grazer; needs algae and secure coral mounts. |
| Nassarius snail | Sand scavenging, partial burial and feeding emergence | Not an algae eater; requires appropriate food and substrate. |
| Hermit crab | Walks and picks around sand and rock | Supply suitable spare shells; watch interactions with snails. |
| Emerald crab | Forages around rock | Provide appropriate food and monitor tankmates. |
| Cleaner shrimp | Small movements around a rock station | Cleaning behavior does not replace quarantine or treatment. |
| Peppermint shrimp | Sheltered foraging, slower in daylight | Provide cover; pest consumption is not guaranteed. |

Corals are stationary colonies. Soft tissue sways while the mounting base remains supported. Placement measures each colony, allows spacing, and prefers raised rock for SPS when space is available. Spreading soft corals favor separate low positions. LPS receive extra clearance. Legacy floating/overlapping positions are corrected when the tank is rendered.

## Applying the lesson to a real aquarium

Read the species care text shown in the Livestock store before stocking. Match diet, shelter, swimming room, light and flow to the animal. Observe feeding and behavior instead of assuming a purchase or a green status means every need is satisfied.

Automatic or manual placement is not a lighting, PAR, flow or stocking-density calculation. Tanks now use meter dimensions and shared shape-aware boundaries. Colonies retain physical size; crowded colonies need manual relocation rather than shrinking. See [PHYSICAL_SIMULATION.md](PHYSICAL_SIMULATION.md) for the current editor, growth and mortality model. Actual coral growth, shading, sweeper reach and aggression require additional space and observation. The app does not yet simulate disease transmission, quarantine outcomes, a living copepod food web, reproduction, every territorial interaction or individual-level invertebrate health (cleanup health is modeled per cohort). Its numerical cycle completion is a gameplay rule, not a real-tank elapsed-day guarantee.

## Implementation and verification

- `Habitat.js` measures actual rock and sand surfaces, excluding equipment, and caches candidate perches by environment generation.
- `CoralPlacement.js` measures radial footprints and mount offsets, then assigns supported, separated positions when the population or environment changes.
- `FishMotion.js` uses continuous active time, species paths, speed limits, neighbor separation, cached terrain heights and measured coral obstacles.
- `CleanupMotion.js` distributes individuals using mixed identity seeds, local separation, surface contact/orientation and species-specific activity.
- Cleanup models have a single continuous shell for each snail/hermit. Hermits show two walking pairs plus claws; emerald crabs show four walking pairs plus claws; shrimp have five thoracic leg pairs, separate from antennae and swimmerets.

Run `npm run build`, `npm test`, `npm run lint`, and `npm run test:ui`. Unit cases cover frame-rate behavior, pause, terrain/colony avoidance, supported coral placement at each tank capacity, shell/leg anatomy, feeding emergence and cleanup diet. Browser tests exercise the complete populated reef, reload stability and a cleanup-only feeding flow; screenshots appear in `artifacts/`.

## References

- [Aquarium of the Pacific: mandarin goby](https://www.aquariumofpacific.org/onlinelearningcenter/species/mandarin_goby) — bottom-oriented habitat.
- [OATA: dragonets and mandarin fish](https://ornamentalfish.org/what-we-do/advice-information/care-sheets/caresheets-marine-fish/how-to-look-after-dragonets-mandarin-fish/) — natural prey and feeding needs.
- [National Aquarium: Banggai cardinalfish](https://aqua.org/explore/animals/banggai-cardinalfish) — shelter associations.
- [Quality Marine: tailspot blenny](https://www.qualitymarine.com/quality-marine/fish/blennies/ecsenius/tail-spot-12570/) — perching, shelter and grazing.
- [Aquarium of the Pacific: Pacific cleaner shrimp](https://www.aquariumofpacific.org/onlinelearningcenter/species/pacific_cleaner_shrimp) — rock/coral cleaning stations.
- [Monterey Bay Aquarium: hermit crab](https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/hermit-crab) — visible walking legs, claws and shell-holding appendages.
- [Saltcorner: Nassarius arcularius](https://www.saltcorner.com/AquariumLibrary/browsespecies.php?CritterID=2809) — buried scavenging and carnivorous diet.
- [Tidal Gardens: hammer, torch and frogspawn troubleshooting](https://tidalgardens.com/articles/coral-care-articles/hammer-torch-frogspawn-troubleshooting.html) — spacing and coral husbandry.

These sources inform illustrative tendencies; their images and models are not redistributed.
