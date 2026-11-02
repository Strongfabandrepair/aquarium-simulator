import { describe, it, expect } from 'vitest';
import { GameState } from '../js/engine/GameState.js';
import { WaterChemistry } from '../js/model/WaterChemistry.js';
import { StoreService } from '../js/model/StoreService.js';

function cyclingTank() {
    const state = new GameState().reset('medium', 'Cycle regression');
    state.started = true;
    state.cycleDay = 1;
    state.ghostFedForCycle = true;
    state.water.salinity = 35;
    state.water.ammonia = 0.4;
    Object.assign(state.equipment, {
        tank: true,
        heater: true,
        powerhead: true,
        autoTopOff: true,
        lightReef: true,
        lightOn: true
    });
    return state;
}

describe('nitrogen cycle with nutrient export', () => {
    for (const [label, equipment] of [
        ['no export', {}],
        ['skimmer', { proteinSkimmer: true, proteinSkimmerOn: true }],
        ['macroalgae', { macroAlgae: true }],
        [
            'skimmer and macroalgae',
            { proteinSkimmer: true, proteinSkimmerOn: true, macroAlgae: true }
        ]
    ]) {
        it(`completes a ghost-fed cycle with ${label} and unlocks all livestock categories`, () => {
            const state = cyclingTank();
            Object.assign(state.equipment, equipment);
            for (let i = 0; i < 96 * 15; i++) WaterChemistry.tick(state, 0.25);
            expect(state.cycleComplete).toBe(true);
            expect(state.phase).toBeGreaterThanOrEqual(2);
            expect(
                StoreService.canPurchaseFish(state, 'clownfish').canBuy
            ).toBe(true);
            expect(
                StoreService.canPurchaseCoral(state, 'zoanthids').canBuy
            ).toBe(true);
            expect(
                StoreService.canPurchaseCleanup(state, 'cleanerShrimp').canBuy
            ).toBe(true);
            expect(
                state.journal.filter((entry) =>
                    entry.text.includes('Cycle Complete')
                )
            ).toHaveLength(1);
        });
    }

    it('recovers an already-stalled saved tank with zero nitrate on its next tick', () => {
        const snapshot = cyclingTank();
        snapshot.cycleDay = 25;
        Object.assign(snapshot.water, { ammonia: 0, nitrite: 0, nitrate: 0 });
        Object.assign(snapshot.equipment, {
            proteinSkimmer: true,
            macroAlgae: true
        });
        const game = new GameState();
        game.loadFromSnapshot(JSON.parse(JSON.stringify(snapshot)));
        WaterChemistry.tick(game.state, 0.25);
        expect(game.state.cycleComplete).toBe(true);
        expect(game.state.water.nitrate).toBe(0);
    });

    for (const [label, patch, water] of [
        ['immature cycle', { cycleDay: 5 }, {}],
        ['no ammonia source', { cycleDay: 20, ghostFedForCycle: false }, {}],
        ['ammonia remains', { cycleDay: 20 }, { ammonia: 2 }],
        ['nitrite remains', { cycleDay: 20 }, { nitrite: 2 }]
    ]) {
        it(`does not unlock livestock when ${label}`, () => {
            const state = cyclingTank();
            Object.assign(state, patch);
            Object.assign(
                state.water,
                { ammonia: 0, nitrite: 0, nitrate: 0 },
                water
            );
            WaterChemistry.tick(state, 0.25);
            expect(state.cycleComplete).toBe(false);
            expect(
                StoreService.canPurchaseFish(state, 'clownfish').canBuy
            ).toBe(false);
        });
    }
});
