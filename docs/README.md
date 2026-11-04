# Documentation index

These guides describe the current repository. Dated reports retain historical results rather than promising that every earlier feature description is current.

## Start here

- [User guide](user-guide.md): create and maintain a practice aquarium, place/resize objects, use backgrounds and recover profiles.
- [Architecture](architecture.md): module ownership, data flow, simulation clocks, units, placement and persistence.
- [Development](development.md): install/build, run tests, extend features and prepare a change.
- [Operations](operations.md): local server configuration, SQLite backup/restore and supported deployment boundary.
- [Contributing](../CONTRIBUTING.md): review requirements and regression evidence.
- [Security](../SECURITY.md): threat boundary, responsible reporting and remediation details.

## Detailed references

| Reference | Contents |
| --- | --- |
| [Physical simulation](../PHYSICAL_SIMULATION.md) | Tank geometry APIs, units, placement state and husbandry |
| [Decor and species](../DECOR_AND_SPECIES.md) | Current 37-entry catalog, ornaments, hosting and maturation |
| [Habitat guide](../HABITAT_GUIDE.md) | Behavior profiles, surface occupancy and biological references |
| [Wildlife rendering](../WILDLIFE.md) | Procedural meshes, textures, animation and visual validation |
| [Persistence/setup](../PERSISTENCE_AND_SETUP.md) | Migration, item sizing and separate OmniRoute installation history |
| [API contract](../server/openapi.yaml) | Same-origin profile collection service |
| [Smoke report](../SMOKE_TEST_REPORT.md) | Dated unit/API/browser results and verification limits |
| [Performance plan](../PERFORMANCE_PLAN.md) | Rendering work and historical optimization plans |

For older implementation history see [session notes](../SESSION.md) and [review notes](../REVIEW_NOTES.md). For commands, prefer the current development guide and package scripts. For actual biological husbandry, consult the cited species/habitat references and measure real conditions; simulation success is not a care guarantee.
