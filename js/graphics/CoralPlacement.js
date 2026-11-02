import * as THREE from 'three';

const SPS = new Set(['acropora', 'birdsnest', 'montipora']);
const LPS = new Set(['hammerCoral', 'torchCoral', 'frogspawn']);
const SPREADING = new Set(['greenStarPolyps', 'xeniaCorals']);

function placementScore(point, coral, index) {
    const rock = point.type === 'rock';
    const preference = SPS.has(coral.templateId)
        ? rock
            ? point.y * 0.5 + 2
            : 0
        : SPREADING.has(coral.templateId)
          ? rock
              ? 0
              : 1
          : LPS.has(coral.templateId)
            ? rock
                ? 0.25
                : 0.5
            : rock
              ? 0.5
              : 0;
    // Deterministic ties scatter repeated species without random repositioning.
    return (
        preference +
        (Math.sin(point.x * 17 + point.z * 23 + index * 7) + 1) * 0.03
    );
}

export function syncCoralPlacements(corals, meshes, habitat) {
    const signature = corals
        .map((coral) => `${coral.id}:${coral.templateId}:${coral.scale}`)
        .join('|');
    if (habitat.coralSignature === signature && habitat.coralMeshes === meshes)
        return;
    habitat.coralSignature = signature;
    habitat.coralMeshes = meshes;
    const occupied = [];
    for (let index = 0; index < corals.length; index++) {
        const coral = corals[index];
        const mesh = meshes.get(coral.id);
        if (!mesh) continue;
        const requestedScale = Number.isFinite(coral.scale)
            ? Math.max(0.4, Math.min(1.6, coral.scale))
            : 1;
        mesh.scale.setScalar(requestedScale * habitat.coralScale);
        const radius = mesh.userData.coralRadius * mesh.scale.x;
        const gap = LPS.has(coral.templateId)
            ? 0.12
            : SPREADING.has(coral.templateId)
              ? 0.1
              : 0.055;
        const candidates = habitat.candidates.filter(
            (p) =>
                p.normal.y > 0.82 &&
                Math.abs(p.x) + radius < 2.88 &&
                Math.abs(p.z) + radius < 1.38 &&
                occupied.every(
                    (other) =>
                        Math.hypot(p.x - other.x, p.z - other.z) >=
                        radius + other.radius + Math.max(gap, other.gap)
                )
        );
        candidates.sort(
            (a, b) =>
                placementScore(b, coral, index) -
                placementScore(a, coral, index)
        );
        // Crowded legacy tanks retain every colony. Use the roomiest remaining
        // supported spot and reduce that display model to fit the available gap.
        let point = candidates[0];
        if (!point) {
            const ranked = habitat.candidates
                .map((p) => ({
                    p,
                    clearance: Math.min(
                        2.88 - Math.abs(p.x),
                        1.38 - Math.abs(p.z),
                        ...occupied.map(
                            (other) =>
                                Math.hypot(p.x - other.x, p.z - other.z) -
                                other.radius -
                                Math.max(gap, other.gap)
                        )
                    )
                }))
                .filter(
                    ({ p }) =>
                        p.normal.y > 0.82 &&
                        Math.abs(p.x) < 2.55 &&
                        Math.abs(p.z) < 1.1
                )
                .sort((a, b) => b.clearance - a.clearance);
            point = ranked[0]?.p || habitat.sample(0, 0);
            const fit = Math.max(
                0.015,
                (ranked[0]?.clearance || radius) - 0.015
            );
            mesh.scale.multiplyScalar(Math.min(1, fit / radius));
        }
        // The model's mounting rock intersects the actual surface slightly; no
        // guessed height or hovering gap. Polyps remain upright on a stable ledge.
        mesh.position.set(
            point.x,
            point.y + mesh.userData.coralBaseOffset * mesh.scale.x - 0.012,
            point.z
        );
        mesh.userData.habitat = point.type;
        mesh.userData.surfaceY = point.y;
        mesh.userData.placementRadius =
            mesh.userData.coralRadius * mesh.scale.x;
        occupied.push({ ...point, radius: mesh.userData.placementRadius, gap });
        // Save the resolved contact point, repairing old floating coordinates.
        coral.x = mesh.position.x;
        coral.y = mesh.position.y;
        coral.z = mesh.position.z;
        coral.habitat = point.type;
    }
}

export function measureCoralMount(mesh) {
    const originalPosition = mesh.position.clone();
    const originalScale = mesh.scale.clone();
    mesh.position.set(0, 0, 0);
    mesh.scale.setScalar(1);
    mesh.updateMatrixWorld(true);
    const vertex = new THREE.Vector3();
    let radius = 0;
    mesh.traverse((part) => {
        const positions = part.geometry?.attributes.position;
        if (!positions) return;
        for (let i = 0; i < positions.count; i++) {
            vertex
                .fromBufferAttribute(positions, i)
                .applyMatrix4(part.matrixWorld);
            radius = Math.max(radius, Math.hypot(vertex.x, vertex.z));
        }
    });
    mesh.userData.coralRadius = radius + 0.025;
    const base = new THREE.Box3().setFromObject(mesh.children[0] || mesh);
    mesh.userData.coralBaseOffset = -base.min.y;
    mesh.position.copy(originalPosition);
    mesh.scale.copy(originalScale);
}
