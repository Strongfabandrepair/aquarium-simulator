import { Box3, Vector3 } from 'three';
import { getSpecies, physicalSize } from '../model/SpeciesCatalog.js';
import {
    getTankSpec,
    constrainPoint,
    waterLevel,
    containsPoint
} from '../model/TankGeometry.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function fishSeed(id) {
    let hash = 2166136261;
    for (const char of String(id ?? 0))
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d);
    hash ^= hash >>> 15;
    return (hash >>> 0) / 4294967296;
}
const heightCaches = new WeakMap();
export function habitatHeight(habitat, x, z) {
    if (!habitat?.sample) return habitat?.floorY ?? -getTankSpec({}).height / 2;
    let cache = heightCaches.get(habitat);
    if (!cache) {
        cache = new Map();
        heightCaches.set(habitat, cache);
    }
    const cell = 0.012,
        ix = Math.round(x / cell),
        iz = Math.round(z / cell),
        key = ix + ':' + iz;
    if (!cache.has(key)) {
        if (cache.size > 8192) cache.clear();
        cache.set(
            key,
            habitat.sample(ix * cell, iz * cell)?.y ?? habitat.floorY
        );
    }
    return cache.get(key);
}
export function foodTarget(animal, state) {
    const event = state?.feedingEvent;
    if (!event?.position) return null;
    const now =
        (state.day || 0) * 24 + (state.hour || 0) + (state.minute || 0) / 60;
    const age = now - event.timeHours,
        diet = getSpecies(animal.templateId).diet;
    if (age < 0 || age > 2 || event.remaining === 0) return null;
    return event.diet === diet ||
        diet === 'mixed' ||
        (event.diet === 'mixed' && diet !== 'copepods')
        ? event.position
        : null;
}
export function fishTarget(
    fish,
    seconds,
    surfaceHeight,
    habitat = null,
    state = null
) {
    const spec = habitat?.spec || getTankSpec(state || {}),
        floor = habitat?.floorY ?? -spec.height / 2;
    const sample = surfaceHeight || (() => floor),
        p = getSpecies(fish.templateId),
        length = physicalSize(fish);
    const margin = Math.min(
        length * 0.55,
        Math.min(spec.width, spec.depth, spec.height) * 0.22
    );
    const seed = fishSeed(fish.id),
        phase = seed * Math.PI * 2,
        t = Math.max(0, seconds || 0),
        a = t * 0.26 + phase;
    const anchor =
        habitat?.rockPoints?.[Math.floor(seed * habitat.rockPoints.length)];
    let x = Math.sin(a) * (spec.width * 0.42 - margin),
        z = Math.cos(a * 0.83) * (spec.depth * 0.38 - margin);
    let y = floor + spec.height * 0.62 + Math.sin(a * 1.3) * spec.height * 0.1,
        behavior = p.movement,
        speed = length * 1.2;
    if (
        ['territorial', 'cave', 'hover', 'perch', 'bottom'].includes(p.movement)
    ) {
        const range = length * (p.movement === 'territorial' ? 2 : 1.2);
        x =
            (anchor?.x ?? (seed - 0.5) * spec.width * 0.6) +
            Math.sin(a) * range;
        z = (anchor?.z ?? spec.depth * 0.12) + Math.cos(a * 0.8) * range * 0.6;
        y = (anchor?.y ?? floor) + length * (p.movement === 'hover' ? 2 : 0.65);
        speed = length * 0.55;
        if (['bottom', 'perch'].includes(p.movement)) {
            y = sample(x, z) + length * 0.25;
            if (p.movement === 'perch') {
                const cycle = t / 9 + seed * 4,
                    step = Math.floor(cycle),
                    progress = Math.max(0, ((cycle % 1) - 0.7) / 0.3);
                const f = progress * progress * (3 - 2 * progress);
                const rocks = habitat?.rockPoints;
                const home = anchor || {
                    x: (seed - 0.5) * spec.width * 0.6,
                    z: spec.depth * 0.12
                };
                const next =
                    rocks?.length > 1
                        ? rocks[
                              (Math.floor(seed * rocks.length) + 1) %
                                  rocks.length
                          ]
                        : { x: home.x + length * 2, z: home.z };
                const fraction = step % 2 ? 1 - f : f;
                x = home.x + (next.x - home.x) * fraction;
                z = home.z + (next.z - home.z) * fraction;
                y = sample(x, z) + length * 0.3;
                if (progress === 0) {
                    speed *= 0.12;
                    behavior = 'perching';
                } else behavior = 'grazing';
            }
        }
    } else if (p.movement === 'weave') {
        z = Math.sin(a * 1.8) * spec.depth * 0.35;
        y = floor + spec.height * 0.4 + Math.cos(a * 2.1) * spec.height * 0.12;
        speed = length * 1.8;
    } else if (p.movement === 'school') {
        x =
            Math.sin(t * 0.18) * spec.width * 0.28 +
            Math.sin(phase) * length * 1.8;
        z =
            Math.cos(t * 0.18) * spec.depth * 0.22 +
            Math.cos(phase) * length * 1.8;
        y = floor + spec.height * 0.7 + Math.sin(phase * 2) * length;
    }
    const food = foodTarget(fish, state);
    if (food) {
        x = food.x + Math.sin(phase) * length;
        z = food.z + Math.cos(phase) * length;
        y = ['bottom', 'perch'].includes(p.movement)
            ? sample(x, z) + length * 0.25
            : food.y;
        speed *= 1.65;
        behavior = 'feeding';
    }
    const v = constrainPoint(spec, { x, y, z }, margin);
    v.y = Math.min(
        waterLevel(spec) - margin,
        Math.max(
            y,
            -spec.height / 2 + length * 0.15,
            sample(v.x, v.z) + length * 0.3
        )
    );
    return { ...v, speed, behavior, clearance: length * 0.3 };
}
const obstacles = new WeakMap();
function coralObstacle(mesh) {
    const key = [
        mesh.position.x,
        mesh.position.y,
        mesh.position.z,
        mesh.scale.x,
        mesh.rotation.y
    ].join(':');
    let cached = obstacles.get(mesh);
    if (cached?.key !== key) {
        cached = { key, box: new Box3().setFromObject(mesh) };
        obstacles.set(mesh, cached);
    }
    return cached.box;
}
export function advanceFishMotion(mesh, fish, seconds, delta, context = {}) {
    const dt = clamp(delta || 0, 0, 0.1);
    if (!dt || fish.alive === false) return;
    const spec = context.habitat?.spec || getTankSpec(context.state || {});
    const surface =
        context.surfaceHeight ||
        ((x, z) => habitatHeight(context.habitat, x, z));
    const species = getSpecies(fish.templateId),
        length = physicalSize(fish);
    const margin = Math.min(
        length * 0.55,
        Math.min(spec.width, spec.depth, spec.height) * 0.22
    );
    const target = fishTarget(
        fish,
        seconds,
        surface,
        context.habitat,
        context.state
    );
    const direction = new Vector3(target.x, target.y, target.z).sub(
        mesh.position
    );
    const center = new Vector3(),
        heading = new Vector3();
    let count = 0;
    for (const other of context.fishMeshes?.values() || []) {
        if (other === mesh || other.userData.dead) continue;
        const away = mesh.position.clone().sub(other.position),
            d = away.length();
        const radius =
            (length + (other.userData.physicalLengthM || length)) * 0.65;
        if (d < radius) {
            if (d < 0.00001)
                away.set(
                    Math.cos(fishSeed(fish.id) * 6.28),
                    0,
                    Math.sin(fishSeed(fish.id) * 6.28)
                ).multiplyScalar(0.001);
            direction.addScaledVector(
                away,
                ((radius - d) * 3) / Math.max(0.001, away.length())
            );
        }
        if (
            species.movement === 'school' &&
            other.userData.templateId === fish.templateId &&
            d < length * 10
        ) {
            center.add(other.position);
            if (other.userData.velocity) heading.add(other.userData.velocity);
            count++;
        }
    }
    if (count) {
        direction.addScaledVector(
            center.multiplyScalar(1 / count).sub(mesh.position),
            0.32
        );
        direction.addScaledVector(heading.multiplyScalar(1 / count), 0.35);
    }
    const distance = direction.length(),
        step = Math.min(
            distance * (1 - Math.exp(-2.4 * dt)),
            target.speed * dt
        );
    const before = mesh.position.clone();
    if (distance > 0.00001)
        mesh.position.addScaledVector(direction, step / distance);
    for (const coral of context.coralMeshes?.values() || []) {
        const box = coralObstacle(coral)
            .clone()
            .expandByScalar(length * 0.25);
        if (!box.containsPoint(mesh.position)) continue;
        const choices = [
            { x: box.min.x - 0.001, y: mesh.position.y, z: mesh.position.z },
            { x: box.max.x + 0.001, y: mesh.position.y, z: mesh.position.z },
            { x: mesh.position.x, y: mesh.position.y, z: box.min.z - 0.001 },
            { x: mesh.position.x, y: mesh.position.y, z: box.max.z + 0.001 }
        ].filter((v) => containsPoint(spec, v.x, v.z, margin));
        choices.sort(
            (a, b) =>
                Math.hypot(a.x - mesh.position.x, a.z - mesh.position.z) -
                Math.hypot(b.x - mesh.position.x, b.z - mesh.position.z)
        );
        if (choices[0])
            mesh.position.set(choices[0].x, choices[0].y, choices[0].z);
    }
    const safe = constrainPoint(spec, mesh.position, margin);
    mesh.position.set(
        safe.x,
        Math.min(
            waterLevel(spec) - margin,
            Math.max(
                mesh.position.y,
                -spec.height / 2 + length * 0.15,
                surface(safe.x, safe.z) + target.clearance
            )
        ),
        safe.z
    );
    mesh.userData.velocity ||= new Vector3();
    mesh.userData.velocity.copy(mesh.position).sub(before).divideScalar(dt);
    mesh.userData.motionSpeed = mesh.userData.velocity.length();
    mesh.userData.behavior = target.behavior;
}
