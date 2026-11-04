import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

test('SQLite survives restart, isolates browsers, validates writes and protects private files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'reefsim-api-'));
    const port = 45000 + Math.floor(Math.random() * 15000),
        url = `http://127.0.0.1:${port}`;
    let child;
    const start = async () => {
        child = spawn(process.execPath, ['server/index.js'], {
            env: {
                ...process.env,
                PORT: String(port),
                REEFSIM_DB: join(directory, 'save.sqlite')
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });
        await Promise.race([
            once(child.stdout, 'data'),
            once(child, 'exit').then(() => {
                throw new Error('Server exited before ready');
            }),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error('Server startup timeout')),
                    10000
                ).unref()
            )
        ]);
    };
    const stop = async () => {
        const exited = once(child, 'exit');
        child.kill();
        await exited;
    };
    try {
        await start();
        const first = await fetch(`${url}/api/profiles`),
            cookie = first.headers.get('set-cookie').split(';')[0];
        assert.equal(first.status, 200);
        assert.equal(first.headers.get('x-frame-options'), 'DENY');
        assert.match(
            first.headers.get('content-security-policy'),
            /frame-ancestors 'none'/
        );
        const initial = await first.json();
        assert.equal(initial.revision, 0);
        const snapshot = {
            profiles: {
                Reef: {
                    profileName: 'Reef',
                    started: true,
                    money: 1234,
                    equipment: { liveRock: 3 },
                    placedItems: [
                        {
                            id: 'ship',
                            kind: 'decoration',
                            templateId: 'shipwreck'
                        }
                    ],
                    settings: { theme: 'night' }
                }
            },
            active: 'Reef',
            revision: 0
        };
        const put = (value, extra = {}) =>
            fetch(`${url}/api/profiles`, {
                method: 'PUT',
                headers: {
                    cookie,
                    'content-type': 'application/json',
                    ...extra
                },
                body: JSON.stringify(value)
            });
        assert.equal((await put(snapshot)).status, 200);
        assert.equal((await put(snapshot)).status, 409);
        assert.equal(
            (await put({ ...snapshot, revision: 1, profiles: [] })).status,
            400
        );
        assert.equal(
            (
                await put(
                    { ...snapshot, revision: 1 },
                    { origin: 'https://evil.example' }
                )
            ).status,
            403
        );
        assert.deepEqual(
            (await (await fetch(`${url}/api/profiles`)).json()).profiles,
            {}
        );
        assert.equal((await fetch(`${url}/data/reefsim.sqlite`)).status, 404);
        assert.equal((await fetch(`${url}/.git/config`)).status, 404);
        assert.equal((await fetch(`${url}/server/index.js`)).status, 404);
        assert.equal(
            (
                await put(
                    { ...snapshot, revision: 1 },
                    { 'sec-fetch-site': 'cross-site' }
                )
            ).status,
            403
        );
        const poisoned = JSON.parse(
            '{"revision":1,"active":"Reef","profiles":{"Reef":{"equipment":{"__proto__":{"heater":true}}}}}'
        );
        assert.equal((await put(poisoned)).status, 400);
        let nested = {};
        for (let i = 0; i < 70; i++) nested = { child: nested };
        assert.equal(
            (
                await put({
                    ...snapshot,
                    revision: 1,
                    profiles: { Reef: nested }
                })
            ).status,
            400
        );
        await stop();
        await start();
        const restored = await (
            await fetch(`${url}/api/profiles`, { headers: { cookie } })
        ).json();
        assert.deepEqual(restored.profiles, snapshot.profiles);
        assert.equal(restored.active, 'Reef');
        assert.equal(restored.revision, 1);
    } finally {
        if (child && child.exitCode === null) await stop();
        await rm(directory, { recursive: true, force: true });
    }
});
