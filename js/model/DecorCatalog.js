import {
    getTankSpec,
    containsPoint,
    substrateHeight,
    waterLevel
} from './TankGeometry.js';

export const DECOR_CATALOG = [
    {
        id: 'limestonePebble',
        name: 'Ivory Limestone Pebble',
        size: 0.07,
        color: 0xc9bda0,
        shape: 'pebble',
        price: 12
    },
    {
        id: 'corallineBoulder',
        name: 'Purple Coralline Boulder',
        size: 0.18,
        color: 0x89677f,
        shape: 'boulder',
        price: 35
    },
    {
        id: 'slateShelf',
        name: 'Slate Reef Shelf',
        size: 0.22,
        color: 0x465860,
        shape: 'shelf',
        price: 30
    },
    {
        id: 'reefArch',
        name: 'Sandstone Reef Arch',
        size: 0.24,
        color: 0xb6a17b,
        shape: 'arch',
        price: 45
    },
    {
        id: 'shipwreck',
        name: 'Sunken Sailing Ship',
        size: 0.25,
        color: 0x65412c,
        shape: 'ship',
        price: 65
    },
    {
        id: 'treasureChest',
        name: 'Sunken Treasure Chest',
        size: 0.13,
        color: 0x70462b,
        shape: 'chest',
        price: 28
    }
];
export const BACKGROUNDS = [
    {
        id: 'backgroundOcean',
        name: 'Blue Ocean Depths',
        price: 25,
        colors: ['#032638', '#117d99', '#062b3c']
    },
    {
        id: 'backgroundReef',
        name: 'Distant Reef Panorama',
        price: 40,
        colors: ['#031c30', '#1b6d86', '#103c50']
    },
    {
        id: 'backgroundKelp',
        name: 'Kelp Forest Panorama',
        price: 35,
        colors: ['#123535', '#367f70', '#132d2d']
    }
];
export const DECOR_STORE = [
    ...DECOR_CATALOG.map((item) => ({
        ...item,
        category: 'decor',
        icon: '🪨',
        stackable: true,
        unlockPhase: 0,
        desc: `${Math.round(item.size * 100)} cm aquarium-safe decorative replica. Move and rotate in the Aquascape editor. No biological filtration credit.`
    })),
    ...BACKGROUNDS.map((item) => ({
        ...item,
        category: 'background',
        icon: '🖼️',
        unlockPhase: 0,
        desc: 'Exterior decorative backdrop. Adds visual depth without occupying swimming space. Click an owned background to switch for free; click the active one to hide it.'
    }))
];

// Find a free floor location before charging; a full tank must never spawn overlapping props.
export function planDecorPlacement(state, template) {
    const spec = getTankSpec(state),
        radius = template.size / 2;
    const y = -spec.height / 2 + substrateHeight(state);
    if (y + template.size > waterLevel(spec) - 0.005) return null;
    for (let row = 0; row < 21; row++)
        for (let col = 0; col < 29; col++) {
            const x = -spec.width / 2 + (spec.width * (col + 0.5)) / 29;
            const z = spec.depth / 2 - (spec.depth * (row + 0.5)) / 21;
            if (!containsPoint(spec, x, z, radius + 0.008)) continue;
            if (
                (state.placedItems || []).some(
                    (p) =>
                        Math.hypot(x - p.position.x, z - p.position.z) <
                        radius + (p.size || 0.1) / 2 + 0.015
                )
            )
                continue;
            return {
                kind: 'rock',
                templateId: template.id,
                name: template.name,
                size: template.size,
                position: { x, y, z },
                normal: { x: 0, y: 1, z: 0 },
                rotation: 0
            };
        }
    return null;
}
