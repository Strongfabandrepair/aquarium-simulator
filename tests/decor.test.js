import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { GameState } from '../js/engine/GameState.js';
import { StoreService } from '../js/model/StoreService.js';
import { DECOR_CATALOG, planDecorPlacement } from '../js/model/DecorCatalog.js';
import { createDecor } from '../js/graphics/DecorModels.js';
import { containsPoint, getTankSpec } from '../js/model/TankGeometry.js';

describe('purchased decor', () => {
    it('all silhouettes fit their physical footprint and sit at the floor', () => {
        for (const t of DECOR_CATALOG) {
            const mesh = createDecor({ ...t, templateId: t.id });
            mesh.updateMatrixWorld(true);
            const b = new THREE.Box3().setFromObject(mesh);
            expect(b.min.y).toBeCloseTo(0, 5);
            expect(
                Math.hypot(b.max.x - b.min.x, b.max.z - b.min.z)
            ).toBeLessThanOrEqual(t.size + 0.00001);
            expect(b.max.y).toBeLessThan(t.size);
        }
    });
    for (const shape of ['rectangular', 'cube', 'cylinder', 'bowfront'])
        it(`finds separated positions and refuses a full ${shape}`, () => {
            const state = new GameState().state;
            state.tankSpec = { shape, width: 0.4, height: 0.4, depth: 0.4 };
            state.equipment.tank = true;
            state.budget = 9999;
            const t = DECOR_CATALOG[0];
            let p;
            while ((p = planDecorPlacement(state, t))) {
                expect(
                    containsPoint(
                        getTankSpec(state),
                        p.position.x,
                        p.position.z,
                        t.size / 2
                    )
                ).toBe(true);
                state.placedItems.push({
                    ...p,
                    id: `p${state.placedItems.length}`
                });
                expect(state.placedItems.length).toBeLessThan(50);
            }
            expect(StoreService.canPurchaseEquipment(state, t.id).canBuy).toBe(
                false
            );
            expect(state.equipment.liveRock).toBe(0);
        });
    it('requires a tank and switches an owned backdrop without charging', () => {
        const state = new GameState().state;
        expect(
            StoreService.canPurchaseEquipment(state, 'backgroundReef').canBuy
        ).toBe(false);
        state.equipment.tank = true;
        state.equipment.backgroundReef = true;
        state.budget = 0;
        expect(
            StoreService.canPurchaseEquipment(state, 'backgroundReef')
        ).toEqual({ canBuy: true, price: 0 });
        state.activeBackground = 'backgroundReef';
        const restored = new GameState();
        restored.loadFromSnapshot(JSON.parse(JSON.stringify(state)));
        expect(restored.state.activeBackground).toBe('backgroundReef');
    });
});
