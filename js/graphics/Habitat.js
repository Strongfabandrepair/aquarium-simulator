import * as THREE from 'three';
import {
    getTankSpec,
    containsPoint,
    substrateHeight
} from '../model/TankGeometry.js';

// Queries only aquarium substrate/rock geometry, never equipment or livestock.
export function getHabitat(scene, state) {
    const environment = scene.userData.tankEnvironmentGroup;
    const cached = scene.userData.livestockHabitat;
    if (cached && cached.environment === environment) {
        cached.state = state;
        return cached;
    }
    const habitat = new Habitat(environment, state);
    scene.userData.livestockHabitat = habitat;
    return habitat;
}

export class Habitat {
    constructor(environment, state = {}) {
        this.environment = environment;
        this.state = state;
        this.spec = getTankSpec(state);
        this.bounds = {
            minX: -this.spec.width / 2 + 0.015,
            maxX: this.spec.width / 2 - 0.015,
            minZ: -this.spec.depth / 2 + 0.015,
            maxZ: this.spec.depth / 2 - 0.015
        };
        this.floorY = -this.spec.height / 2 + substrateHeight(state);
        this.floorType = state.equipment?.substrate > 0 ? 'sand' : 'bottom';
        this.rocks = [];
        this.surfaces = [];
        this.ray = new THREE.Raycaster(
            new THREE.Vector3(),
            new THREE.Vector3(0, -1, 0)
        );
        this.normalMatrix = new THREE.Matrix3();
        environment?.updateMatrixWorld(true);
        environment?.traverse((object) => {
            if (
                object.userData.type === 'sand' ||
                object.userData.type === 'bottom'
            ) {
                this.floorY = new THREE.Box3().setFromObject(object).max.y;
                this.floorType = object.userData.type;
                this.surfaces.push(object);
            }
            if (
                object.isMesh &&
                (object.userData.type === 'rock' ||
                    object.parent?.userData.type === 'rocks')
            ) {
                this.rocks.push(object);
                this.surfaces.push(object);
            }
        });
        this.rockPoints = [];
        this.candidates = [];
        const stepsX = 32,
            stepsZ = 24;
        for (let iz = 0; iz <= stepsZ; iz++) {
            for (let ix = 0; ix <= stepsX; ix++) {
                const x =
                    -this.spec.width / 2 +
                    ((ix + 0.5) * this.spec.width) / (stepsX + 1);
                const z =
                    -this.spec.depth / 2 +
                    ((iz + 0.5) * this.spec.depth) / (stepsZ + 1);
                if (!containsPoint(this.spec, x, z, 0.01)) continue;
                const p = this.sample(x, z);
                this.candidates.push(p);
                if (p.type === 'rock' && p.normal.y > 0.75)
                    this.rockPoints.push(p);
            }
        }
    }

    sample(x, z, { sandOnly = false, excludeId } = {}) {
        const floor = {
            x,
            y: this.floorY,
            z,
            type: this.floorType,
            normal: new THREE.Vector3(0, 1, 0),
            surfaceId: null
        };
        if (sandOnly || !this.rocks.length) return floor;
        this.ray.set(
            new THREE.Vector3(x, this.spec.height, z),
            new THREE.Vector3(0, -1, 0)
        );
        const targets =
            excludeId == null
                ? this.rocks
                : this.rocks.filter(
                      (mesh) => mesh.userData.placedItemId !== excludeId
                  );
        const hit = this.ray.intersectObjects(targets, true)[0];
        if (!hit || hit.point.y <= this.floorY) return floor;
        let owner = hit.object;
        while (owner && !owner.userData.placedItemId) owner = owner.parent;
        this.normalMatrix.getNormalMatrix(hit.object.matrixWorld);
        return {
            x,
            y: hit.point.y,
            z,
            type: 'rock',
            normal: hit.face.normal
                .clone()
                .applyMatrix3(this.normalMatrix)
                .normalize(),
            surfaceId: owner?.userData.placedItemId ?? null
        };
    }
}
