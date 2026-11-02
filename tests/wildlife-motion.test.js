import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { LivestockRenderer } from '../js/graphics/LivestockRenderer.js';
import {
    createCoralModel,
    animateCoralModel
} from '../js/graphics/CoralModels.js';
import {
    createInvertebrateModel,
    animateInvertebrateModel
} from '../js/graphics/InvertebrateModels.js';

describe('wildlife motion', () => {
    it('holds a stationary fish position and heading without accumulating wiggles', () => {
        const mesh = new THREE.Group();
        mesh.rotation.y = 0.7;
        const fish = {
            id: 1,
            templateId: 'clownfish',
            x: 0.5,
            y: 0.5,
            z: 0.5,
            alive: true
        };
        for (let i = 0; i < 600; i++)
            LivestockRenderer.updateFishAnimation(
                mesh,
                fish,
                (i * 1000) / 60,
                1 / 60
            );
        expect(mesh.position.length()).toBe(0);
        expect(mesh.rotation.y).toBe(0.7);
    });
    it('keeps cleanup paths bounded over a long animation', () => {
        const mesh = new THREE.Group();
        const animal = { id: '1:2', templateId: 'turboSnail', alive: true };
        for (let t = 0; t < 3600000; t += 1000) {
            LivestockRenderer.updateCleanupAnimation(mesh, animal, t, 1 / 60);
            expect(Math.abs(mesh.position.x)).toBeLessThanOrEqual(2.94);
            expect(mesh.position.y).toBeGreaterThanOrEqual(-1.15);
            expect(mesh.position.y).toBeLessThanOrEqual(1.12);
            expect(Math.abs(mesh.position.z)).toBeLessThanOrEqual(1.25);
        }
    });
    it('pulses xenia and moves shrimp appendages without moving model roots', () => {
        const coral = createCoralModel({}, 'xeniaCorals');
        animateCoralModel(coral, { health: 100 }, 0);
        const scale = coral.userData.motions[0].group.scale.x;
        animateCoralModel(coral, { health: 100 }, 1);
        expect(coral.userData.motions[0].group.scale.x).not.toBe(scale);
        expect(coral.position.length()).toBe(0);
        const shrimp = createInvertebrateModel({}, 'cleanerShrimp');
        animateInvertebrateModel(shrimp, { alive: true }, 0);
        const rotation = shrimp.userData.legs[0].group.rotation.y;
        animateInvertebrateModel(shrimp, { alive: true }, 1);
        expect(shrimp.userData.legs[0].group.rotation.y).not.toBe(rotation);
        expect(shrimp.position.length()).toBe(0);
    });
});
