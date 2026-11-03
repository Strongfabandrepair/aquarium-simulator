import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { containsPoint, getTankSpec } from '../js/model/TankGeometry.js';
import { createInvertebrateModel } from '../js/graphics/InvertebrateModels.js';
import {
    updateCleanupMotion,
    cleanupSeed
} from '../js/graphics/CleanupMotion.js';

const surface = (x, z) => ({
    x,
    y: -0.265,
    z,
    normal: new THREE.Vector3(0, 1, 0),
    type: 'sand'
});
const habitat = {
    floorY: -0.265,
    bounds: { minX: -0.61, maxX: 0.61, minZ: -0.2655, maxZ: 0.165 },
    sample: surface
};

describe('cleanup anatomy and habitat behavior', () => {
    it('preserves positions, homes and feeding timers across equivalent environment rebuilds', () => {
        for (const templateId of [
            'hermitCrab',
            'nassariusSnail',
            'turboSnail'
        ]) {
            const mesh = new THREE.Group();
            const animal = { id: 'rebuild', templateId };
            const context = { habitat };
            for (let i = 0; i < 300; i++)
                updateCleanupMotion(mesh, animal, 1 / 30, context);
            const motion = mesh.userData.cleanupMotion;
            motion.fedUntil = 100;
            const home = motion.home.clone();
            const position = mesh.position.clone();
            const orientation = mesh.quaternion.clone();
            const elapsed = motion.elapsed;
            const rebuilt = { ...habitat, sample: (x, z) => surface(x, z) };
            updateCleanupMotion(mesh, animal, 0, { habitat: rebuilt });
            expect(mesh.userData.cleanupMotion).toBe(motion);
            expect(motion.habitat).toBe(rebuilt);
            expect(motion.home.equals(home)).toBe(true);
            expect(mesh.position.equals(position)).toBe(true);
            expect(mesh.quaternion.equals(orientation)).toBe(true);
            expect(motion.elapsed).toBe(elapsed);
            expect(motion.fedUntil).toBe(100);
        }
        const mesh = new THREE.Group();
        const animal = { id: 'support', templateId: 'hermitCrab' };
        updateCleanupMotion(mesh, animal, 0, { habitat });
        const previous = mesh.userData.cleanupMotion;
        const raised = {
            ...habitat,
            sample: (x, z) => ({ ...surface(x, z), y: -0.12, type: 'rock' })
        };
        updateCleanupMotion(mesh, animal, 0, { habitat: raised });
        expect(mesh.userData.cleanupMotion).not.toBe(previous);
        expect(mesh.position.y).toBe(-0.12);
    });

    it('has one continuous shell per snail or hermit and the correct exposed leg counts', () => {
        for (const [id, legs, claws, shells] of [
            ['hermitCrab', 4, 2, 1],
            ['emeraldCrab', 8, 2, 0],
            ['cleanerShrimp', 10, 0, 0],
            ['peppermintShrimp', 10, 0, 0],
            ['turboSnail', 0, 0, 1],
            ['nassariusSnail', 0, 0, 1]
        ]) {
            const mesh = createInvertebrateModel({}, id);
            expect(mesh.userData.legs).toHaveLength(legs);
            expect(mesh.userData.claws).toHaveLength(claws);
            const shellMeshes = [];
            mesh.traverse((child) => {
                if (child.userData.anatomicalPart === 'shell')
                    shellMeshes.push(child);
            });
            expect(shellMeshes).toHaveLength(shells);
            if (id.includes('Snail')) {
                const mantle = new THREE.Box3().setFromObject(
                    mesh.userData.mantle
                );
                const foot = new THREE.Box3().setFromObject(mesh.userData.foot);
                const shell = new THREE.Box3().setFromObject(shellMeshes[0]);
                for (const neighbor of [foot, shell]) {
                    const overlap = mantle
                        .clone()
                        .intersect(neighbor)
                        .getSize(new THREE.Vector3());
                    expect(overlap.x).toBeGreaterThan(0.02);
                    expect(overlap.y).toBeGreaterThan(0.02);
                    expect(overlap.z).toBeGreaterThan(0.02);
                }
            }
            expect(new THREE.Box3().setFromObject(mesh).min.y).toBeCloseTo(
                0,
                5
            );
            for (const shell of shellMeshes) {
                const positions = shell.geometry.attributes.position;
                for (let i = 0; i < positions.count; i++)
                    expect(Number.isFinite(positions.getX(i))).toBe(true);
            }
        }
    });

    it('spreads adjacent cohort IDs instead of stacking all animals', () => {
        expect(
            Math.abs(cleanupSeed('1:0') - cleanupSeed('1:1'))
        ).toBeGreaterThan(0.05);
        const context = {
            habitat,
            cleanupMeshes: new Map(),
            coralMeshes: new Map()
        };
        for (let i = 0; i < 15; i++) {
            const mesh = new THREE.Group();
            const animal = { id: `1:${i}`, templateId: 'hermitCrab' };
            updateCleanupMotion(mesh, animal, 0, context);
            for (const other of context.cleanupMeshes.values())
                expect(
                    mesh.position.distanceTo(other.position)
                ).toBeGreaterThan(0.016);
            context.cleanupMeshes.set(animal.id, mesh);
        }
        for (let i = 0; i < 900; i++) {
            for (const [id, mesh] of context.cleanupMeshes)
                updateCleanupMotion(
                    mesh,
                    { id, templateId: 'hermitCrab' },
                    1 / 30,
                    context
                );
        }
        for (const [id, mesh] of context.cleanupMeshes) {
            expect(mesh.position.y).toBe(-0.265);
            for (const [otherId, other] of context.cleanupMeshes) {
                if (id !== otherId)
                    expect(
                        mesh.position.distanceTo(other.position)
                    ).toBeGreaterThan(0.012);
            }
        }
    });

    it('keeps sand snails on the substrate, Turbo snails on glass, and pauses locomotion', () => {
        const sand = new THREE.Group();
        const snail = { id: 'sand', templateId: 'nassariusSnail' };
        updateCleanupMotion(sand, snail, 0, { habitat });
        const start = sand.position.clone();
        for (let i = 0; i < 300; i++)
            updateCleanupMotion(sand, snail, 1 / 30, { habitat });
        expect(sand.position.distanceTo(start)).toBeGreaterThan(0.001);
        expect(sand.position.y).toBe(-0.265);
        const paused = sand.position.clone();
        updateCleanupMotion(sand, snail, 0, { habitat });
        expect(sand.position.equals(paused)).toBe(true);
        const glass = new THREE.Group();
        const id = Array.from({ length: 20 }, (_, i) => String(i)).find(
            (id) => cleanupSeed(id) < 0.5
        );
        const turbo = { id, templateId: 'turboSnail' };
        for (let i = 0; i < 300; i++)
            updateCleanupMotion(glass, turbo, 1 / 30, { habitat });
        expect(
            containsPoint(
                getTankSpec({}),
                glass.position.x,
                glass.position.z,
                0.022 * 0.59
            )
        ).toBe(true);
        expect(glass.userData.habitatMode).toBe('glass');
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(glass.quaternion);
        expect(Math.abs(up.y)).toBeLessThan(0.001);
    });

    it('anchors rock residents to sloped terrain and limits contact probes', () => {
        let probes = 0;
        const slope = {
            ...habitat,
            sample: (x, z) => {
                probes++;
                return {
                    x,
                    z,
                    y: -0.12 + x * 0.1,
                    normal: new THREE.Vector3(-0.1, 1, 0).normalize(),
                    type: 'rock'
                };
            }
        };
        const mesh = new THREE.Group();
        const animal = { id: 'station', templateId: 'cleanerShrimp' };
        updateCleanupMotion(mesh, animal, 0, { habitat: slope });
        probes = 0;
        const start = mesh.position.clone();
        for (let i = 0; i < 600; i++)
            updateCleanupMotion(mesh, animal, 1 / 60, { habitat: slope });
        expect(mesh.position.y).toBeCloseTo(-0.12 + mesh.position.x * 0.1, 5);
        expect(mesh.position.distanceTo(start)).toBeLessThan(0.075);
        expect(probes).toBeLessThan(60);
    });

    it('buries Nassarius only in sand and emerges once per feeding event', () => {
        const mesh = new THREE.Group();
        const animal = { id: 'burrow', templateId: 'nassariusSnail' };
        const state = {
            day: 3,
            lastFed: 2,
            feedingsToday: 0,
            equipment: { substrate: 1 }
        };
        const context = { habitat, state };
        updateCleanupMotion(mesh, animal, 0.1, context);
        expect(mesh.userData.burrowDepth).toBe(0.1);
        state.lastFed = 3;
        state.feedingsToday = 1;
        state.feedingEvent = {
            id: 1,
            timeHours: 72,
            diet: 'meaty',
            position: { x: 0, y: 0, z: 0 }
        };
        updateCleanupMotion(mesh, animal, 0.1, context);
        expect(mesh.userData.burrowDepth).toBe(0);
        for (let i = 0; i < 460; i++)
            updateCleanupMotion(mesh, animal, 0.1, context);
        expect(mesh.userData.burrowDepth).toBe(0.1);
        state.feedingsToday = 2;
        state.feedingEvent.id = 2;
        updateCleanupMotion(mesh, animal, 0.1, context);
        expect(mesh.userData.burrowDepth).toBe(0);
        state.equipment.substrate = 0;
        for (let i = 0; i < 460; i++)
            updateCleanupMotion(mesh, animal, 0.1, context);
        expect(mesh.userData.burrowDepth).toBe(0);
    });
});
