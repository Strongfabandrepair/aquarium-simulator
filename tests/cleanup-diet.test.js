import { describe, it, expect } from 'vitest';
import { GameState } from '../js/engine/GameState.js';
import { LivestockEngine } from '../js/model/LivestockEngine.js';
import { WaterChemistry } from '../js/model/WaterChemistry.js';

describe('cleanup diets', () => {
    for (const species of [
        'nassariusSnail',
        'cleanerShrimp',
        'peppermintShrimp'
    ]) {
        it(`${species} does not remove algae, including older saved cohorts`, () => {
            const state = new GameState().reset('medium', 'Diet');
            state.algaeLevel = 30;
            const crew = LivestockEngine.addCleanup(state, species);
            crew.algaeReduce = 1; // Old saves stored the incorrect diet.
            WaterChemistry.tick(state, 1);
            expect(state.algaeLevel).toBe(30);
        });
    }
    it('turbo snails still graze algae', () => {
        const state = new GameState().reset('medium', 'Diet');
        state.algaeLevel = 30;
        LivestockEngine.addCleanup(state, 'turboSnail');
        WaterChemistry.tick(state, 1);
        expect(state.algaeLevel).toBeLessThan(30);
    });
});
