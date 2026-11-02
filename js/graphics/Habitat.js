import * as THREE from 'three';

// Queries only aquarium substrate/rock geometry, never equipment or livestock.
export function getHabitat(scene, state) {
    const environment = scene.userData.tankEnvironmentGroup;
    const cached = scene.userData.livestockHabitat;
    if (cached && cached.environment === environment) return cached;
    const habitat = new Habitat(environment, state);
    scene.userData.livestockHabitat = habitat;
    return habitat;
}

export class Habitat {
    constructor(environment, state = {}) {
        this.environment = environment;
        this.bounds = { minX: -2.85, maxX: 2.85, minZ: -1.35, maxZ: 1.35 };
        this.floorY = -1.48;
        this.floorType = 'bottom';
        this.rocks = [];
        this.ray = new THREE.Raycaster(
            new THREE.Vector3(),
            new THREE.Vector3(0, -1, 0)
        );
        this.normalMatrix = new THREE.Matrix3();
        this.coralScale =
            state.tankSize === 'large'
                ? 0.52
                : state.tankSize === 'nano'
                  ? 0.9
                  : 0.7;
        environment?.updateMatrixWorld(true);
        environment?.traverse((object) => {
            if (object.userData.type === 'sand') {
                this.floorY = new THREE.Box3().setFromObject(object).max.y;
                this.floorType = 'sand';
            }
            if (object.isMesh && object.parent?.userData.type === 'rocks')
                this.rocks.push(object);
        });
        // Rebuilt only when the aquascape changes; shared by grazing/perching agents.
        this.rockPoints = [];
        this.candidates = [];
        for (let iz = 0; iz < 15; iz++) {
            for (let ix = 0; ix < 29; ix++) {
                const p = this.sample(-2.65 + ix * 0.19, -1.16 + iz * 0.165);
                this.candidates.push(p);
                if (p.type === 'rock' && p.normal.y > 0.75)
                    this.rockPoints.push(p);
            }
        }
    }

    sample(x, z, { sandOnly = false } = {}) {
        const floor = {
            x,
            y: this.floorY,
            z,
            type: this.floorType,
            normal: new THREE.Vector3(0, 1, 0)
        };
        if (sandOnly || !this.rocks.length) return floor;
        this.ray.set(new THREE.Vector3(x, 2.5, z), new THREE.Vector3(0, -1, 0));
        const hit = this.ray.intersectObjects(this.rocks, false)[0];
        if (!hit || hit.point.y <= this.floorY) return floor;
        this.normalMatrix.getNormalMatrix(hit.object.matrixWorld);
        return {
            x,
            y: hit.point.y,
            z,
            type: 'rock',
            normal: hit.face.normal
                .clone()
                .applyMatrix3(this.normalMatrix)
                .normalize()
        };
    }
}
