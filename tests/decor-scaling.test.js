import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { PlacementController } from '../js/graphics/PlacementController.js';
import { Habitat } from '../js/graphics/Habitat.js';
function fixture() {
    const item = {
        id: 'rock1',
        kind: 'rock',
        size: 0.1,
        position: { x: 0, y: -0.3, z: 0 },
        normal: { x: 0, y: 1, z: 0 },
        rotation: 0
    };
    const state = {
        tankSpec: { shape: 'cube', width: 0.6 },
        equipment: {},
        corals: [],
        placedItems: [item]
    };
    const scene = new THREE.Scene(),
        environment = new THREE.Group();
    scene.add(environment);
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.6),
        new THREE.MeshBasicMaterial()
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.3;
    floor.userData.type = 'bottom';
    environment.add(floor);
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    geometry.translate(0, 0.05, 0);
    const rock = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    rock.position.set(0, -0.3, 0);
    rock.userData = { type: 'rock', placedItemId: item.id };
    environment.add(rock);
    const editor = new PlacementController({
        scene,
        camera: new THREE.PerspectiveCamera(),
        canvas: { addEventListener: vi.fn(), removeEventListener: vi.fn() },
        getState: () => state,
        getHabitat: () => new Habitat(environment, state),
        getMeshes: () => ({ rockMeshes: new Map([[item.id, rock]]) })
    });
    return { editor, item, state, rock, environment };
}
describe('per-item decor scale', () => {
    it('previews without mutation, cancels cleanly, commits and never compounds percentages', () => {
        const { editor, item, rock } = fixture();
        editor.begin({ kind: 'rock', id: item.id });
        editor.setScale(150);
        expect(item.size).toBe(0.1);
        expect(rock.scale.x).toBe(1);
        expect(editor.preview.scale.x).toBeCloseTo(1.5);
        editor.cancel();
        expect(item.baseSize).toBeUndefined();
        editor.begin({ kind: 'rock', id: item.id });
        editor.setScale(150);
        expect(editor.commit()).toBe(true);
        expect(item.baseSize).toBe(0.1);
        expect(item.size).toBeCloseTo(0.15);
        editor.begin({ kind: 'rock', id: item.id });
        editor.setScale(200);
        expect(editor.preview.scale.x).toBeCloseTo(2);
        expect(editor.commit()).toBe(true);
        expect(item.size).toBeCloseTo(0.2);
        expect(item.baseSize).toBe(0.1);
        editor.begin({ kind: 'rock', id: item.id });
        editor.setScale(100);
        editor.commit();
        expect(item.size).toBeCloseTo(0.1);
        expect(rock.scale.x).toBeCloseTo(1);
    });
    it('rejects enlarged footprints at the wall and preserves saved size', () => {
        const { editor, item, rock } = fixture();
        item.position.x = 0.22;
        rock.position.x = 0.22;
        editor.begin({ kind: 'rock', id: item.id });
        editor.setScale(200);
        expect(editor.pending.valid).toBe(false);
        expect(editor.commit()).toBe(false);
        expect(item.size).toBe(0.1);
    });
    it('blocks resizing rock that supports another placement', () => {
        const { editor, item, state } = fixture();
        state.placedItems.push({
            id: 'attached',
            kind: 'coral',
            supportId: item.id
        });
        expect(editor.begin({ kind: 'rock', id: item.id })).toBe(false);
    });
    it('requires a wide enough supporting ledge after enlargement', () => {
        const { editor, item, rock, environment } = fixture();
        const pedestal = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.05, 0.08),
            new THREE.MeshBasicMaterial()
        );
        pedestal.position.set(0, -0.275, 0);
        pedestal.userData = { type: 'rock', placedItemId: 'pedestal' };
        environment.add(pedestal);
        item.position.y = -0.25;
        item.supportId = 'pedestal';
        rock.position.y = -0.25;
        editor.begin({ kind: 'rock', id: item.id });
        editor.setScale(100);
        expect(editor.pending.valid).toBe(true);
        editor.setScale(200);
        expect(editor.pending.valid).toBe(false);
        expect(editor.pending.reason).toContain('wider');
        expect(editor.commit()).toBe(false);
    });
    it('rejects enlargement into a neighboring object', () => {
        const { editor, item, environment } = fixture();
        const neighbor = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshBasicMaterial()
        );
        neighbor.position.set(0.14, -0.25, 0);
        neighbor.userData = { type: 'rock', placedItemId: 'neighbor' };
        environment.add(neighbor);
        editor.getMeshes = () => ({});
        editor.begin({ kind: 'rock', id: item.id });
        editor.setScale(200);
        expect(editor.pending.valid).toBe(false);
        expect(editor.commit()).toBe(false);
    });
});
