import { describe, it, expect } from 'vitest';
import { createInvertebrateModel } from '../js/graphics/InvertebrateModels.js';
import { createCoralModel } from '../js/graphics/CoralModels.js';
import { fishTarget } from '../js/graphics/FishMotion.js';
import {
    NEW_FISH,
    NEW_CORALS,
    NEW_CLEANUP
} from '../js/model/SpeciesCatalog.js';
describe('expanded marine inhabitants', () => {
    it('serpent star has exactly five arms and no crab legs or shells', () => {
        const mesh = createInvertebrateModel({ templateId: 'serpentStar' });
        expect(mesh.userData.starArms).toHaveLength(5);
        expect(mesh.userData.legs).toHaveLength(0);
    });
    it('anemone has an oral disc and 64 separately animated tentacles', () => {
        const mesh = createCoralModel({ templateId: 'bubbleTipAnemone' });
        expect(mesh.userData.motions).toHaveLength(64);
        expect(
            NEW_CORALS.find((s) => s.id === 'bubbleTipAnemone').calcConsume
        ).toBe(0);
    });
    it('clownfish uses a living placed anemone and stops hosting a dead one', () => {
        const host = {
            id: 'host',
            templateId: 'bubbleTipAnemone',
            health: 100,
            diameterM: 0.15
        };
        const state = {
            corals: [host],
            placedItems: [
                { livestockId: 'host', position: { x: 0, y: -0.1, z: 0 } }
            ]
        };
        const fish = { id: 'clown', templateId: 'clownfish', lengthM: 0.05 };
        expect(fishTarget(fish, 1, () => -0.25, null, state).behavior).toBe(
            'hosting'
        );
        host.alive = false;
        expect(fishTarget(fish, 1, () => -0.25, null, state).behavior).not.toBe(
            'hosting'
        );
    });
    it('puffer care explains reef risks and star is not an algae remover', () => {
        expect(
            NEW_FISH.find((s) => s.id === 'valentiniPuffer').incompatible
        ).toContain('corals');
        expect(
            NEW_CLEANUP.find((s) => s.id === 'serpentStar').algaeReduce
        ).toBe(0);
    });
});
