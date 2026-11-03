// Physical scene convention: one Three.js unit is one metre; tank center is origin.
export const TANK_PRESETS = {
    nano: { shape: 'rectangular', width: 0.61, height: 0.42, depth: 0.305 },
    medium: { shape: 'rectangular', width: 1.22, height: 0.53, depth: 0.33 },
    large: { shape: 'rectangular', width: 1.22, height: 0.61, depth: 0.61 }
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const dimension = (n, fallback) =>
    Number.isFinite(Number(n)) && Number(n) > 0
        ? clamp(Number(n), 0.25, 3)
        : fallback;

export function normalizeTankSpec(spec = {}, preset = 'medium') {
    const base = TANK_PRESETS[preset] || TANK_PRESETS.medium;
    spec ||= {};
    const shape = ['rectangular', 'cube', 'cylinder', 'bowfront'].includes(
        spec.shape
    )
        ? spec.shape
        : base.shape;
    const width = dimension(spec.width, base.width);
    return {
        shape,
        width,
        height: shape === 'cube' ? width : dimension(spec.height, base.height),
        depth:
            shape === 'cube' || shape === 'cylinder'
                ? width
                : dimension(spec.depth, base.depth)
    };
}

export function getTankSpec(state = {}) {
    return normalizeTankSpec(state.tankSpec, state.tankSize);
}

export const waterLevel = (spec) => normalizeTankSpec(spec).height / 2 - 0.025;

export function tankVolumeLiters(input) {
    const s = normalizeTankSpec(input);
    let area = s.width * s.depth;
    if (s.shape === 'cylinder') area = Math.PI * (s.width / 2) ** 2;
    if (s.shape === 'bowfront') area *= 1 - 0.22 / 3;
    return area * (s.height - 0.025) * 1000;
}

// Conservative inset of the parabolic bow, including body radius on its slope.
function frontBoundary(s, x, margin) {
    if (s.shape !== 'bowfront') return s.depth / 2 - margin;
    const a = (s.depth * 0.22) / (s.width / 2) ** 2;
    return (
        s.depth / 2 -
        a * x * x -
        margin * Math.sqrt(1 + (2 * a * x) ** 2) -
        a * margin * margin
    );
}

export function containsPoint(input, x, z, margin = 0) {
    const s = normalizeTankSpec(input);
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
    margin = Math.max(0, margin);
    if (s.shape === 'cylinder')
        return Math.hypot(x, z) <= Math.max(0, s.width / 2 - margin) + 1e-9;
    if (
        Math.abs(x) > s.width / 2 - margin + 1e-9 ||
        z < -s.depth / 2 + margin - 1e-9
    )
        return false;
    return z <= frontBoundary(s, x, margin) + 1e-9;
}

export function constrainPoint(input, point, margin = 0) {
    const s = normalizeTankSpec(input);
    margin = clamp(
        Number.isFinite(margin) ? margin : 0,
        0,
        Math.min(s.width, s.depth, s.height) * 0.45
    );
    let x = Number.isFinite(point.x) ? point.x : 0;
    let z = Number.isFinite(point.z) ? point.z : 0;
    if (s.shape === 'cylinder') {
        const r = s.width / 2 - margin;
        const length = Math.hypot(x, z);
        if (length > r) {
            x *= r / length;
            z *= r / length;
        }
    } else {
        x = clamp(x, -s.width / 2 + margin, s.width / 2 - margin);
        z = clamp(z, -s.depth / 2 + margin, frontBoundary(s, x, margin));
    }
    return {
        x,
        y: clamp(
            Number.isFinite(point.y) ? point.y : 0,
            -s.height / 2 + margin,
            waterLevel(s) - margin
        ),
        z
    };
}

export function tankOutline(input, segments = 64) {
    const s = normalizeTankSpec(input);
    if (s.shape === 'cylinder')
        return Array.from({ length: segments }, (_, i) => ({
            x: (Math.cos((i / segments) * Math.PI * 2) * s.width) / 2,
            z: (Math.sin((i / segments) * Math.PI * 2) * s.width) / 2
        }));
    const points = [
        { x: -s.width / 2, z: -s.depth / 2 },
        { x: s.width / 2, z: -s.depth / 2 }
    ];
    if (s.shape === 'bowfront') {
        for (let i = 0; i <= segments / 2; i++) {
            const x = s.width / 2 - (i / (segments / 2)) * s.width;
            points.push({
                x,
                z: s.depth / 2 - s.depth * 0.22 * (x / (s.width / 2)) ** 2
            });
        }
    } else
        points.push(
            { x: s.width / 2, z: s.depth / 2 },
            { x: -s.width / 2, z: s.depth / 2 }
        );
    return points;
}

export function substrateHeight(state) {
    const spec = getTankSpec(state);
    // Approximate dry aragonite bulk density; weight is pounds, depth is metres.
    return state.equipment?.substrate > 0
        ? clamp(
              (state.equipment.substrate * 0.453592) /
                  1500 /
                  (tankVolumeLiters(spec) / 1000 / (spec.height - 0.025)),
              0.012,
              0.065
          )
        : 0;
}

export function defaultRockPlacements(input, floorY) {
    const spec = normalizeTankSpec(input);
    const size = Math.min(spec.depth * 0.42, spec.height * 0.45, 0.22);
    return [-1, 0, 1].map((side, i) => ({
        id: `rock-default-${i}`,
        kind: 'rock',
        position: {
            x: side * spec.width * 0.22,
            y: floorY ?? -spec.height / 2,
            z: i === 1 ? -spec.depth * 0.12 : spec.depth * 0.03
        },
        normal: { x: 0, y: 1, z: 0 },
        rotation: i * 1.7,
        size: size * (i === 1 ? 1.2 : 1)
    }));
}
