import { it, expect } from 'vitest';
import { GameState } from '../js/engine/GameState.js';
import { LivestockEngine } from '../js/model/LivestockEngine.js';
import { WaterChemistry } from '../js/model/WaterChemistry.js';

it('initial salt preparation finishes in 24 simulated hours', () => {
    const s = new GameState().state;
    s.equipment.tank = true;
    s.water.salinity = 10;
    s.saltMixing = true;
    for (let i = 0; i < 96; i++) WaterChemistry.tick(s, 0.25);
    expect(s.water.salinity).toBeGreaterThanOrEqual(35);
    expect(s.saltMixing).toBe(false);
});

it('severe sustained water stress can kill fish instead of clamping them alive', () => {
    const s = new GameState().state;
    LivestockEngine.addFish(s, 'clownfish');
    s.water.ammonia = 10;
    s.water.temperature = 90;
    s.water.salinity = 10;
    for (let i = 0; i < 200; i++) LivestockEngine.tick(s, 0.25);
    expect(s.livestock[0].alive).toBe(false);
    expect(s.livestock[0].health).toBe(0);
    expect(
        s.journal.filter((entry) => entry.text.includes('passed away'))
    ).toHaveLength(1);
});
