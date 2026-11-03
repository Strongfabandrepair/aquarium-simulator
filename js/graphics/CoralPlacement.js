import * as THREE from 'three';
import { containsPoint, waterLevel } from '../model/TankGeometry.js';
import { applySurfaceTransform } from './PlacementRules.js';
import { physicalSize } from '../model/SpeciesCatalog.js';

export function applyCoralPlacement(mesh, item) {
    const offset = mesh.userData.coralBaseOffset * mesh.scale.x - 0.001;
    applySurfaceTransform(
        mesh,
        item.position,
        item.normal || { x: 0, y: 1, z: 0 },
        item.rotation || 0,
        offset
    );
    mesh.userData.placedItemId = item.id;
}

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

export function syncCoralPlacements(
    corals,
    meshes,
    habitat,
    state = habitat.state
) {
    state.placedItems ||= [];
    const signature = JSON.stringify([
        corals.map((coral) => [
            coral.id,
            coral.templateId,
            physicalSize(coral, 'coral')
        ]),
        state.placedItems.filter((item) => item.kind === 'coral')
    ]);
    if (habitat.coralSignature === signature && habitat.coralMeshes === meshes)
        return;
    habitat.coralMeshes = meshes;
    const occupied = [];
    for (let index = 0; index < corals.length; index++) {
        const coral = corals[index];
        const mesh = meshes.get(coral.id);
        if (!mesh) continue;
        const diameter = physicalSize(coral, 'coral');
        mesh.userData.physicalDiameterM = diameter;
        mesh.scale.setScalar(diameter / (2 * mesh.userData.coralRadius));
        mesh.userData.placementRadius = diameter / 2;
        const gap = 0.012;
        const valid = (p) =>
            p.normal.y > 0.7 &&
            containsPoint(habitat.spec, p.x, p.z, diameter / 2 + 0.005) &&
            p.y + mesh.userData.coralHeight * mesh.scale.x <
                waterLevel(habitat.spec) - 0.005 &&
            occupied.every(
                (other) =>
                    Math.hypot(p.x - other.x, p.z - other.z) >=
                    diameter / 2 + other.radius + gap
            );
        let item = state.placedItems.find(
            (entry) => entry.kind === 'coral' && entry.livestockId === coral.id
        );
        let point = item
            ? habitat.sample(item.position.x, item.position.z)
            : null;
        if (point && !valid(point)) {
            // A chosen placement is user intent. Growth or a changed aquascape
            // can require more space, but must never silently relocate the colony.
            mesh.visible = false;
            coral.placementStatus = 'needs-placement';
            continue;
        }
        if (!point) {
            const candidates = habitat.candidates.filter(valid);
            candidates.sort(
                (a, b) =>
                    placementScore(b, coral, index) -
                    placementScore(a, coral, index)
            );
            point = candidates[0];
        }
        if (!point) {
            // Keep purchased colonies in the placement tray, never shrink or stack them.
            mesh.visible = false;
            coral.placementStatus = 'needs-placement';
            continue;
        }
        if (!item) {
            item = {
                id: 'coral-' + coral.id,
                kind: 'coral',
                livestockId: coral.id,
                rotation: 0,
                size: diameter
            };
            state.placedItems.push(item);
        }
        item.position = { x: point.x, y: point.y, z: point.z };
        item.normal = {
            x: point.normal.x,
            y: point.normal.y,
            z: point.normal.z
        };
        item.supportId = point.surfaceId;
        item.size = diameter;
        applyCoralPlacement(mesh, item);
        mesh.visible = true;
        mesh.userData.habitat = point.type;
        mesh.userData.surfaceY = point.y;
        occupied.push({ ...point, radius: diameter / 2 });
        coral.x = mesh.position.x;
        coral.y = mesh.position.y;
        coral.z = mesh.position.z;
        coral.habitat = point.type;
        coral.placementStatus = 'placed';
    }
    habitat.coralSignature = JSON.stringify([
        corals.map((coral) => [
            coral.id,
            coral.templateId,
            physicalSize(coral, 'coral')
        ]),
        state.placedItems.filter((item) => item.kind === 'coral')
    ]);
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
    const bounds = new THREE.Box3().setFromObject(mesh);
    mesh.userData.coralHeight = bounds.max.y - bounds.min.y;
    const base = new THREE.Box3().setFromObject(mesh.children[0] || mesh);
    mesh.userData.coralBaseOffset = -base.min.y;
    mesh.position.copy(originalPosition);
    mesh.scale.copy(originalScale);
}
