// Local cache remains available for static hosting/offline recovery. SQLite is authoritative when reachable.
let revision = 0,
    enabled = false,
    queue = Promise.resolve();
const key = 'reefSimProfiles',
    activeKey = 'reefSimActiveProfile',
    pendingKey = 'reefSimPendingSync';
function status(text) {
    const element = document.getElementById('saveStatus');
    if (element) element.textContent = text;
}
function localProfiles() {
    try {
        return JSON.parse(localStorage.getItem(key) || '{}') || {};
    } catch {
        return {};
    }
}
function payload() {
    return {
        profiles: localProfiles(),
        active: localStorage.getItem(activeKey) || 'Guest',
        revision
    };
}
async function write(value) {
    const response = await globalThis.fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...value, revision }),
        keepalive: false,
        signal: globalThis.AbortSignal.timeout(60000)
    });
    if (!response.ok)
        throw new Error(
            response.status === 409
                ? 'Conflict — local backup retained'
                : 'Database unavailable — local backup retained'
        );
    revision = (await response.json()).revision;
}
export async function initializePersistence() {
    try {
        const response = await globalThis.fetch('/api/profiles', {
            signal: globalThis.AbortSignal.timeout(2500)
        });
        if (!response.ok) return;
        const remote = await response.json();
        if (!remote.profiles || !Number.isSafeInteger(remote.revision)) return;
        revision = remote.revision;
        enabled = true;
        const local = localProfiles(),
            merged = { ...remote.profiles };
        const pending = Boolean(localStorage.getItem(pendingKey));
        const active = pending
            ? localStorage.getItem(activeKey) || remote.active
            : remote.profiles[remote.active]
              ? remote.active
              : localStorage.getItem(activeKey) || 'Guest';
        // Import only on first connection or after offline changes. Conflicts preserve both snapshots.
        if (
            !localStorage.getItem('reefSimMigrated') ||
            localStorage.getItem(pendingKey) ||
            (!Object.keys(remote.profiles).length && Object.keys(local).length)
        ) {
            for (const [name, snapshot] of Object.entries(local)) {
                if (!merged[name]) merged[name] = snapshot;
                else if (
                    JSON.stringify(merged[name]) !== JSON.stringify(snapshot)
                ) {
                    if (
                        pending &&
                        (snapshot.lastSaved || 0) >=
                            (merged[name].lastSaved || 0)
                    ) {
                        let baseRevision;
                        try {
                            baseRevision = JSON.parse(
                                localStorage.getItem(pendingKey)
                            ).baseRevision;
                        } catch {
                            /* Legacy pending marker. */
                        }
                        if (baseRevision !== remote.revision) {
                            let backup = `${name.slice(0, 70)} (server backup)`,
                                index = 2;
                            while (merged[backup])
                                backup = `${name.slice(0, 70)} (server backup ${index++})`;
                            merged[backup] = {
                                ...merged[name],
                                profileName: backup
                            };
                        }
                        merged[name] = snapshot;
                        continue;
                    }
                    let copy = `${name.slice(0, 70)} (local backup)`,
                        n = 2;
                    while (merged[copy])
                        copy = `${name.slice(0, 70)} (local backup ${n++})`;
                    merged[copy] = { ...snapshot, profileName: copy };
                }
            }
            await write({
                profiles: merged,
                active
            });
        }
        if (Object.keys(merged).length)
            localStorage.setItem(key, JSON.stringify(merged));
        else localStorage.removeItem(key);
        localStorage.setItem(activeKey, active);
        localStorage.setItem('reefSimMigrated', '1');
        localStorage.removeItem(pendingKey);
    } catch {
        enabled = false;
    }
}
export function schedulePersistence() {
    const marker = JSON.stringify({
        baseRevision: revision,
        token: `${Date.now()}-${Math.random()}`
    });
    localStorage.setItem(pendingKey, marker);
    if (!enabled) {
        status('Saved locally');
        return Promise.resolve(false);
    }
    status('Saving…');
    const value = payload();
    queue = queue.then(async () => {
        try {
            await write(value);
            if (localStorage.getItem(pendingKey) === marker)
                localStorage.removeItem(pendingKey);
            status('Saved');
            return true;
        } catch (error) {
            status(error.message);
            return false;
        }
    });
    return queue;
}
export function flushPersistence() {
    return queue;
}
export async function clearPersistence() {
    await queue;
    if (!enabled && localStorage.getItem('reefSimMigrated'))
        throw new Error('Database unavailable');
    if (enabled) {
        await write({ profiles: {}, active: 'Guest' });
    }
    localStorage.removeItem(key);
    localStorage.removeItem(activeKey);
    localStorage.removeItem(pendingKey);
}
