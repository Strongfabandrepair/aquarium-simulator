import * as THREE from 'three';
import { getSpecies, physicalSize } from '../model/SpeciesCatalog.js';
import {
    getTankSpec,
    containsPoint,
    constrainPoint,
    tankOutline,
    waterLevel
} from '../model/TankGeometry.js';
import { foodTarget } from './FishMotion.js';
const UP = new THREE.Vector3(0, 1, 0);
export function cleanupSeed(id) {
    let h = 2166136261;
    for (const c of String(id)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    h ^= h >>> 16;
    h = Math.imul(h, 0x7feb352d);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
}
function pose(mesh, point, sample, heading) {
    const up = (sample.normal || UP).clone().normalize();
    const forward = new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading));
    forward.addScaledVector(up, -forward.dot(up)).normalize();
    const side = new THREE.Vector3().crossVectors(forward, up).normalize();
    forward.crossVectors(up, side).normalize();
    mesh.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(forward, up, side)
    );
    mesh.position.set(point.x, sample.y, point.z);
    mesh.userData.habitatMode = sample.type;
}
function glassPose(mesh, motion, spec, length) {
    const outline = tankOutline(spec);
    const progress =
        ((motion.seed + motion.elapsed * length * 0.015) % 1) * outline.length;
    const index = Math.floor(progress),
        fraction = progress - index;
    const a = outline[index],
        b = outline[(index + 1) % outline.length];
    const edge = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    const raw = {
        x: a.x + (b.x - a.x) * fraction,
        y: 0,
        z: a.z + (b.z - a.z) * fraction
    };
    const point = constrainPoint(spec, raw, length * 0.6);
    const up = new THREE.Vector3(-edge.z, 0, edge.x);
    if (up.x * point.x + up.z * point.z > 0) up.negate();
    const forward = new THREE.Vector3(0, 1, 0),
        side = new THREE.Vector3().crossVectors(forward, up).normalize();
    mesh.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(forward, up, side)
    );
    point.y =
        -spec.height * 0.15 +
        Math.sin(motion.elapsed * 0.05 + motion.seed * 6.28) *
            spec.height *
            0.22;
    mesh.position.set(
        point.x,
        Math.min(waterLevel(spec) - length, point.y),
        point.z
    );
    mesh.userData.habitatMode = 'glass';
}
export function updateCleanupMotion(mesh, animal, delta, context = {}) {
    const dt = Math.max(
        0,
        Math.min(0.1, Number.isFinite(delta) ? delta : 1 / 60)
    );
    const spec = context.habitat?.spec || getTankSpec(context.state || {});
    const length = physicalSize(animal, 'cleanup'),
        margin = length * 0.6;
    const species = getSpecies(animal.templateId),
        habitat = context.habitat;
    const sample = (x, z) =>
        habitat?.sample(x, z) || {
            x,
            y: -spec.height / 2,
            z,
            normal: UP,
            type: 'sand'
        };
    let motion = mesh.userData.cleanupMotion;
    if (
        motion &&
        motion.habitat !== habitat &&
        !motion.glass &&
        Math.abs(sample(mesh.position.x, mesh.position.z).y - mesh.position.y) >
            length * 0.8
    )
        motion = null;
    if (!motion || motion.specKey !== JSON.stringify(spec)) {
        const seed = cleanupSeed(animal.id);
        let best = null,
            bestScore = -Infinity;
        for (let i = 0; i < 72; i++) {
            const x = (((seed + i * 0.61803398875) % 1) - 0.5) * spec.width;
            const z =
                (((seed * 7.13 + i * 0.41421356237) % 1) - 0.5) * spec.depth;
            if (!containsPoint(spec, x, z, margin)) continue;
            const s = sample(x, z);
            if (species.movement === 'burrow' && s.type === 'rock') continue;
            let score =
                species.movement === 'station' && s.type === 'rock' ? 1 : 0;
            for (const other of context.cleanupMeshes?.values() || []) {
                if (other !== mesh)
                    score -=
                        Math.max(
                            0,
                            length * 2 -
                                Math.hypot(
                                    x - other.position.x,
                                    z - other.position.z
                                )
                        ) * 20;
            }
            if (score > bestScore) {
                best = { x, y: s.y, z };
                bestScore = score;
            }
        }
        best ||= constrainPoint(
            spec,
            { x: 0, y: -spec.height / 2, z: 0 },
            margin
        );
        motion = {
            seed,
            habitat,
            glass:
                ['turboSnail', 'trochusSnail'].includes(animal.templateId) &&
                seed < 0.5,
            sand: species.movement === 'burrow',
            home: new THREE.Vector3(best.x, best.y, best.z),
            elapsed: 0,
            heading: seed * Math.PI * 2,
            specKey: JSON.stringify(spec)
        };
        mesh.userData.cleanupMotion = motion;
        pose(mesh, best, sample(best.x, best.z), motion.heading);
    }
    motion.habitat = habitat;
    if (motion.glass) {
        if (animal.alive !== false) motion.elapsed += dt;
        const before = mesh.position.clone();
        glassPose(mesh, motion, spec, length);
        mesh.userData.swimSpeed = dt
            ? before.distanceTo(mesh.position) / dt
            : 0;
        return;
    }
    if (animal.alive === false || dt === 0) return;
    motion.elapsed += dt;
    const night =
        (context.state?.hour ?? 12) >= 20 || (context.state?.hour ?? 12) < 7;
    const food = foodTarget(animal, context.state);
    if (food && motion.feedingKey !== context.state.feedingEvent.id) {
        motion.feedingKey = context.state.feedingEvent.id;
        motion.fedUntil = motion.elapsed + 45;
    }
    const buried =
        species.movement === 'burrow' &&
        context.state?.equipment?.substrate &&
        motion.elapsed >= (motion.fedUntil || 0);
    // Animator operates in model space; burrow depth scales with the entire animal.
    mesh.userData.burrowDepth = buried ? 0.1 : 0;
    const range = length * (species.movement === 'station' ? 2 : 8);
    const a = motion.elapsed * 0.16 + motion.seed * 6.283;
    const target = food
        ? new THREE.Vector3(food.x, 0, food.z)
        : motion.home
              .clone()
              .add(
                  new THREE.Vector3(
                      Math.sin(a) * range,
                      0,
                      Math.cos(a * 0.73) * range * 0.65
                  )
              );
    const direction = target.sub(mesh.position);
    direction.y = 0;
    if (direction.lengthSq() > 0.000001) direction.normalize();
    for (const other of context.cleanupMeshes?.values() || []) {
        if (other === mesh) continue;
        const away = mesh.position.clone().sub(other.position);
        away.y = 0;
        const d = away.length(),
            radius = length + (other.userData.physicalLengthM || length);
        if (d < radius && d > 0.00001)
            direction.addScaledVector(away, ((radius - d) * 8) / d);
    }
    direction.clampLength(0, 1);
    const active = buried
        ? 0.08
        : species.movement === 'nocturnal' && !night
          ? 0.2
          : 1;
    const speed =
        length *
        (animal.templateId.includes('Snail') ? 0.12 : 0.5) *
        (food ? 1.6 : 1);
    const before = mesh.position.clone();
    const point = constrainPoint(
        spec,
        before.clone().addScaledVector(direction, speed * active * dt),
        margin
    );
    let s;
    const probe = motion.probe;
    if (
        !probe ||
        Math.hypot(point.x - probe.x, point.z - probe.z) > length * 0.25 ||
        motion.probeHabitat !== habitat
    ) {
        s = sample(point.x, point.z);
        motion.probe = { ...s, x: point.x, z: point.z };
        motion.probeHabitat = habitat;
    } else {
        const n = probe.normal || UP;
        s = {
            ...probe,
            y:
                probe.y -
                ((point.x - probe.x) * n.x + (point.z - probe.z) * n.z) /
                    Math.max(0.15, n.y)
        };
    }
    if (
        (species.movement === 'burrow' && s.type === 'rock') ||
        Math.abs(s.y - before.y) > length * 0.8
    ) {
        motion.home.copy(before);
        motion.seed = (motion.seed + 0.381966) % 1;
    } else {
        if (direction.lengthSq() > 0.00001)
            motion.heading = Math.atan2(-direction.z, direction.x);
        pose(mesh, point, s, motion.heading);
    }
    mesh.userData.swimSpeed = before.distanceTo(mesh.position) / dt;
    mesh.userData.behavior = food ? 'feeding' : species.movement;
}
