// Visual locomotion runs in real seconds, independently of chemistry time steps.
// These are illustrative habitat tendencies, not a compatibility/territory model.
import { Box3 } from 'three';
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const finite = (n, fallback) => (Number.isFinite(n) ? n : fallback);
const smooth = (n) => n * n * (3 - 2 * n);

export function fishSeed(id) {
    let hash = 2166136261;
    for (const char of String(id ?? 0))
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    // Avalanche nearby numeric IDs: cohort neighbors must not share a trajectory.
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d);
    hash ^= hash >>> 15;
    return (hash >>> 0) / 4294967296;
}

const heightCaches = new WeakMap();
const shelterCaches = new WeakMap();
const coralBounds = new WeakMap();

function shelterAnchor(habitat, seed) {
    if (!habitat?.rockPoints?.length) return null;
    let edges = shelterCaches.get(habitat);
    if (!edges) {
        // Front-facing ledges provide a visible retreat beside the actual reef.
        const points = [...habitat.rockPoints].sort((a, b) => b.z - a.z);
        edges = points.slice(0, Math.max(1, Math.ceil(points.length / 3)));
        shelterCaches.set(habitat, edges);
    }
    return edges[Math.floor(seed * edges.length)];
}

function coralObstacle(mesh) {
    const signature = `${mesh.position.x}:${mesh.position.y}:${mesh.position.z}:${mesh.scale.x}:${mesh.scale.y}:${mesh.scale.z}`;
    let cached = coralBounds.get(mesh);
    if (cached?.signature === signature) return cached;
    mesh.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(mesh);
    if (bounds.isEmpty()) return null;
    cached = {
        signature,
        x: (bounds.min.x + bounds.max.x) / 2,
        z: (bounds.min.z + bounds.max.z) / 2,
        minY: bounds.min.y - 0.12,
        maxY: bounds.max.y + 0.15,
        radius:
            Math.max(
                (bounds.max.x - bounds.min.x) / 2,
                (bounds.max.z - bounds.min.z) / 2
            ) + 0.18
    };
    coralBounds.set(mesh, cached);
    return cached;
}

// Lazy, bounded heightfield avoids raycasting every animated fish every frame.
export function habitatHeight(habitat, x, z) {
    if (!habitat?.sample) return -1.32;
    let cache = heightCaches.get(habitat);
    if (!cache) {
        cache = new Map();
        heightCaches.set(habitat, cache);
    }
    const cell = 0.1;
    const ix = Math.floor(clamp(finite(x, 0), -2.4, 2.4) / cell);
    const iz = Math.floor(clamp(finite(z, 0), -1.2, 1.2) / cell);
    let highest = finite(habitat.floorY, -1.32);
    for (const gx of [ix, ix + 1]) {
        for (const gz of [iz, iz + 1]) {
            const key = `${gx}:${gz}`;
            if (!cache.has(key))
                cache.set(
                    key,
                    finite(habitat.sample(gx * cell, gz * cell)?.y, highest)
                );
            highest = Math.max(highest, cache.get(key));
        }
    }
    return highest;
}

export function fishTarget(
    fish,
    seconds,
    surfaceHeight = () => -1.32,
    habitat = null
) {
    const species = String(fish.templateId).toLowerCase();
    const seed = fishSeed(fish.id);
    const phase = seed * Math.PI * 2;
    const t = Math.max(0, finite(seconds, 0));
    const homeX = (seed - 0.5) * 3.1;
    const homeZ = 0.42 + Math.sin(phase * 3) * 0.38;
    let x, y, z, speed, behavior;
    if (species === 'yellowtang' || species === 'bluehippotang') {
        const angle = t * 0.28 + phase;
        x = Math.sin(angle) * 2.1;
        z = Math.cos(angle) * 0.9;
        y = 0.38 + Math.sin(angle * 1.6) * 0.23;
        speed = 0.72;
        behavior = 'cruising';
    } else if (species === 'sixlinewrasse' || species === 'flameangel') {
        const angle = t * (species === 'sixlinewrasse' ? 0.48 : 0.26) + phase;
        x = Math.sin(angle) * 1.85;
        z = Math.sin(angle * 0.73 + phase) * 0.82;
        y = -0.35 + Math.cos(angle * 1.3) * 0.2;
        speed = species === 'sixlinewrasse' ? 0.85 : 0.5;
        behavior = species === 'sixlinewrasse' ? 'darting' : 'grazing';
    } else if (species === 'mandaringoby') {
        const angle = t * 0.11 + phase;
        x = Math.sin(angle) * 1.75;
        z = 0.55 + Math.sin(angle * 1.4) * 0.37;
        y = -2;
        speed = 0.22;
        behavior = 'foraging';
    } else if (species === 'tailspotblenny') {
        // Remain on a perch, then make a short hop to a neighboring grazing spot.
        const cycle = t / 9 + seed * 4;
        const step = Math.floor(cycle);
        const progress = smooth(clamp(((cycle % 1) - 0.7) / 0.3, 0, 1));
        const a = phase + step * 0.9;
        const b = a + 0.9;
        x =
            homeX * 0.7 +
            0.4 * (Math.sin(a) * (1 - progress) + Math.sin(b) * progress);
        z =
            0.12 +
            0.3 * (Math.cos(a) * (1 - progress) + Math.cos(b) * progress);
        // Prefer real rock ledges when the aquascape supplies them.
        const points = habitat?.rockPoints;
        if (points?.length) {
            const anchor = points[Math.floor(seed * points.length)];
            let neighbor = anchor;
            let best = Infinity;
            for (const point of points) {
                const distance = Math.hypot(
                    point.x - anchor.x,
                    point.z - anchor.z
                );
                if (distance > 0.25 && distance < best) {
                    best = distance;
                    neighbor = point;
                }
            }
            const fraction = step % 2 ? 1 - progress : progress;
            x = anchor.x + (neighbor.x - anchor.x) * fraction;
            z = anchor.z + (neighbor.z - anchor.z) * fraction;
        }
        y = -2;
        speed = progress > 0 ? 0.5 : 0.16;
        behavior = progress > 0 ? 'grazing' : 'perching';
    } else {
        // Hovering species still make station-keeping excursions around shelter.
        const radius =
            species === 'clownfish'
                ? 0.36
                : species === 'banggaicardinal'
                  ? 0.22
                  : 0.3;
        const angle = t * 0.55 + phase;
        x = homeX + Math.sin(angle) * radius;
        z = homeZ + Math.cos(angle * 0.8) * radius * 0.55;
        y =
            species === 'firefishgoby'
                ? -0.62
                : species === 'royalgramma'
                  ? -0.48
                  : -0.05;
        y += Math.sin(angle * 0.75) * 0.08;
        if (species === 'royalgramma' || species === 'firefishgoby') {
            const anchor = shelterAnchor(habitat, seed);
            if (anchor) {
                x = anchor.x + Math.sin(angle) * 0.2;
                z = anchor.z + 0.18 + Math.cos(angle * 0.8) * 0.12;
                y =
                    anchor.y +
                    (species === 'firefishgoby' ? 0.36 : 0.22) +
                    Math.sin(angle * 0.75) * 0.06;
            }
        }
        speed = species === 'banggaicardinal' ? 0.18 : 0.3;
        behavior = 'hovering';
    }
    x = clamp(x, -2.3, 2.3);
    z = clamp(z, -1.08, 1.08);
    const bottomFish =
        species === 'tailspotblenny' || species === 'mandaringoby';
    const clearance = bottomFish ? 0.1 : 0.26;
    const floor = finite(surfaceHeight(x, z), -1.32);
    y = Math.max(y, floor + clearance);
    return { x, y: clamp(y, -1.22, 1.08), z, speed, behavior, clearance };
}

export function advanceFishMotion(mesh, fish, seconds, delta, context = {}) {
    const dt = clamp(finite(delta, 0), 0, 0.1);
    if (!dt || fish.alive === false) return;
    const surfaceHeight =
        context.surfaceHeight ||
        ((x, z) => habitatHeight(context.habitat, x, z));
    const target = fishTarget(fish, seconds, surfaceHeight, context.habitat);
    const position = mesh.position;
    let dx = target.x - position.x;
    let dy = target.y - position.y;
    let dz = target.z - position.z;
    // Avoid overlapping bodies without forcing loosely associated fish into schools.
    for (const other of context.fishMeshes?.values() || []) {
        if (other === mesh || other.userData.dead) continue;
        let sx = position.x - other.position.x;
        const sy = position.y - other.position.y;
        let sz = position.z - other.position.z;
        let distance = Math.hypot(sx, sy, sz);
        if (distance < 0.65) {
            if (distance < 0.001) {
                const phase = fishSeed(fish.id) * Math.PI * 2;
                sx = Math.cos(phase) * 0.01;
                sz = Math.sin(phase) * 0.01;
                distance = 0.01;
            }
            const repulsion = ((0.65 - distance) * 2.2) / distance;
            dx += sx * repulsion;
            dy += sy * repulsion;
            dz += sz * repulsion;
        }
    }
    const obstacles = [];
    for (const colony of context.coralMeshes?.values() || []) {
        const obstacle = coralObstacle(colony);
        if (
            !obstacle ||
            position.y < obstacle.minY ||
            position.y > obstacle.maxY
        )
            continue;
        obstacles.push(obstacle);
        const sx = position.x - obstacle.x,
            sz = position.z - obstacle.z;
        const distance = Math.hypot(sx, sz);
        if (distance > 0.0001 && distance < obstacle.radius + 0.25) {
            const nx = sx / distance,
                nz = sz / distance;
            const inward = Math.min(0, dx * nx + dz * nz);
            dx -= inward * nx;
            dz -= inward * nz;
            const turn = fishSeed(fish.id) > 0.5 ? 1 : -1;
            const steering = (obstacle.radius + 0.25 - distance) * 1.8;
            dx += (nx - nz * turn) * steering;
            dz += (nz + nx * turn) * steering;
        }
    }
    const distance = Math.hypot(dx, dy, dz);
    const step = Math.min(
        distance * (1 - Math.exp(-2.4 * dt)),
        target.speed * dt
    );
    if (distance > 0.00001) {
        position.x = clamp(position.x + (dx / distance) * step, -2.35, 2.35);
        position.y = clamp(position.y + (dy / distance) * step, -1.22, 1.08);
        position.z = clamp(position.z + (dz / distance) * step, -1.1, 1.1);
    }
    // Resolve penetration sideways using measured colony bounds, preserving the
    // animal's depth instead of lifting all species above the entire coral bed.
    for (const obstacle of obstacles) {
        if (position.y < obstacle.minY || position.y > obstacle.maxY) continue;
        const sx = position.x - obstacle.x,
            sz = position.z - obstacle.z;
        if (Math.hypot(sx, sz) >= obstacle.radius) continue;
        let best = null;
        const angle = Math.atan2(sz, sx);
        for (let i = 0; i < 16; i++) {
            const a = angle + (i * Math.PI) / 8;
            const x = obstacle.x + Math.cos(a) * obstacle.radius;
            const z = obstacle.z + Math.sin(a) * obstacle.radius;
            if (Math.abs(x) > 2.35 || Math.abs(z) > 1.1) continue;
            const distance = Math.hypot(position.x - x, position.z - z);
            if (!best || distance < best.distance) best = { x, z, distance };
        }
        if (best) {
            position.x = best.x;
            position.z = best.z;
        }
    }
    // Query the actual rendered substrate/rock at the new position, not a guessed hill.
    position.y = Math.max(
        position.y,
        Math.min(
            1.08,
            finite(surfaceHeight(position.x, position.z), -1.32) +
                target.clearance
        )
    );
    mesh.userData.behavior = target.behavior;
    mesh.userData.motionSpeed = step / dt;
}
