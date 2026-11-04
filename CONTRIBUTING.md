# Contributing

Read [development](docs/development.md), [architecture](docs/architecture.md) and current setup instructions; historical session notes can be stale.

Describe the user-visible problem, tank/species/equipment and reproduction steps. Supply sanitized minimal state when useful, never cookies/private profiles/credentials. Graphics reports benefit from browser/GPU details and screenshots/recordings.

Keep model rules in model modules and presentation in graphics/UI. Preserve meter units, shared boundaries, species limits and snapshot compatibility. Animal/decor features need the whole catalog/purchase/render/behavior/placement/save/removal path where relevant. A new name or mesh alone is incomplete.

Add tests protecting actual behavior and meaningful invariants, with visible controls/persistence covered where relevant. Avoid tests that merely repeat constants.

Before review:

- Run appropriate build/lint/unit/API/browser checks; major cross-module work should pass all.
- Rebuild/include bundle.js after source changes.
- Update docs and API contracts when behavior/payloads change.
- Exclude databases, cookies, environment files, caches, node_modules, backups and generated reports.
- Record completed results and limits; screenshots do not prove movement, durability or performance.
- Include lockfile/audit evidence for dependency changes; do not add unrelated services to the app tree.

Explain the concrete trigger, resulting behavior, validation and limits. Preserve references/attribution and verify asset permissions. Follow [SECURITY.md](SECURITY.md) for security findings.

No project license grant is declared. Do not add a license or assume redistribution permission on the owner's behalf. Dependencies retain their own terms.
