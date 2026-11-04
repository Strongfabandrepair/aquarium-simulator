import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = resolve(
    process.env.REEFSIM_DB || resolve(root, 'data/reefsim.sqlite')
);
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(
    'PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL)'
);
const get = db.prepare('SELECT revision,payload FROM collections WHERE id=?');
const insert = db.prepare('INSERT INTO collections VALUES (?,0,?)');
const update = db.prepare(
    'UPDATE collections SET revision=revision+1,payload=? WHERE id=? AND revision=?'
);
const port = Number(process.env.PORT || 8766);
const json = (res, status, value) => {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(value));
};
const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};
function safeTree(value) {
    const stack = [[value, 0]];
    while (stack.length) {
        const [item, depth] = stack.pop();
        if (depth > 64) return false;
        if (!item || typeof item !== 'object') continue;
        for (const [key, child] of Object.entries(item)) {
            if (['__proto__', 'constructor', 'prototype'].includes(key))
                return false;
            stack.push([child, depth + 1]);
        }
    }
    return true;
}
function valid(value) {
    return (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        safeTree(value) &&
        Number.isSafeInteger(value.revision) &&
        value.revision >= 0 &&
        typeof value.active === 'string' &&
        value.active.length <= 100 &&
        value.profiles &&
        typeof value.profiles === 'object' &&
        !Array.isArray(value.profiles) &&
        Object.keys(value.profiles).length <= 100 &&
        Object.entries(value.profiles).every(
            ([name, snapshot]) =>
                name.length > 0 &&
                name.length <= 100 &&
                !['__proto__', 'constructor', 'prototype'].includes(name) &&
                snapshot &&
                typeof snapshot === 'object' &&
                !Array.isArray(snapshot)
        )
    );
}
const server = http.createServer(async (req, res) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
        'Content-Security-Policy',
        "frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
    );
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
        if (req.headers['sec-fetch-site'] === 'cross-site')
            return json(res, 403, { error: 'Cross-site request denied' });
        const expected = new Set([
            `127.0.0.1:${port}`,
            `localhost:${port}`,
            `[::1]:${port}`
        ]);
        if (!expected.has(req.headers.host))
            return json(res, 403, { error: 'Local host required' });
        if (
            req.headers.origin &&
            req.headers.origin !== `http://${req.headers.host}`
        )
            return json(res, 403, { error: 'Same origin required' });
        const path = new URL(req.url, `http://${req.headers.host}`).pathname;
        if (path === '/api/profiles') {
            let id = /(?:^|;\s*)reefSimIdentity=([a-f0-9]{64})(?:;|$)/.exec(
                req.headers.cookie || ''
            )?.[1];
            let row = id && get.get(id);
            if (!row && req.method === 'GET') {
                id = randomBytes(32).toString('hex');
                insert.run(
                    id,
                    JSON.stringify({ profiles: {}, active: 'Guest' })
                );
                row = get.get(id);
                res.setHeader(
                    'Set-Cookie',
                    `reefSimIdentity=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=315360000`
                );
            }
            if (!row)
                return json(res, 403, {
                    error: 'Initialize browser session first'
                });
            if (req.method === 'GET')
                return json(res, 200, {
                    ...JSON.parse(row.payload),
                    revision: row.revision
                });
            if (req.method !== 'PUT')
                return json(res, 405, { error: 'Method not allowed' });
            if (
                !String(req.headers['content-type']).startsWith(
                    'application/json'
                )
            )
                return json(res, 400, { error: 'JSON content type required' });
            let bytes = 0,
                parts = [];
            for await (const part of req) {
                bytes += part.length;
                if (bytes > 5 * 1024 * 1024)
                    return json(res, 413, { error: 'Collection too large' });
                parts.push(part);
            }
            let value;
            try {
                value = JSON.parse(Buffer.concat(parts).toString());
            } catch {
                return json(res, 400, { error: 'Invalid JSON' });
            }
            if (!valid(value))
                return json(res, 400, { error: 'Invalid profile collection' });
            const changed = update.run(
                JSON.stringify({
                    profiles: value.profiles,
                    active: value.active
                }),
                id,
                value.revision
            );
            if (!changed.changes)
                return json(res, 409, {
                    error: 'Profile collection changed in another tab. Reload before saving.'
                });
            return json(res, 200, { ...value, revision: value.revision + 1 });
        }
        if (req.method !== 'GET' && req.method !== 'HEAD')
            return json(res, 405, { error: 'Method not allowed' });
        // Serve only application assets; never SQLite, dependencies, hidden directories or source-control data.
        const decoded = decodeURIComponent(path),
            relative = decoded === '/' ? 'index.html' : decoded.slice(1);
        if (
            !['index.html', 'bundle.js', 'styles.css', 'favicon.ico'].includes(
                relative
            ) &&
            !/^(assets|js)\/[a-zA-Z0-9_./-]+$/.test(relative)
        )
            return json(res, 404, { error: 'Not found' });
        if (relative.split('/').some((p) => p === '..' || p.startsWith('.')))
            return json(res, 404, { error: 'Not found' });
        const file = realpathSync(resolve(root, relative));
        if (!file.startsWith(root + sep) || !statSync(file).isFile())
            return json(res, 404, { error: 'Not found' });
        res.writeHead(200, {
            'Content-Type': mime[extname(file)] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff'
        });
        res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
    } catch (error) {
        if (!res.headersSent)
            json(res, error.code === 'ENOENT' ? 404 : 500, {
                error:
                    error.code === 'ENOENT'
                        ? 'Not found'
                        : 'Persistence service error'
            });
        else res.end();
    }
});
server.listen(port, '127.0.0.1', () =>
    console.log(`ReefSim: http://127.0.0.1:${port}`)
);
function close() {
    server.close(() => {
        db.close();
        process.exit(0);
    });
}
process.on('SIGTERM', close);
process.on('SIGINT', close);
