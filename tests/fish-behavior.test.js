import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    fishTarget,
    advanceFishMotion,
    habitatHeight
} from '../js/graphics/FishMotion.js';
import { LivestockRenderer } from '../js/graphics/LivestockRenderer.js';

const fish = (templateId, id = 1) => ({ id, templateId, alive: true });
const height = (x, z) => (Math.abs(x) < 1 && Math.abs(z) < 0.5 ? -0.3 : -1.32);
function run(animal, rate, seconds = 12) {
    const mesh = new THREE.Group();
    const start = fishTarget(animal, 0, height);
    mesh.position.set(start.x, start.y, start.z);
    for (let i = 1; i <= seconds * rate; i++)
        advanceFishMotion(mesh, animal, i / rate, 1 / rate, {
            surfaceHeight: height
        });
    return mesh;
}

describe('continuous species locomotion', () => {
    it('keeps shelter species near measured rock ledges', () => {
        const habitat = { rockPoints: [{ x: -1, y: -0.5, z: 0.2 }] };
        for (const species of ['royalGramma', 'firefishGoby']) {
            for (let t = 0; t < 60; t += 0.5) {
                const target = fishTarget(
                    fish(species),
                    t,
                    () => -1.32,
                    habitat
                );
                expect(Math.hypot(target.x + 1, target.z - 0.2)).toBeLessThan(
                    0.37
                );
                expect(target.y).toBeGreaterThan(-0.5);
                expect(target.y).toBeLessThan(0);
            }
        }
    });
    it('routes around measured coral bodies without lifting bottom fish into open water', () => {
        const coral = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.6),
            new THREE.MeshBasicMaterial()
        );
        coral.position.set(0, -0.9, 0.5);
        const mesh = new THREE.Group();
        mesh.position.set(0, -1.2, 0.5);
        for (let i = 1; i <= 600; i++) {
            advanceFishMotion(mesh, fish('mandarinGoby'), i / 60, 1 / 60, {
                coralMeshes: new Map([[1, coral]])
            });
            expect(
                Math.hypot(mesh.position.x, mesh.position.z - 0.5)
            ).toBeGreaterThanOrEqual(0.47999);
            expect(mesh.position.y).toBeLessThan(-1);
        }
    });
    it('caches surface raycasts within a habitat and resets for rebuilt environments', () => {
        let calls = 0;
        const habitat = {
            floorY: -1.3,
            sample: (x, z) => {
                calls++;
                return { y: x + z };
            }
        };
        const first = habitatHeight(habitat, 0.21, 0.31);
        for (let i = 0; i < 100; i++)
            expect(habitatHeight(habitat, 0.21, 0.31)).toBe(first);
        expect(calls).toBe(4);
        habitatHeight({ ...habitat }, 0.21, 0.31);
        expect(calls).toBe(8);
    });
    it('chooses actual rock ledges for blenny perches', () => {
        const habitat = {
            rockPoints: [
                { x: -1, y: -0.4, z: 0 },
                { x: -0.6, y: -0.3, z: 0 }
            ]
        };
        for (let t = 0; t < 40; t += 0.2) {
            const target = fishTarget(
                fish('tailspotBlenny'),
                t,
                () => -0.4,
                habitat
            );
            expect(target.x).toBeGreaterThanOrEqual(-1);
            expect(target.x).toBeLessThanOrEqual(-0.6);
            expect(target.z).toBe(0);
        }
    });
    it('swims between chemistry ticks even when model coordinates never change', () => {
        const animal = { ...fish('yellowTang'), x: 0.5, y: 0.5, z: 0.5 };
        const mesh = new THREE.Group();
        for (let i = 1; i <= 120; i++)
            LivestockRenderer.updateFishAnimation(
                mesh,
                animal,
                (i * 1000) / 60,
                1 / 60,
                {}
            );
        expect(mesh.position.length()).toBeGreaterThan(0.4);
        expect(mesh.userData.swimSpeed).toBeGreaterThan(0.1);
        expect(animal.x).toBe(0.5);
    });
    it('freezes locomotion and orientation at pause', () => {
        const mesh = run(fish('clownfish'), 60);
        const before = mesh.position.clone();
        const rotation = mesh.rotation.clone();
        LivestockRenderer.updateFishAnimation(
            mesh,
            fish('clownfish'),
            99000,
            0,
            {}
        );
        expect(mesh.position.equals(before)).toBe(true);
        expect(mesh.rotation.equals(rotation)).toBe(true);
    });
    it('has equivalent trajectories at 30 and 120 fps', () => {
        expect(
            run(fish('yellowTang'), 30).position.distanceTo(
                run(fish('yellowTang'), 120).position
            )
        ).toBeLessThan(0.03);
    });
    it('keeps bottom foragers near supporting surfaces and gives blennies actual resting intervals', () => {
        for (const id of ['mandarinGoby', 'tailspotBlenny']) {
            for (let t = 0; t < 120; t += 0.5) {
                const p = fishTarget(fish(id), t, height);
                expect(p.y).toBeCloseTo(height(p.x, p.z) + 0.1);
            }
        }
        let restingIntervals = 0;
        for (let t = 0; t < 18; t += 0.25) {
            const a = fishTarget(fish('tailspotBlenny'), t, height);
            const b = fishTarget(fish('tailspotBlenny'), t + 0.1, height);
            if (a.behavior === 'perching' && b.behavior === 'perching') {
                restingIntervals++;
                expect(a.x).toBe(b.x);
            }
        }
        expect(restingIntervals).toBeGreaterThan(30);
    });
    it('separates initially overlapping fish instead of keeping them on one point', () => {
        const a = new THREE.Group(),
            b = new THREE.Group();
        const meshes = new Map([
            [1, a],
            [2, b]
        ]);
        for (let i = 1; i <= 180; i++) {
            advanceFishMotion(a, fish('clownfish', 1), i / 60, 1 / 60, {
                fishMeshes: meshes
            });
            advanceFishMotion(b, fish('clownfish', 2), i / 60, 1 / 60, {
                fishMeshes: meshes
            });
        }
        expect(a.position.distanceTo(b.position)).toBeGreaterThan(0.45);
    });
    it('keeps every species bounded and above surfaces over extended runs', () => {
        const species = [
            'clownfish',
            'royalGramma',
            'firefishGoby',
            'yellowTang',
            'blueHippoTang',
            'banggaiCardinal',
            'tailspotBlenny',
            'sixLineWrasse',
            'mandarinGoby',
            'flameAngel'
        ];
        for (const id of species) {
            for (let t = 0; t < 3600; t += 7) {
                const p = fishTarget(fish(id), t, height);
                expect(Math.abs(p.x)).toBeLessThanOrEqual(2.3);
                expect(Math.abs(p.z)).toBeLessThanOrEqual(1.08);
                expect(p.y).toBeGreaterThanOrEqual(
                    height(p.x, p.z) + p.clearance - 0.000001
                );
                expect(p.y).toBeLessThanOrEqual(1.08);
            }
        }
    });
});
