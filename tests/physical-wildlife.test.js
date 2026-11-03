import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
vi.mock('../js/graphics/FishTextures.js', () => ({
    fishTexture: () => new THREE.Texture()
}));
import {
    SPECIES,
    getSpecies,
    physicalSize,
    NEW_FISH,
    NEW_CORALS,
    NEW_CLEANUP
} from '../js/model/SpeciesCatalog.js';
import {
    normalizeTankSpec,
    containsPoint,
    waterLevel
} from '../js/model/TankGeometry.js';
import {
    LivestockRenderer,
    scaleWildlife
} from '../js/graphics/LivestockRenderer.js';
import { createFishModel } from '../js/graphics/FishModels.js';
import { createCoralModel } from '../js/graphics/CoralModels.js';
import { createInvertebrateModel } from '../js/graphics/InvertebrateModels.js';
import {
    fishTarget,
    advanceFishMotion,
    foodTarget
} from '../js/graphics/FishMotion.js';
import {
    updateCleanupMotion,
    cleanupSeed
} from '../js/graphics/CleanupMotion.js';

describe('physical species and locomotion', () => {
    it('provides finite juvenile/adult dimensions and working models for every new species', () => {
        expect(Object.keys(SPECIES)).toHaveLength(33);
        for (const species of Object.values(SPECIES)) {
            expect(species.juvenileLengthM).toBeGreaterThan(0);
            expect(species.adultLengthM).toBeGreaterThan(
                species.juvenileLengthM
            );
            expect(species.growthDays).toBeGreaterThan(0);
        }
        for (const [entries, factory] of [
            [NEW_FISH, createFishModel],
            [NEW_CORALS, createCoralModel],
            [NEW_CLEANUP, createInvertebrateModel]
        ]) {
            for (const entry of entries) {
                const model = factory({ templateId: entry.id }, entry.id);
                expect(model).toBeTruthy();
                expect(new THREE.Box3().setFromObject(model).isEmpty()).toBe(
                    false
                );
            }
        }
    });
    it('scales measured anatomy to real juvenile and adult lengths without cumulative scaling', () => {
        for (const id of [
            'clownfish',
            'blueHippoTang',
            ...NEW_FISH.map((v) => v.id)
        ]) {
            const animal = { id, templateId: id, alive: true };
            const mesh = createFishModel(animal, id);
            scaleWildlife(mesh, animal);
            expect(
                new THREE.Box3()
                    .setFromObject(mesh)
                    .getSize(new THREE.Vector3()).x
            ).toBeCloseTo(getSpecies(id).juvenileLengthM, 5);
            animal.lengthM = getSpecies(id).adultLengthM;
            scaleWildlife(mesh, animal);
            scaleWildlife(mesh, animal);
            expect(
                new THREE.Box3()
                    .setFromObject(mesh)
                    .getSize(new THREE.Vector3()).x
            ).toBeCloseTo(animal.lengthM, 5);
        }
        for (const id of ['hermitCrab', 'trochusSnail', 'cerithSnail']) {
            const animal = { id, templateId: id };
            const mesh = createInvertebrateModel(animal, id);
            scaleWildlife(mesh, animal, 'cleanup');
            expect(
                new THREE.Box3()
                    .setFromObject(mesh)
                    .getSize(new THREE.Vector3()).x
            ).toBeCloseTo(physicalSize(animal), 5);
        }
    });
    it('bounds every fish in all four tank shapes through extended swimming', () => {
        const ids = Object.values(SPECIES)
            .filter(
                (s) =>
                    ![
                        'colony',
                        'crawl',
                        'graze',
                        'burrow',
                        'station',
                        'nocturnal'
                    ].includes(s.movement)
            )
            .map((s) => s.id);
        for (const shape of ['rectangular', 'cube', 'cylinder', 'bowfront']) {
            const spec = normalizeTankSpec({
                shape,
                width: 0.8,
                height: 0.55,
                depth: 0.5
            });
            const habitat = {
                spec,
                floorY: -spec.height / 2,
                sample: () => ({ y: -spec.height / 2 })
            };
            for (const id of ids) {
                const fish = { id, templateId: id, alive: true },
                    mesh = new THREE.Group();
                const start = fishTarget(fish, 0, undefined, habitat);
                mesh.position.set(start.x, start.y, start.z);
                for (let i = 0; i < 300; i++) {
                    advanceFishMotion(mesh, fish, i / 10, 0.1, { habitat });
                    expect(
                        containsPoint(
                            spec,
                            mesh.position.x,
                            mesh.position.z,
                            physicalSize(fish) * 0.54
                        )
                    ).toBe(true);
                    expect(mesh.position.y).toBeLessThan(waterLevel(spec));
                    expect(mesh.position.y).toBeGreaterThan(-spec.height / 2);
                }
            }
        }
    });
    it('keeps glass snails inside curved and rectangular walls', () => {
        const id = Array.from({ length: 30 }, (_, i) => String(i)).find(
            (v) => cleanupSeed(v) < 0.5
        );
        for (const shape of ['rectangular', 'cube', 'cylinder', 'bowfront']) {
            const spec = normalizeTankSpec({
                shape,
                width: 0.8,
                height: 0.55,
                depth: 0.5
            });
            const mesh = new THREE.Group(),
                animal = { id, templateId: 'trochusSnail' };
            for (let i = 0; i < 300; i++)
                updateCleanupMotion(mesh, animal, 0.1, {
                    state: { tankSpec: spec }
                });
            expect(mesh.userData.habitatMode).toBe('glass');
            expect(
                containsPoint(
                    spec,
                    mesh.position.x,
                    mesh.position.z,
                    physicalSize(animal) * 0.59
                )
            ).toBe(true);
        }
    });
    it('uses compatible recent food and rejects old or incompatible feeding events', () => {
        const state = {
            day: 2,
            hour: 10,
            minute: 0,
            feedingEvent: {
                id: 1,
                timeHours: 58,
                diet: 'algae',
                position: { x: 0.1, y: 0, z: 0.1 }
            }
        };
        expect(foodTarget({ templateId: 'yellowTang' }, state)).toBe(
            state.feedingEvent.position
        );
        expect(foodTarget({ templateId: 'lyretailAnthias' }, state)).toBe(null);
        state.feedingEvent.diet = 'mixed';
        expect(
            foodTarget({ templateId: 'lyretailAnthias' }, state)
        ).toBeTruthy();
        expect(foodTarget({ templateId: 'mandarinGoby' }, state)).toBe(null);
        state.hour = 13;
        expect(foodTarget({ templateId: 'yellowTang' }, state)).toBe(null);
    });
    it('school neighbors influence chromis while solitary fish retain independent motion', () => {
        const school = { id: 1, templateId: 'greenChromis', alive: true };
        const a = new THREE.Group(),
            b = new THREE.Group();
        const neighbor = new THREE.Group();
        neighbor.position.set(0.15, 0.05, 0.05);
        neighbor.userData.templateId = 'greenChromis';
        neighbor.userData.velocity = new THREE.Vector3(0.03, 0, 0);
        advanceFishMotion(a, school, 1, 0.1, {
            fishMeshes: new Map([[2, neighbor]])
        });
        advanceFishMotion(b, school, 1, 0.1, {});
        expect(a.position.distanceTo(b.position)).toBeGreaterThan(0.00001);
        const solo = { ...school, templateId: 'royalGramma' };
        a.position.set(0, 0, 0);
        b.position.set(0, 0, 0);
        advanceFishMotion(a, solo, 1, 0.1, {
            fishMeshes: new Map([[2, neighbor]])
        });
        advanceFishMotion(b, solo, 1, 0.1, {});
        expect(a.position.distanceTo(b.position)).toBeLessThan(0.000001);
    });
    it('applies growth sizing even when animation is paused', () => {
        const fish = { id: 3, templateId: 'clownfish', alive: true };
        const mesh = LivestockRenderer.createFishMesh(fish);
        fish.lengthM = 0.08;
        LivestockRenderer.updateFishAnimation(mesh, fish, 0, 0);
        expect(mesh.userData.physicalLengthM).toBe(0.08);
    });
});
