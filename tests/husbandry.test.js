import { describe, it, expect } from 'vitest';
import { GameState } from '../js/engine/GameState.js';
import { LivestockEngine } from '../js/model/LivestockEngine.js';
import { getSpecies } from '../js/model/SpeciesCatalog.js';
import {
    acceptsFood,
    feedLivestock,
    initializeAnimal,
    tickHusbandry,
    removeDeadLivestock
} from '../js/model/Husbandry.js';

function tank() {
    const s = new GameState().reset('medium', 'Husbandry');
    s.day = 10;
    s.hour = 12;
    s.minute = 0;
    s.water.salinity = 35;
    s.water.temperature = 78;
    s.equipment.lightReef = true;
    s.equipment.lightOn = true;
    return s;
}
function animal(id, templateId, extra = {}) {
    return {
        id,
        templateId,
        name: templateId,
        health: 90,
        alive: true,
        addedDay: 1,
        lastMealDay: 1,
        ...extra
    };
}

describe('species feeding and maturation', () => {
    it('matches appropriate diets and keeps copepod specialists distinct from mixed food', () => {
        expect(acceptsFood(getSpecies('mandarinGoby'), 'mixed')).toBe(false);
        expect(acceptsFood(getSpecies('mandarinGoby'), 'copepods')).toBe(true);
        expect(acceptsFood(getSpecies('turboSnail'), 'algae')).toBe(true);
        expect(acceptsFood(getSpecies('turboSnail'), 'meaty')).toBe(false);
        expect(acceptsFood(getSpecies('nassariusSnail'), 'meaty')).toBe(true);
        expect(acceptsFood(getSpecies('lyretailAnthias'), 'plankton')).toBe(
            true
        );
    });

    it('feeding only nourishes matching living animals and records a positioned food event', () => {
        const s = tank();
        const mandarin = animal(1, 'mandarinGoby'),
            gramma = animal(2, 'royalGramma');
        const dead = animal(3, 'clownfish', { health: 0, alive: false });
        s.livestock.push(mandarin, gramma, dead);
        expect(feedLivestock(s, 'meaty')).toBe(true);
        expect(mandarin.lastMealDay).toBe(1);
        expect(mandarin.health).toBe(90);
        expect(gramma.lastMealDay).toBe(10);
        expect(gramma.health).toBeGreaterThan(90);
        expect(dead.health).toBe(0);
        const first = s.feedingEvent;
        feedLivestock(s, 'copepods');
        expect(mandarin.lastMealDay).toBe(10);
        expect(s.feedingEvent.id).toBeGreaterThan(first.id);
        expect(
            Object.values(s.feedingEvent.position).every(Number.isFinite)
        ).toBe(true);
        expect(feedLivestock(s, 'invalid')).toBe(false);
        expect(s.feedingEvent.id).toBe(first.id + 1);
    });

    it('healthy fed fish mature while hungry or unhealthy fish stop growing', () => {
        const s = tank();
        const fed = animal(1, 'royalGramma', { lastMealDay: 10 });
        const hungry = animal(2, 'royalGramma');
        const stressed = animal(3, 'royalGramma', {
            lastMealDay: 10,
            health: 30
        });
        s.livestock.push(fed, hungry, stressed);
        for (const f of s.livestock) initializeAnimal(f, 'fish', s);
        const juvenile = fed.lengthM;
        tickHusbandry(s, 24);
        expect(fed.lengthM).toBeGreaterThan(juvenile);
        expect(hungry.lengthM).toBe(juvenile);
        expect(stressed.lengthM).toBe(juvenile);
        expect(fed.ageDays).toBe(10);
        tickHusbandry(s, 24 * 10000);
        expect(fed.lengthM).toBe(getSpecies('royalGramma').adultLengthM);
        expect(fed.growthProgress).toBe(1);
    });

    it('coral growth responds to illumination and reaches a bounded colony diameter', () => {
        const s = tank(),
            coral = animal(1, 'zoanthids', { health: 100 });
        s.corals.push(coral);
        initializeAnimal(coral, 'coral', s);
        const diameter = coral.diameterM;
        s.equipment.lightOn = false;
        tickHusbandry(s, 24);
        expect(coral.diameterM).toBe(diameter);
        s.equipment.lightOn = true;
        tickHusbandry(s, 24);
        expect(coral.diameterM).toBeGreaterThan(diameter);
        tickHusbandry(s, 24 * 10000);
        expect(coral.diameterM).toBe(getSpecies('zoanthids').adultLengthM);
    });

    it('JSON save/load preserves maturity, physical sizes and meal history', () => {
        const s = tank();
        s.livestock.push(animal(1, 'clownfish', { lastMealDay: 10 }));
        s.corals.push(animal(1, 'hammerCoral'));
        feedLivestock(s, 'mixed');
        tickHusbandry(s, 240);
        const restored = new GameState();
        restored.loadFromSnapshot(JSON.parse(JSON.stringify(s)));
        const fish = restored.state.livestock[0],
            coral = restored.state.corals[0];
        initializeAnimal(fish, 'fish', restored.state);
        initializeAnimal(coral, 'coral', restored.state);
        expect(fish.lengthM).toBe(s.livestock[0].lengthM);
        expect(coral.diameterM).toBe(s.corals[0].diameterM);
        expect(fish.lastMealHours).toBe(s.livestock[0].lastMealHours);
        tickHusbandry(restored.state, 1);
        expect(fish.lengthM).toBeGreaterThanOrEqual(s.livestock[0].lengthM);
    });
});

describe('mortality and removal', () => {
    it('dead coral cannot recover or grow when lights and feeding return', () => {
        const s = tank(),
            coral = animal(7, 'zoanthids', {
                health: 0,
                alive: false,
                diameterM: 0.08
            });
        s.corals.push(coral);
        for (let i = 0; i < 3; i++) {
            feedLivestock(s, 'plankton');
            LivestockEngine.tick(s, 1);
            tickHusbandry(s, 1);
        }
        expect(coral.health).toBe(0);
        expect(coral.alive).toBe(false);
        expect(coral.diameterM).toBe(0.08);
        expect(
            s.journal.filter((entry) => entry.text.includes('has died'))
        ).toHaveLength(1);
    });

    it('toxic water kills cleanup animals and starving scavengers also deteriorate', () => {
        const toxic = tank(),
            crew = animal(1, 'cleanerShrimp', {
                health: 2,
                count: 1,
                lastMealDay: 10
            });
        toxic.cleanupCrew.push(crew);
        toxic.water.ammonia = 2;
        toxic.water.salinity = 25;
        toxic.water.temperature = 88;
        tickHusbandry(toxic, 1);
        expect(crew.alive).toBe(false);
        expect(crew.health).toBe(0);
        const hungry = tank(),
            snail = animal(1, 'nassariusSnail', { health: 0.1, count: 5 });
        hungry.cleanupCrew.push(snail);
        tickHusbandry(hungry, 1);
        expect(snail.alive).toBe(false);
        const grazers = tank(),
            turbo = animal(1, 'turboSnail', { count: 5 });
        grazers.algaeLevel = 20;
        grazers.cleanupCrew.push(turbo);
        tickHusbandry(grazers, 1);
        expect(turbo.health).toBeGreaterThan(90);
    });

    it('removing remains stops their ammonia load and preserves living livestock', () => {
        const s = tank();
        s.livestock.push(
            animal(1, 'clownfish', { health: 0, alive: false }),
            animal(2, 'royalGramma', { lastMealDay: 10 })
        );
        s.corals.push(animal(3, 'zoanthids', { health: 0, alive: false }));
        s.cleanupCrew.push(
            animal(4, 'nassariusSnail', { health: 0, alive: false, count: 5 })
        );
        s.placedItems = [
            { kind: 'coral', livestockId: 3, id: 'coral-3' },
            { kind: 'rock', id: 'rock-1' }
        ];
        tickHusbandry(s, 1);
        expect(s.water.ammonia).toBeGreaterThan(0);
        expect(removeDeadLivestock(s, 'fish', 2)).toBe(false);
        expect(removeDeadLivestock(s, 'fish', '1')).toBe(true);
        expect(removeDeadLivestock(s, 'coral', 3)).toBe(true);
        expect(removeDeadLivestock(s, 'cleanup', 4)).toBe(true);
        expect(removeDeadLivestock(s, 'fish', 1)).toBe(false);
        expect(removeDeadLivestock(s, 'invalid', 1)).toBe(false);
        const after = s.water.ammonia;
        tickHusbandry(s, 24);
        expect(s.water.ammonia).toBe(after);
        expect(s.livestock.map((a) => a.id)).toEqual([2]);
        expect(s.placedItems).toEqual([{ kind: 'rock', id: 'rock-1' }]);
    });
});
