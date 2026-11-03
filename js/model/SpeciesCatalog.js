// Maximum adult lengths are rounded husbandry reference values, in meters.
// Colony diameters and growth times are illustrative aquarium targets, not predictions.
export const SPECIES_SOURCES = [
    'https://australian.museum/learn/animals/fishes/blue-tang-paracanthurus-hepatus/',
    'https://aqua.org/explore/animals/banggai-cardinalfish',
    'https://www.fishbase.se/summary/Pseudanthias-squamipinnis.html',
    'https://www.fishbase.se/summary/Chromis-viridis.html',
    'https://www.fishbase.se/summary/Cryptocentrus-cinctus.html'
];
const rows = [
    ['valentiniPuffer', 0.11, 0.035, 700, 'hover', 'meaty'],
    ['orchidDottyback', 0.075, 0.03, 500, 'cave', 'meaty'],
    ['serpentStar', 0.25, 0.07, 900, 'nocturnal', 'meaty'],
    ['bubbleTipAnemone', 0.3, 0.07, 900, 'colony', 'meaty'],
    ['clownfish', 0.11, 0.045, 500, 'territorial', 'mixed'],
    ['royalGramma', 0.08, 0.035, 400, 'cave', 'meaty'],
    ['firefishGoby', 0.09, 0.04, 400, 'hover', 'plankton'],
    ['yellowTang', 0.2, 0.065, 900, 'cruise', 'algae'],
    ['blueHippoTang', 0.3, 0.07, 1100, 'cruise', 'mixed'],
    ['banggaiCardinal', 0.08, 0.035, 450, 'hover', 'meaty'],
    ['tailspotBlenny', 0.06, 0.03, 360, 'perch', 'algae'],
    ['sixLineWrasse', 0.1, 0.035, 500, 'weave', 'meaty'],
    ['mandarinGoby', 0.08, 0.035, 500, 'bottom', 'copepods'],
    ['flameAngel', 0.1, 0.04, 600, 'weave', 'mixed'],
    ['lyretailAnthias', 0.15, 0.055, 600, 'school', 'plankton', 'royalGramma'],
    ['greenChromis', 0.1, 0.035, 500, 'school', 'plankton', 'clownfish'],
    ['yellowWatchmanGoby', 0.1, 0.04, 500, 'bottom', 'meaty', 'tailspotBlenny'],
    ['zoanthids', 0.22, 0.055, 600, 'colony', 'plankton'],
    ['greenStarPolyps', 0.3, 0.06, 500, 'colony', 'plankton'],
    ['mushrooms', 0.18, 0.05, 600, 'colony', 'plankton'],
    ['xeniaCorals', 0.24, 0.055, 400, 'colony', 'plankton'],
    ['hammerCoral', 0.28, 0.07, 800, 'colony', 'meaty'],
    ['torchCoral', 0.3, 0.08, 850, 'colony', 'meaty'],
    ['frogspawn', 0.28, 0.07, 800, 'colony', 'meaty'],
    ['acropora', 0.35, 0.055, 1000, 'colony', 'plankton'],
    ['montipora', 0.4, 0.06, 900, 'colony', 'plankton'],
    ['birdsnest', 0.25, 0.055, 800, 'colony', 'plankton'],
    ['toadstoolLeather', 0.35, 0.07, 850, 'colony', 'plankton', 'mushrooms'],
    ['candyCaneCoral', 0.22, 0.055, 800, 'colony', 'meaty', 'hammerCoral'],
    ['hermitCrab', 0.035, 0.016, 450, 'crawl', 'mixed'],
    ['turboSnail', 0.055, 0.022, 600, 'graze', 'algae'],
    ['nassariusSnail', 0.025, 0.012, 400, 'burrow', 'meaty'],
    ['emeraldCrab', 0.05, 0.02, 500, 'crawl', 'algae'],
    ['cleanerShrimp', 0.06, 0.025, 450, 'station', 'meaty'],
    ['peppermintShrimp', 0.05, 0.022, 450, 'nocturnal', 'meaty'],
    ['trochusSnail', 0.04, 0.018, 500, 'graze', 'algae', 'turboSnail'],
    ['cerithSnail', 0.035, 0.015, 500, 'burrow', 'mixed', 'nassariusSnail']
];
export const SPECIES = Object.fromEntries(
    rows.map(
        ([
            id,
            adultLengthM,
            juvenileLengthM,
            growthDays,
            movement,
            diet,
            model
        ]) => [
            id,
            {
                id,
                adultLengthM,
                juvenileLengthM,
                growthDays,
                movement,
                diet,
                model: model || id
            }
        ]
    )
);
export function getSpecies(id) {
    return SPECIES[id] || SPECIES.clownfish;
}
export function physicalSize(animal, kind = 'fish') {
    const species = getSpecies(animal.templateId);
    const value = kind === 'coral' ? animal.diameterM : animal.lengthM;
    return Number.isFinite(value) && value > 0
        ? Math.min(species.adultLengthM, Math.max(0.005, value))
        : species.juvenileLengthM;
}
const fish = (id, name, price, minTank, desc) => ({
    id,
    name,
    price,
    minTank,
    desc,
    icon: '🐟',
    difficulty: 'medium',
    care: 'Provide mature marine water, shelter, compatible tankmates and the indicated diet.',
    compat: ['peaceful reef fish'],
    incompatible: ['aggressive predators'],
    maxPer: id === 'yellowWatchmanGoby' ? 1 : 8,
    size: 'small',
    realPrice: 'Varies',
    feedRate: 0.25,
    nitrateContrib: 0.4,
    o2Consume: 0.08
});
export const NEW_FISH = [
    {
        ...fish(
            'valentiniPuffer',
            'Saddle Valentini Puffer',
            45,
            30,
            'Rounded sharpnose puffer with dark saddles, spotted flanks and yellow fins. Not reef safe: may eat shrimp, snails and nip corals.'
        ),
        maxPer: 1,
        care: 'Feed varied meaty foods including shelled foods for tooth wear. Keep away from vulnerable invertebrates; never provoke inflation.',
        incompatible: ['shrimp', 'snails', 'corals'],
        compat: ['compatible fish-only community']
    },
    {
        ...fish(
            'orchidDottyback',
            'Orchid Dottyback',
            35,
            30,
            'Purple reef-cave resident with a dark eye stripe; provide crevices and meaty foods.'
        ),
        maxPer: 1
    },
    fish(
        'lyretailAnthias',
        'Lyretail Anthias',
        45,
        125,
        'Orange-pink planktivore with a lyre tail; swims above the reef in loose shoals.'
    ),
    fish(
        'greenChromis',
        'Blue-green Chromis',
        18,
        30,
        'Iridescent blue-green damselfish; loose open-water shoals with individual spacing.'
    ),
    fish(
        'yellowWatchmanGoby',
        'Yellow Watchman Goby',
        30,
        30,
        'Yellow, blue-spotted burrow sentinel; perches near the substrate and picks meaty food.'
    )
];
export const NEW_CORALS = [
    {
        id: 'bubbleTipAnemone',
        name: 'Bubble-tip Anemone',
        icon: '🪸',
        price: 65,
        difficulty: 'hard',
        type: 'anemone',
        lightNeed: 'high',
        alkConsume: 0,
        calcConsume: 0,
        flowNeed: 'moderate',
        minTank: 30,
        desc: 'A host sea anemone, not a coral: fleshy oral disc with rose bubble-tipped tentacles.',
        care: 'Requires an established stable aquarium, strong reef lighting and guarded pump intakes. Can wander and sting neighbors. Clownfish hosting is not guaranteed in real tanks.',
        realPrice: 'Varies'
    },

    {
        id: 'toadstoolLeather',
        name: 'Toadstool Leather',
        icon: '🪸',
        price: 40,
        difficulty: 'easy',
        type: 'soft',
        lightNeed: 'moderate',
        alkConsume: 0.05,
        calcConsume: 0.2,
        flowNeed: 'moderate',
        minTank: 20,
        desc: 'A stalked leather coral with a broad crown and fine extended polyps.',
        care: 'Provide moderate flow and room for its crown.',
        realPrice: 'Varies'
    },
    {
        id: 'candyCaneCoral',
        name: 'Candy Cane Coral',
        icon: '🪸',
        price: 45,
        difficulty: 'easy',
        type: 'lps',
        lightNeed: 'moderate',
        alkConsume: 0.5,
        calcConsume: 2,
        flowNeed: 'low',
        minTank: 20,
        desc: 'Branching hard coral with fleshy green oral discs.',
        care: 'Feed small meaty particles and leave room between colonies.',
        realPrice: 'Varies'
    }
];
export const NEW_CLEANUP = [
    {
        id: 'serpentStar',
        name: 'Banded Serpent Star',
        icon: '⭐',
        price: 25,
        realPrice: 'Varies',
        desc: 'Five slender jointed arms surround a small central disc; a nocturnal scavenger, not an algae eater.',
        count: 1,
        algaeReduce: 0,
        care: 'Target-feed meaty food and provide rock crevices; acclimate carefully to stable salinity.'
    },

    {
        id: 'trochusSnail',
        name: 'Trochus Snail',
        icon: '🐌',
        price: 5,
        realPrice: 'Varies',
        desc: 'Conical algae grazer that explores rock and sand.',
        count: 1,
        algaeReduce: 0.8,
        care: 'Provide established algae and stable salinity.'
    },
    {
        id: 'cerithSnail',
        name: 'Cerith Snail',
        icon: '🐌',
        price: 3,
        realPrice: 'Varies',
        desc: 'Slender detritus grazer that searches sandy substrate.',
        count: 1,
        algaeReduce: 0.4,
        care: 'Provide mature substrate and stable salinity.'
    }
];
