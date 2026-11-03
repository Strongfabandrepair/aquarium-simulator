import { getSpecies } from './SpeciesCatalog.js';
import { getTankSpec, waterLevel } from './TankGeometry.js';

export const FOOD_TYPES = ['mixed', 'algae', 'meaty', 'plankton', 'copepods'];
export const simulationHours = (state) =>
    state.day * 24 + state.hour + state.minute / 60;

export function acceptsFood(species, food) {
    const diet = species?.diet || 'mixed';
    if (Array.isArray(diet))
        return diet.some((value) => acceptsFood({ diet: value }, food));
    if (food === 'mixed') return diet !== 'copepods';
    return (
        diet === food ||
        diet === 'mixed' ||
        (diet === 'meaty' && food === 'plankton')
    );
}

export function initializeAnimal(animal, kind, state) {
    const species = getSpecies(animal.templateId);
    const adult = species?.adultLengthM || (kind === 'coral' ? 0.2 : 0.1);
    const juvenile = species?.juvenileLengthM || adult * 0.5;
    const key = kind === 'coral' ? 'diameterM' : 'lengthM';
    if (!Number.isFinite(animal.growthProgress)) {
        const fraction = Number.isFinite(animal[key])
            ? Math.max(
                  0,
                  Math.min(
                      1,
                      (animal[key] - juvenile) /
                          Math.max(0.001, adult - juvenile)
                  )
              )
            : 0;
        animal.growthProgress = 1 - Math.sqrt(1 - fraction);
    }
    animal.ageDays ??= Math.max(0, state.day - (animal.addedDay ?? state.day));
    animal.growthProgress = Math.max(0, Math.min(1, animal.growthProgress));
    const matureSize =
        juvenile +
        (adult - juvenile) * (1 - Math.pow(1 - animal.growthProgress, 2));
    animal[key] = Number.isFinite(animal[key])
        ? Math.max(juvenile, Math.min(adult, animal[key]))
        : matureSize;
    animal.lastMealDay ??= Math.max(
        state.lastFed || 0,
        animal.addedDay ?? state.day
    );
    animal.health ??= 100;
    animal.alive ??= animal.health > 0;
}

export function feedLivestock(state, food = 'mixed') {
    if (!FOOD_TYPES.includes(food)) return false;
    const tank = getTankSpec(state);
    state.feedingEvent = {
        id: (state.feedingEvent?.id || 0) + 1,
        timeHours: simulationHours(state),
        diet: food,
        position: { x: 0, y: waterLevel(tank) - 0.025, z: tank.depth * 0.16 }
    };
    for (const [kind, animals] of [
        ['fish', state.livestock],
        ['cleanup', state.cleanupCrew],
        ['coral', state.corals]
    ]) {
        for (const animal of animals) {
            initializeAnimal(animal, kind, state);
            if (
                animal.alive &&
                acceptsFood(getSpecies(animal.templateId), food)
            ) {
                animal.lastMealDay = state.day;
                animal.lastMealHours = simulationHours(state);
                animal.health = Math.min(100, animal.health + 0.4);
            }
        }
    }
    return true;
}

export function tickHusbandry(state, hours) {
    if (!Number.isFinite(hours) || hours <= 0) return;
    for (const [kind, animals] of [
        ['fish', state.livestock],
        ['coral', state.corals],
        ['cleanup', state.cleanupCrew]
    ]) {
        for (const animal of animals) {
            initializeAnimal(animal, kind, state);
            if (kind === 'cleanup' && animal.alive) {
                const water = state.water;
                const stress =
                    (water.ammonia > 0.1 ? 1.5 : 0) +
                    (water.salinity < 30 || water.salinity > 38 ? 1 : 0) +
                    (water.temperature < 72 || water.temperature > 85
                        ? 0.5
                        : 0);
                const grazing =
                    getSpecies(animal.templateId)?.diet === 'algae' &&
                    state.algaeLevel > 5;
                const hungry = !grazing && state.day - animal.lastMealDay > 4;
                animal.health = Math.max(
                    0,
                    Math.min(
                        100,
                        animal.health +
                            (stress || hungry
                                ? -stress - (hungry ? 0.3 : 0)
                                : 0.08) *
                                hours
                    )
                );
            }
            if (animal.health <= 0) animal.alive = false;
            if (!animal.alive) {
                if (!animal.deathRecorded) {
                    animal.deathRecorded = true;
                    state.journal.push({
                        time: `Day ${state.day}`,
                        text: `${animal.name} has died. Remove the remains.`,
                        tip: 'Investigate water quality, feeding and compatibility before replacing livestock.'
                    });
                }
                // A simple decay load keeps prompt removal meaningful.
                state.water.ammonia +=
                    (0.008 * hours * (animal.count || 1) * 55) /
                    Math.max(10, state.tankGallons);
                continue;
            }
            animal.ageDays += hours / 24;
            const species = getSpecies(animal.templateId);
            const litCoral =
                kind === 'coral' &&
                state.equipment.lightOn &&
                (state.equipment.lightBasic || state.equipment.lightReef);
            const grazing = species?.diet === 'algae' && state.algaeLevel > 5;
            const nourished =
                kind === 'coral'
                    ? litCoral
                    : grazing || state.day - animal.lastMealDay <= 2;
            const condition =
                nourished && animal.health >= 70 ? animal.health / 100 : 0;
            animal.growthProgress = Math.min(
                1,
                animal.growthProgress +
                    (hours / 24 / (species?.growthDays || 365)) * condition
            );
            const adult =
                species?.adultLengthM || (kind === 'coral' ? 0.2 : 0.1);
            const juvenile = species?.juvenileLengthM || adult * 0.5;
            // Smooth maturation: rapid early growth tapers toward adult size.
            const growth = 1 - Math.pow(1 - animal.growthProgress, 2);
            animal[kind === 'coral' ? 'diameterM' : 'lengthM'] =
                juvenile + (adult - juvenile) * growth;
        }
    }
}

export function removeDeadLivestock(state, kind, id) {
    const key = { fish: 'livestock', coral: 'corals', cleanup: 'cleanupCrew' }[
        kind
    ];
    if (!key) return false;
    const index = state[key].findIndex(
        (animal) => String(animal.id) === String(id)
    );
    const animal = state[key][index];
    if (!animal || (animal.alive !== false && animal.health > 0)) return false;
    state[key].splice(index, 1);
    if (kind === 'coral')
        state.placedItems = state.placedItems.filter(
            (item) =>
                !(
                    item.kind === 'coral' &&
                    String(item.livestockId) === String(id)
                )
        );
    state.journal.push({
        time: `Day ${state.day}`,
        text: `Removed remains of ${animal.name}.`,
        tip: 'Removal stops further decay from this animal; test water and investigate the cause.'
    });
    return true;
}
