import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    normalizeTankSpec,
    getTankSpec,
    tankVolumeLiters,
    containsPoint,
    constrainPoint,
    tankOutline,
    substrateHeight
} from '../js/model/TankGeometry.js';
import { TankBuilder } from '../js/graphics/TankBuilder.js';

describe('metre-scale tank domain', () => {
    it('uses plausible preset dimensions and sanitizes invalid values', () => {
        expect(getTankSpec({ tankSize: 'medium' }).width).toBe(1.22);
        expect(
            normalizeTankSpec({ shape: 'bad', width: -1, height: Infinity })
        ).toEqual(getTankSpec({}));
        expect(
            normalizeTankSpec({
                shape: 'cube',
                width: 0.6,
                height: 2,
                depth: 0.3
            })
        ).toEqual({ shape: 'cube', width: 0.6, height: 0.6, depth: 0.6 });
    });
    for (const shape of ['rectangular', 'cube', 'cylinder', 'bowfront']) {
        it(`${shape} volume agrees with its rendered footprint and confinement keeps animals inside`, () => {
            const spec = normalizeTankSpec({
                shape,
                width: 1,
                height: 0.5,
                depth: 0.6
            });
            const outline = tankOutline(spec, 128);
            const area =
                Math.abs(
                    outline.reduce((sum, p, i) => {
                        const q = outline[(i + 1) % outline.length];
                        return sum + p.x * q.z - q.x * p.z;
                    }, 0)
                ) / 2;
            expect(area * (spec.height - 0.025) * 1000).toBeCloseTo(
                tankVolumeLiters(spec),
                0
            );
            for (let i = 0; i < 100; i++) {
                const bounded = constrainPoint(
                    spec,
                    {
                        x: Math.sin(i) * 3,
                        y: Math.cos(i) * 2,
                        z: Math.cos(i) * 3
                    },
                    0.04
                );
                expect(containsPoint(spec, bounded.x, bounded.z, 0.04)).toBe(
                    true
                );
                expect(bounded.y).toBeGreaterThanOrEqual(
                    -spec.height / 2 + 0.04
                );
                expect(bounded.y).toBeLessThanOrEqual(
                    spec.height / 2 - 0.025 - 0.04
                );
            }
        });
    }
    it('rejects rectangular corner space outside cylindrical and bowed glass', () => {
        expect(containsPoint({ shape: 'cylinder', width: 1 }, 0.46, 0.46)).toBe(
            false
        );
        expect(
            containsPoint(
                { shape: 'bowfront', width: 1, depth: 0.5 },
                0.48,
                0.24
            )
        ).toBe(false);
        expect(
            containsPoint(
                { shape: 'rectangular', width: 1, depth: 0.5 },
                0.48,
                0.24
            )
        ).toBe(true);
    });
});

describe('physical environment construction', () => {
    for (const shape of ['rectangular', 'cube', 'cylinder', 'bowfront']) {
        it(`${shape} has a supported raycastable floor and persistent rock inventory`, () => {
            const state = {
                tankSpec: { shape, width: 0.8, height: 0.5, depth: 0.5 },
                equipment: { tank: true, substrate: 20, liveRock: 20 },
                placedItems: []
            };
            const scene = new THREE.Scene();
            TankBuilder.buildEnvironment(scene, state);
            const group = scene.userData.tankEnvironmentGroup;
            expect(group.userData.units).toBe('meters');
            expect(state.placedItems).toHaveLength(3);
            const sand = group.children.find((c) => c.userData.type === 'sand');
            const ray = new THREE.Raycaster(
                new THREE.Vector3(0, 2, 0),
                new THREE.Vector3(0, -1, 0)
            );
            expect(ray.intersectObject(sand)[0].point.y).toBeCloseTo(
                -getTankSpec(state).height / 2 + substrateHeight(state),
                6
            );
            const rocks = group.children.find(
                (c) => c.userData.type === 'rocks'
            );
            expect(rocks.children).toHaveLength(3);
            for (const rock of rocks.children) {
                const bounds = new THREE.Box3().setFromObject(rock);
                expect(bounds.min.y).toBeCloseTo(
                    -getTankSpec(state).height / 2 + substrateHeight(state),
                    6
                );
                expect(bounds.max.x - bounds.min.x).toBeLessThan(0.3);
                expect(rock.userData.placedItemId).toBeTruthy();
            }
            TankBuilder.buildEnvironment(scene, state);
            expect(scene.userData.tankEnvironmentGroup).toBe(group);
            state.placedItems = [];
            TankBuilder.buildEnvironment(scene, state);
            expect(state.placedItems).toEqual([]);
            expect(
                scene.userData.tankEnvironmentGroup.children.find(
                    (c) => c.userData.type === 'rocks'
                ).children
            ).toHaveLength(0);
        });
    }
    it('purchased equipment has identifiable models, including previously invisible purchases', () => {
        const ids = [
            'heater',
            'powerhead',
            'wavemaker',
            'proteinSkimmer',
            'lightReef',
            'returnPump',
            'thermometer',
            'autoTopOff',
            'dosingPump',
            'sump',
            'mediaReactor',
            'uvSterilizer',
            'macroAlgae',
            'quarantineTank',
            'rodiUnit',
            'testKit',
            'refractometer',
            'saltMix'
        ];
        const state = {
            tankSize: 'large',
            equipment: Object.fromEntries(
                ['tank', ...ids].map((id) => [id, true])
            )
        };
        const scene = new THREE.Scene();
        TankBuilder.buildEnvironment(scene, state);
        const equipment = scene.userData.tankEnvironmentGroup.children.filter(
            (c) => c.userData.equipmentId
        );
        expect(equipment.map((c) => c.userData.equipmentId).sort()).toEqual(
            ids.sort()
        );
        for (const item of equipment) {
            expect(item.children.length).toBeGreaterThan(0);
            const box = new THREE.Box3().setFromObject(item);
            expect(Number.isFinite(box.min.x)).toBe(true);
            expect(box.max.x - box.min.x).toBeLessThan(1.5);
        }
    });
});
