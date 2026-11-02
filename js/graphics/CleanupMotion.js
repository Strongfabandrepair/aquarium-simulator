import * as THREE from 'three';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const UP = new THREE.Vector3(0, 1, 0);
const fallback = {
    floorY: -1.15,
    bounds: { minX: -2.75, maxX: 2.75, minZ: -1.25, maxZ: 1.25 },
    sample: (x, z) => ({ x, y: -1.15, z, normal: UP, type: 'sand' })
};

// Avalanche the full cohort/individual identity, not the almost-identical FNV
// values of adjacent '1:0', '1:1' IDs which formerly stacked entire cohorts.
export function cleanupSeed(id) {
    let hash = 2166136261;
    for (const char of String(id))
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d);
    hash ^= hash >>> 15;
    hash = Math.imul(hash, 0x846ca68b);
    return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

function clearance(point, mesh, context) {
    let minimum = 10;
    for (const other of context.cleanupMeshes?.values() || []) {
        if (other === mesh || !other.userData.cleanupMotion) continue;
        minimum = Math.min(minimum, point.distanceTo(other.position) - 0.44);
    }
    for (const coral of context.coralMeshes?.values() || []) {
        const radius = coral.userData.placementRadius || 0.4;
        if (Math.abs(point.y - coral.position.y) < 0.5)
            minimum = Math.min(
                minimum,
                Math.hypot(
                    point.x - coral.position.x,
                    point.z - coral.position.z
                ) -
                    radius -
                    0.24
            );
    }
    return minimum;
}

function surfacePose(mesh, x, z, surface, heading) {
    const up = surface.normal.clone().normalize();
    const forward = new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading));
    forward.addScaledVector(up, -forward.dot(up)).normalize();
    if (forward.lengthSq() < 0.1) forward.set(0, 0, 1);
    const side = new THREE.Vector3().crossVectors(forward, up).normalize();
    forward.crossVectors(up, side).normalize();
    mesh.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(forward, up, side)
    );
    mesh.position.set(x, surface.y, z);
    mesh.userData.habitatMode = surface.type;
}

function initialize(mesh, animal, context) {
    const habitat = context.habitat || fallback;
    const seed = cleanupSeed(animal.id);
    const species = animal.templateId;
    const glass = species === 'turboSnail' && seed < 0.5;
    const sand = species === 'nassariusSnail';
    const b = habitat.bounds;
    let best,
        bestScore = -Infinity;
    for (let i = 0; i < 96; i++) {
        const u = (seed + i * 0.61803398875) % 1;
        const v = (seed * 7.13 + i * 0.41421356237) % 1;
        const x = b.minX + 0.23 + u * (b.maxX - b.minX - 0.46);
        const z = b.minZ + 0.23 + v * (b.maxZ - b.minZ - 0.46);
        const surface = habitat.sample(x, z);
        if (sand && surface.type === 'rock') continue;
        const point = new THREE.Vector3(x, surface.y, z);
        if (glass) point.set(seed < 0.25 ? -2.94 : 2.94, -0.85 + u * 1.6, z);
        const score =
            clearance(point, mesh, context) +
            (!sand && !glass && surface.type === 'rock' ? 2 : 0);
        if (score > bestScore) {
            best = { point, surface };
            bestScore = score;
        }
        if (score > (sand || glass ? 0.2 : 2.2)) break;
    }
    best ||= {
        point: new THREE.Vector3(-2.5, habitat.floorY, 1),
        surface: { y: habitat.floorY, normal: UP, type: 'sand' }
    };
    const motion = {
        habitat,
        seed,
        glass,
        sand,
        home: best.point.clone(),
        elapsed: 0,
        heading: seed * Math.PI * 2,
        surface: best.surface,
        lastSample: best.point.clone()
    };
    mesh.userData.cleanupMotion = motion;
    mesh.position.copy(best.point);
    if (glass) {
        const up = new THREE.Vector3(best.point.x < 0 ? 1 : -1, 0, 0);
        const forward = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(forward, up);
        mesh.quaternion.setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(forward, up, side)
        );
        mesh.userData.habitatMode = 'glass';
    } else
        surfacePose(
            mesh,
            best.point.x,
            best.point.z,
            best.surface,
            motion.heading
        );
    return motion;
}

export function updateCleanupMotion(mesh, animal, delta, context = {}) {
    const dt = clamp(Number.isFinite(delta) ? delta : 1 / 60, 0, 0.1);
    let motion = mesh.userData.cleanupMotion;
    const habitat = context.habitat || fallback;
    if (motion && motion.habitat !== habitat) {
        // Lights and equipment rebuild the environment without moving rock/sand.
        // Keep established territories and feeding timers when support survives.
        const sample = habitat.sample(mesh.position.x, mesh.position.z);
        const bounds = habitat.bounds;
        const supported = motion.glass
            ? mesh.position.z >= bounds.minZ && mesh.position.z <= bounds.maxZ
            : sample.type === motion.surface.type &&
              Math.abs(sample.y - mesh.position.y) < 0.025 &&
              mesh.position.x >= bounds.minX &&
              mesh.position.x <= bounds.maxX &&
              mesh.position.z >= bounds.minZ &&
              mesh.position.z <= bounds.maxZ;
        if (supported) {
            motion.habitat = habitat;
            motion.surface = sample;
            motion.lastSample.set(mesh.position.x, sample.y, mesh.position.z);
        } else motion = null;
    }
    if (!motion) motion = initialize(mesh, animal, context);
    if (animal.alive === false || dt === 0) return;
    motion.elapsed += dt;
    const species = animal.templateId;
    const shrimp = species.includes('Shrimp');
    const station = species === 'cleanerShrimp';
    const night = context.state?.hour >= 20 || context.state?.hour < 7;
    const speed = species.includes('Snail') ? 0.025 : shrimp ? 0.065 : 0.045;
    let active = species === 'peppermintShrimp' && !night ? 0.2 : 1;
    if (motion.sand) {
        const state = context.state;
        const feedingKey = state
            ? `${state.lastFed}:${state.feedingsToday}`
            : '';
        if (
            state &&
            state.lastFed === state.day &&
            state.feedingsToday > 0 &&
            motion.feedingKey !== feedingKey
        )
            motion.fedUntil = motion.elapsed + 45;
        motion.feedingKey = feedingKey;
        const fed = motion.elapsed < (motion.fedUntil || 0);
        // Leave the siphon visible while the shell/foot settle into substrate.
        // Only a new feeding event starts the emergence interval.
        const buried = Boolean(state?.equipment?.substrate) && !fed;
        mesh.userData.burrowDepth = buried ? 0.15 : 0;
        if (buried) active = 0.08;
    }
    const t =
        motion.elapsed * (station ? 0.3 : 0.08) + motion.seed * Math.PI * 2;
    const range = station ? 0.15 : shrimp ? 0.4 : motion.sand ? 0.65 : 0.55;
    const desired = motion.home.clone();
    if (motion.glass) {
        desired.y += Math.sin(t) * 0.32;
        desired.z += Math.cos(t * 0.73) * 0.28;
    } else {
        desired.x += Math.sin(t) * range;
        desired.z += Math.cos(t * 0.73) * range * 0.65;
    }
    const direction = desired.sub(mesh.position);
    if (!motion.glass) direction.y = 0;
    if (direction.length() > 0.01) direction.normalize();
    for (const other of context.cleanupMeshes?.values() || []) {
        if (other === mesh || !other.userData.cleanupMotion) continue;
        const away = mesh.position.clone().sub(other.position);
        const distance = away.length();
        if (distance < 0.5 && distance > 0.0001)
            direction.addScaledVector(away, ((0.5 - distance) * 8) / distance);
    }
    for (const coral of context.coralMeshes?.values() || []) {
        const away = mesh.position.clone().sub(coral.position);
        if (Math.abs(away.y) > 0.5) continue;
        away.y = 0;
        const distance = away.length();
        const radius = (coral.userData.placementRadius || 0.4) + 0.24;
        if (distance < radius && distance > 0.0001)
            direction.addScaledVector(
                away,
                ((radius - distance) * 10) / distance
            );
    }
    if (motion.glass) direction.x = 0;
    else direction.y = 0;
    direction.clampLength(0, 1);
    const before = mesh.position.clone();
    const next = before.clone().addScaledVector(direction, speed * active * dt);
    const b = motion.habitat.bounds;
    if (motion.glass) {
        next.y = clamp(next.y, -1.02, 1.12);
        next.z = clamp(next.z, b.minZ + 0.2, b.maxZ - 0.2);
        const up = new THREE.Vector3(next.x < 0 ? 1 : -1, 0, 0);
        const forward =
            direction.lengthSq() > 0.001
                ? direction.clone().normalize()
                : new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(forward, up).normalize();
        mesh.quaternion.setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(forward, up, side)
        );
        mesh.position.copy(next);
        mesh.userData.habitatMode = 'glass';
    } else {
        next.x = clamp(next.x, b.minX + 0.23, b.maxX - 0.23);
        next.z = clamp(next.z, b.minZ + 0.23, b.maxZ - 0.23);
        // Sampling terrain ahead avoids walking off ledges or into rock from sand.
        // Reuse the local contact plane between short terrain probes; dozens of
        // animals should not raycast the whole rockwork every display frame.
        let sample = motion.surface;
        if (
            Math.hypot(
                next.x - motion.lastSample.x,
                next.z - motion.lastSample.z
            ) >= 0.015
        ) {
            sample = motion.habitat.sample(next.x, next.z);
            motion.surface = sample;
            motion.lastSample.set(next.x, sample.y, next.z);
        } else {
            const n = sample.normal;
            sample = {
                ...sample,
                y:
                    motion.lastSample.y -
                    ((next.x - motion.lastSample.x) * n.x +
                        (next.z - motion.lastSample.z) * n.z) /
                        Math.max(0.15, n.y)
            };
        }
        if (
            (motion.sand && sample.type === 'rock') ||
            Math.abs(sample.y - before.y) > 0.12
        ) {
            motion.home.copy(before);
            motion.seed = (motion.seed + 0.381966) % 1;
        } else {
            if (direction.lengthSq() > 0.001)
                motion.heading = Math.atan2(-direction.z, direction.x);
            surfacePose(mesh, next.x, next.z, sample, motion.heading);
        }
    }
    mesh.userData.swimSpeed = before.distanceTo(mesh.position) / dt;
}
