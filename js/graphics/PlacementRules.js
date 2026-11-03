import * as THREE from 'three';
import { containsPoint, waterLevel } from '../model/TankGeometry.js';

export const snapRotation = (degrees) => Math.round(degrees / 15) * 15;

export function applySurfaceTransform(
    mesh,
    position,
    normal,
    rotation,
    baseOffset = 0
) {
    const up = new THREE.Vector3(0, 1, 0);
    const n = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
    mesh.quaternion.setFromUnitVectors(up, n);
    mesh.quaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(up, rotation)
    );
    mesh.position
        .set(position.x, position.y, position.z)
        .addScaledVector(n, baseOffset);
    mesh.updateMatrixWorld(true);
}

export function validatePlacement({
    point,
    normal,
    radius,
    height,
    spec,
    occupied = [],
    selectedId,
    kind,
    supportId
}) {
    if (
        !point ||
        !normal ||
        ![
            point.x,
            point.y,
            point.z,
            normal.x,
            normal.y,
            normal.z,
            radius,
            height
        ].every(Number.isFinite) ||
        radius <= 0 ||
        height <= 0
    )
        return { valid: false, reason: 'Point at a solid aquarium surface.' };
    if (point.y < -spec.height / 2 - 0.001)
        return {
            valid: false,
            reason: 'Choose a surface inside the aquarium.'
        };
    if (normal.y <= 0.7)
        return { valid: false, reason: 'Choose a stable upward-facing ledge.' };
    if (!containsPoint(spec, point.x, point.z, radius + 0.005))
        return {
            valid: false,
            reason: 'Keep the whole object inside the tank.'
        };
    if (point.y + height > waterLevel(spec) - 0.005)
        return {
            valid: false,
            reason: 'The object must remain below the water surface.'
        };
    for (const item of occupied) {
        if (item.id === selectedId || item.id === supportId) continue;
        const gap = kind === 'coral' || item.kind === 'coral' ? 0.012 : 0.003;
        if (
            !(kind === 'coral' && item.kind === 'coral') &&
            (point.y + height <= item.minY + 0.002 ||
                point.y >= item.maxY - 0.002)
        )
            continue;
        if (
            Math.hypot(point.x - item.x, point.z - item.z) <
            radius + item.radius + gap
        )
            return {
                valid: false,
                reason: 'Leave room between neighboring animals and rocks.'
            };
    }
    return { valid: true, reason: 'Click to place. Rotate in 15° steps.' };
}
