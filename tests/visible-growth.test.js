import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { GameState } from '../js/engine/GameState.js';
import { initializeAnimal, tickHusbandry } from '../js/model/Husbandry.js';
import { getSpecies } from '../js/model/SpeciesCatalog.js';
import { scaleWildlife } from '../js/graphics/LivestockRenderer.js';

describe('visible species-bounded growth', () => {
    for (const [kind, id, collection] of [
        ['fish', 'clownfish', 'livestock'],
        ['coral', 'zoanthids', 'corals'],
        ['cleanup', 'turboSnail', 'cleanupCrew']
    ]) {
        it(`${kind} visibly grows, survives serialization and stops at adult size`, () => {
            const state = new GameState().state;
            state.water.salinity = 35;
            state.water.temperature = 78;
            state.equipment.lightReef = true;
            state.equipment.lightOn = true;
            state.algaeLevel = 20;
            const animal = {
                id: 'growth',
                templateId: id,
                health: 100,
                alive: true,
                lastMealDay: state.day
            };
            state[collection].push(animal);
            initializeAnimal(animal, kind, state);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.5));
            scaleWildlife(mesh, animal, kind);
            const initial = mesh.scale.x;
            tickHusbandry(state, 24);
            scaleWildlife(mesh, animal, kind);
            expect(mesh.scale.x).toBeGreaterThan(initial);
            const saved = JSON.parse(JSON.stringify(animal));
            initializeAnimal(saved, kind, state);
            expect(saved[kind === 'coral' ? 'diameterM' : 'lengthM']).toBe(
                animal[kind === 'coral' ? 'diameterM' : 'lengthM']
            );
            tickHusbandry(state, 24 * 10000);
            scaleWildlife(mesh, animal, kind);
            expect(mesh.scale.x).toBeCloseTo(getSpecies(id).adultLengthM);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
    }
    it('repairs oversized saved animals and reconstructs missing size with the same maturation curve', () => {
        const state = new GameState().state;
        const animal = { templateId: 'clownfish', growthProgress: 0.5 };
        const species = getSpecies('clownfish');
        initializeAnimal(animal, 'fish', state);
        expect(animal.lengthM).toBeCloseTo(
            species.juvenileLengthM +
                (species.adultLengthM - species.juvenileLengthM) * 0.75
        );
        animal.lengthM = 100;
        initializeAnimal(animal, 'fish', state);
        expect(animal.lengthM).toBe(species.adultLengthM);
    });
});
