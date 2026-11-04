# Security policy and deployment boundary

ReefSim's Node server is a **local, single-computer application**. It binds only to `127.0.0.1`; the browser connects over HTTP on port 8766 by default. It has no internet-facing account, password, administrator role, or multi-user authorization system. Do not expose it through a public tunnel, port forwarding, or a reverse proxy as a hosted service without designing those controls first.

## Reporting a vulnerability

Use the repository's [Security page](https://github.com/Strongfabandrepair/aquarium-simulator/security). If GitHub offers **Report a vulnerability**, use that private reporting flow. If private reporting is unavailable, open an issue asking the maintainer for a private contact channel without posting an exploit, cookie, personal save, or database. No dedicated security email address or response-time guarantee is currently published.

Include the affected commit, Node/browser versions, reproduction steps with synthetic data, impact and suggested mitigation. The current `main` branch is the maintained codebase; old generated bundles and historical commits do not receive independent fixes.

## Protections in the current implementation

- The server checks the HTTP Host and Origin, rejects cross-site Fetch Metadata requests, and does not enable CORS. Cross-site requests cannot use another browser's profile collection through the normal web boundary.
- A cryptographically random 256-bit identity in an `HttpOnly`, `SameSite=Strict` cookie selects a browser's collection. The identity persists across server restarts. It is a bearer secret, not a user login. Cookies are deliberately not marked Secure because the supported local server uses HTTP.
- SQLite queries are parameterized. Writes require a matching revision, valid JSON, at most 100 named profiles, a body no larger than 5 MiB and nesting no deeper than 64 levels. Prototype-related keys are rejected recursively. Older browser snapshots also have these keys removed before object merging.
- Saved journal text, livestock names/icons/IDs, and other displayed saved text are HTML-encoded, including quoted attribute contexts. Knowledge percentages are converted to bounded numbers before use in style attributes. Profile names and notifications use encoding or text content.
- `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` prevent framing/clickjacking. The CSP also restricts base URLs and object embeds; it is **not** a complete script-source CSP. The current application still contains inline event handlers.
- Static serving is limited to application entry files and asset/source directories, with canonical path checks. Database files, `.git`, server code, dependency trees, test artifacts and environment files are not public routes. Browser gallery tests intercept their harness requests themselves.
- API responses are not cached. Database files are ignored by Git. Failed or conflicting saves retain local recovery copies and report their status instead of silently claiming durable success.

## Data protection and limits

The SQLite database, its write-ahead log and browser localStorage are unencrypted local files. Anyone with access to the same operating-system account, browser profile, development tools, identity cookie or database can access or alter saves. HttpOnly prevents reading the cookie from JavaScript; it does not protect against a fully compromised same-origin page or local machine. Keep OS/browser accounts and backups protected. Cookie scope follows the browser's hostname rules, not TCP port boundaries; avoid running untrusted software on the same localhost hostname.

The API bounds each collection/request but is not a public-service rate limiter or protection against a malicious local process exhausting disk space. Snapshot validation protects the persistence envelope and dangerous keys; it is not an exhaustive schema for every simulation field. Corrupted saves can still cause application errors. There is no payment processing, real-money livestock purchase, or external credential storage in the simulator.

Stop the server before copying the database for a simple backup. Copying only the main SQLite file during active WAL writes can omit recent transactions; use a proper SQLite backup procedure if the server must remain online. See [operations](docs/operations.md) for startup and recovery details.

## Verification

Run `npm audit`, `npm test`, `npm run test:api`, and `npm run test:ui`. The API suite exercises browser isolation, cross-origin/cross-site rejection, stale revisions, prototype/depth rejection, security headers, private-file exclusions and restart durability. Browser security tests check that persisted markup is rendered as text rather than executed. These are targeted regression checks, not a claim that every possible vulnerability has been eliminated.

The November 4, 2026 source review fixed stored HTML injection through saved journal/livestock fields and unsafe prototype-key merging from snapshots, and added the request/framing controls above. Dependency audit results and broader release validation are recorded in the smoke-test report; rerun audit against the current registry because advisory information changes.
