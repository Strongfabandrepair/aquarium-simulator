// =========================================
// PROCEDURAL 3D TANK & ALL EQUIPMENT BUILDER
// =========================================

import { buildPhysicalEnvironment } from './PhysicalEnvironment.js';
import { getTankSpec } from '../model/TankGeometry.js';

export class TankBuilder {
    static buildEnvironment(scene, state) {
        if (!scene || !state) return;
        const signature = JSON.stringify([
            getTankSpec(state),
            state.equipment,
            (state.placedItems || []).filter((item) => item.kind === 'rock'),
            Boolean(state.aquascapeInitialized),
            state.cycleComplete
        ]);
        if (
            scene.userData.tankEnvironmentSignature === signature &&
            scene.userData.tankEnvironmentGroup
        )
            return;
        const old = scene.userData.tankEnvironmentGroup;
        if (old) {
            scene.remove(old);
            this.disposeGroup(old);
        }
        const group = buildPhysicalEnvironment(state);
        scene.userData.tankEnvironmentGroup = group;
        scene.userData.tankEnvironmentSignature = JSON.stringify([
            getTankSpec(state),
            state.equipment,
            (state.placedItems || []).filter((item) => item.kind === 'rock'),
            Boolean(state.aquascapeInitialized),
            state.cycleComplete
        ]);
        scene.add(group);
        group.updateMatrixWorld(true);
    }

    // Geometry/materials belong to a scene group; generated textures are shared cache entries.
    static disposeGroup(group) {
        const geometries = new Set();
        const materials = new Set();
        group.traverse((object) => {
            if (object.geometry) geometries.add(object.geometry);
            if (object.material) {
                for (const material of Array.isArray(object.material)
                    ? object.material
                    : [object.material])
                    materials.add(material);
            }
        });
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
    }
}
