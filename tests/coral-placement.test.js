import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Habitat } from '../js/graphics/Habitat.js';
import { syncCoralPlacements } from '../js/graphics/CoralPlacement.js';
import { LivestockRenderer } from '../js/graphics/LivestockRenderer.js';

function aquascape(tankSize = 'medium') {
    const env = new THREE.Group();
    const sand = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.02, 0.33));
    sand.position.y = -0.255;
    sand.userData.type = 'sand';
    env.add(sand);
    const rocks = new THREE.Group();
    rocks.userData.type = 'rocks';
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.15));
    ledge.position.set(0, -0.195, 0);
    rocks.add(ledge);
    env.add(rocks);
    return new Habitat(env, { tankSize });
}

const species = [
    'zoanthids',
    'mushrooms',
    'greenStarPolyps',
    'xeniaCorals',
    'hammerCoral',
    'torchCoral',
    'frogspawn',
    'acropora',
    'birdsnest',
    'montipora'
];
function colonies(count) {
    const corals = Array.from({ length: count }, (_, id) => ({
        id,
        templateId: species[id % species.length],
        x: 0,
        y: 0.8,
        z: 0,
        health: 100,
        scale: 1
    }));
    const meshes = new Map(
        corals.map((coral) => [
            coral.id,
            LivestockRenderer.createCoralMesh(coral)
        ])
    );
    return { corals, meshes };
}

describe('aquascape contacts and coral placement', () => {
    it('samples actual substrate/rock tops while ignoring equipment', () => {
        const habitat = aquascape();
        expect(habitat.sample(0, 0).y).toBeCloseTo(-0.145);
        expect(habitat.sample(0, 0).type).toBe('rock');
        expect(habitat.sample(2, 0).y).toBeCloseTo(-0.245);
        expect(habitat.sample(0, 0, { sandOnly: true }).type).toBe('sand');
        expect(habitat.sample(0, 0).normal.y).toBeCloseTo(1);
        expect(new Habitat(null).sample(0, 0).y).toBe(-0.265);
    });

    for (const [tankSize, count] of [
        ['nano', 8],
        ['medium', 20],
        ['large', 40]
    ]) {
        it(`seats ${count} ${tankSize} colonies on surfaces with separate footprints`, () => {
            const habitat = aquascape(tankSize);
            const { corals, meshes } = colonies(count);
            syncCoralPlacements(corals, meshes, habitat);
            for (const coral of corals) {
                const mesh = meshes.get(coral.id);
                if (!mesh.visible) {
                    expect(coral.placementStatus).toBe('needs-placement');
                    continue;
                }
                const contact = habitat.sample(
                    mesh.position.x,
                    mesh.position.z
                );
                expect(
                    mesh.position.y -
                        mesh.userData.coralBaseOffset * mesh.scale.x
                ).toBeCloseTo(contact.y - 0.001);
                expect(
                    Math.abs(mesh.position.x) + mesh.userData.placementRadius
                ).toBeLessThan(2.9);
                expect(
                    Math.abs(mesh.position.z) + mesh.userData.placementRadius
                ).toBeLessThan(1.4);
                for (const other of meshes.values()) {
                    if (other === mesh || !other.visible) continue;
                    const distance = Math.hypot(
                        mesh.position.x - other.position.x,
                        mesh.position.z - other.position.z
                    );
                    expect(distance).toBeGreaterThanOrEqual(
                        mesh.userData.placementRadius +
                            other.userData.placementRadius
                    );
                }
            }
            const before = corals.map((coral) => [coral.x, coral.y, coral.z]);
            syncCoralPlacements(corals, meshes, habitat);
            expect(corals.map((coral) => [coral.x, coral.y, coral.z])).toEqual(
                before
            );
        });
    }

    it('prefers raised rock for SPS and re-seats colonies after substrate changes', () => {
        const { corals, meshes } = colonies(10);
        // Give the light-demanding colony first choice; later colonies may need
        // fallback substrate positions when the finite rock ledge is occupied.
        corals.unshift(corals.splice(7, 1)[0]);
        const habitat = aquascape();
        syncCoralPlacements(corals, meshes, habitat);
        expect(meshes.get(7).userData.habitat).toBe('rock');
        const bare = new Habitat(null);
        syncCoralPlacements(corals, meshes, bare);
        for (const mesh of meshes.values()) {
            expect(mesh.userData.surfaceY).toBe(-0.265);
            expect(mesh.userData.habitat).toBe('bottom');
        }
    });
});
