import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { TankBuilder } from '../js/graphics/TankBuilder.js';
import { GameState } from '../js/engine/GameState.js';
import { initializeAnimal, tickHusbandry } from '../js/model/Husbandry.js';
import { getSpecies } from '../js/model/SpeciesCatalog.js';
import { LivestockEngine } from '../js/model/LivestockEngine.js';

describe('physical scene and save regressions', () => {
    it('coral growth does not rebuild the static tank environment', () => {
        const scene = new THREE.Scene();
        const state = new GameState().state;
        TankBuilder.buildEnvironment(scene, state);
        const environment = scene.userData.tankEnvironmentGroup;
        state.placedItems.push({
            id: 'coral-1',
            kind: 'coral',
            size: 0.05,
            position: { x: 0, y: 0, z: 0 }
        });
        TankBuilder.buildEnvironment(scene, state);
        expect(scene.userData.tankEnvironmentGroup).toBe(environment);
        state.placedItems[0].size = 0.1;
        TankBuilder.buildEnvironment(scene, state);
        expect(scene.userData.tankEnvironmentGroup).toBe(environment);
    });
    it('infers growth progress when a saved physical size predates maturity metadata', () => {
        const state = new GameState().state;
        const fish = LivestockEngine.addFish(state, 'clownfish');
        fish.lengthM = getSpecies('clownfish').adultLengthM;
        initializeAnimal(fish, 'fish', state);
        tickHusbandry(state, 0.25);
        expect(fish.lengthM).toBeCloseTo(getSpecies('clownfish').adultLengthM);
    });
    it('new animals do not inherit an old tanks starvation age', () => {
        const state = new GameState().state;
        state.day = 100;
        state.lastFed = 1;
        const fish = LivestockEngine.addFish(state, 'clownfish');
        initializeAnimal(fish, 'fish', state);
        expect(fish.lastMealDay).toBe(100);
    });
    it('rejects incomplete position vectors from old or malformed snapshots', () => {
        const game = new GameState();
        game.loadFromSnapshot({
            placedItems: [{ kind: 'coral', position: { x: 0 } }]
        });
        expect(game.state.placedItems).toEqual([]);
    });
    it('buying a replacement cleaner creates a living cohort without reviving remains', () => {
        const state = new GameState().state;
        const dead = LivestockEngine.addCleanup(state, 'turboSnail');
        dead.alive = false;
        dead.health = 0;
        const next = LivestockEngine.addCleanup(state, 'turboSnail');
        initializeAnimal(next, 'cleanup', state);
        expect(next.id).not.toBe(dead.id);
        expect(next.alive).toBe(true);
        expect(dead.alive).toBe(false);
    });
});
