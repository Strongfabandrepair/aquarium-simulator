import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { PlacementController } from '../js/graphics/PlacementController.js';
import {
    validatePlacement,
    snapRotation
} from '../js/graphics/PlacementRules.js';
import { Habitat } from '../js/graphics/Habitat.js';
import { syncCoralPlacements } from '../js/graphics/CoralPlacement.js';

function editorFixture() {
    const state = {
        tankSpec: { shape: 'cube', width: 0.6 },
        equipment: {},
        corals: [{ id: 1, templateId: 'zoanthids', diameterM: 0.06 }],
        placedItems: [
            {
                id: 'coral-1',
                kind: 'coral',
                livestockId: 1,
                position: { x: 0, y: -0.3, z: 0 },
                normal: { x: 0, y: 1, z: 0 },
                rotation: 0,
                size: 0.06
            }
        ]
    };
    const scene = new THREE.Scene();
    const coral = new THREE.Group();
    coral.add(
        new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.04),
            new THREE.MeshBasicMaterial()
        )
    );
    coral.position.set(0, -0.28, 0);
    coral.userData = {
        id: 1,
        isCoral: true,
        placedItemId: 'coral-1',
        placementRadius: 0.03,
        coralRadius: 0.03,
        coralBaseOffset: 0.02,
        coralHeight: 0.04
    };
    scene.add(coral);
    const environment = new THREE.Group();
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.6),
        new THREE.MeshBasicMaterial()
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.3;
    floor.userData.type = 'bottom';
    environment.add(floor);
    scene.add(environment);
    const habitat = new Habitat(environment, state);
    const canvas = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 500,
            height: 500
        })
    };
    const onCommit = vi.fn();
    const editor = new PlacementController({
        scene,
        camera: new THREE.PerspectiveCamera(),
        canvas,
        getState: () => state,
        getHabitat: () => habitat,
        getMeshes: () => ({ coralMeshes: new Map([[1, coral]]) }),
        onCommit
    });
    return { editor, state, coral, onCommit, scene, habitat };
}

describe('interactive placement editor', () => {
    it('commits an actual raycast surface click and preserves contact and yaw after reload', () => {
        const { editor, state, coral, onCommit, habitat } = editorFixture();
        editor.camera.position.set(0, 0.7, 0.5);
        editor.camera.lookAt(0, -0.3, 0);
        editor.camera.updateMatrixWorld(true);
        const target = new THREE.Vector3(0.12, -0.3, 0.03);
        const ndc = target.clone().project(editor.camera);
        const event = {
            clientX: (ndc.x + 1) * 250,
            clientY: (1 - ndc.y) * 250
        };
        const before = JSON.stringify(state.placedItems);
        editor.begin({ kind: 'coral', livestockId: 1 });
        editor.pointerMove(event);
        editor.setRotation(46);
        expect(editor.pending.valid).toBe(true);
        expect(JSON.stringify(state.placedItems)).toBe(before);
        editor.click(event);
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(state.placedItems[0].position.x).toBeCloseTo(target.x);
        expect(state.placedItems[0].position.z).toBeCloseTo(target.z);
        const saved = JSON.parse(JSON.stringify(state));
        const restoredHabitat = new Habitat(habitat.environment, saved);
        syncCoralPlacements(
            saved.corals,
            new Map([[1, coral]]),
            restoredHabitat
        );
        expect(coral.position.x).toBeCloseTo(target.x);
        expect(coral.position.z).toBeCloseTo(target.z);
        expect(coral.rotation.y).toBeCloseTo(Math.PI / 4);
        expect(saved.placedItems[0].position.y).toBeCloseTo(-0.3);
    });

    it('retains a raycast contact and surface-normal alignment on a sloped rock', () => {
        const { editor, state, coral, habitat } = editorFixture();
        const rock = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.06, 0.2),
            new THREE.MeshBasicMaterial()
        );
        rock.position.set(0, -0.2, 0);
        rock.rotation.z = 0.2;
        rock.userData = { type: 'rock', placedItemId: 'rock-1' };
        habitat.environment.add(rock);
        state.placedItems.push({
            id: 'rock-1',
            kind: 'rock',
            position: { x: 0, y: -0.23, z: 0 },
            size: 0.3
        });
        const tiltedHabitat = new Habitat(habitat.environment, state);
        editor.getHabitat = () => tiltedHabitat;
        const surface = tiltedHabitat.sample(0.025, 0);
        editor.camera.position.set(0, 0.8, 0.4);
        editor.camera.lookAt(surface.x, surface.y, surface.z);
        editor.camera.updateMatrixWorld(true);
        const event = { clientX: 250, clientY: 250 };
        editor.begin({ kind: 'coral', livestockId: 1 });
        editor.pointerMove(event);
        expect(editor.pending.valid).toBe(true);
        editor.setRotation(30);
        editor.click(event);
        const savedContact = { ...state.placedItems[0].position };
        syncCoralPlacements(state.corals, new Map([[1, coral]]), tiltedHabitat);
        expect(state.placedItems[0].position.x).toBeCloseTo(savedContact.x);
        expect(state.placedItems[0].position.y).toBeCloseTo(savedContact.y);
        expect(state.placedItems[0].rotation).toBeCloseTo(Math.PI / 6);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(coral.quaternion);
        expect(up.distanceTo(surface.normal)).toBeLessThan(0.0001);
    });

    it('keeps saved contact when growth needs more room instead of silently relocating', () => {
        const { state, coral, habitat } = editorFixture();
        state.placedItems[0].position.x = 0.25;
        state.corals[0].diameterM = 0.06;
        const meshes = new Map([[1, coral]]);
        syncCoralPlacements(state.corals, meshes, habitat);
        expect(coral.visible).toBe(true);
        const saved = { ...state.placedItems[0].position };
        state.corals[0].diameterM = 0.2;
        syncCoralPlacements(state.corals, meshes, habitat);
        expect(state.placedItems[0].position).toEqual(saved);
        expect(state.corals[0].placementStatus).toBe('needs-placement');
        expect(coral.visible).toBe(false);
        expect(coral.userData.placementRadius).toBeCloseTo(0.1);
    });

    it('keeps preview, rotation and cancellation out of saved state', () => {
        const { editor, state, coral } = editorFixture();
        const before = JSON.stringify(state);
        const beforePosition = coral.position.clone();
        expect(editor.begin({ kind: 'coral', livestockId: 1 })).toBe(true);
        editor.setPreview(
            new THREE.Vector3(0.12, -0.3, 0),
            new THREE.Vector3(0, 1, 0)
        );
        editor.setRotation(31);
        expect(editor.rotation).toBe(30);
        expect(JSON.stringify(state)).toBe(before);
        expect(coral.position.equals(beforePosition)).toBe(true);
        editor.cancel();
        expect(JSON.stringify(state)).toBe(before);
        expect(editor.preview).toBeNull();
    });
    it('rejects invalid placement and saves exactly one valid move of a purchased animal', () => {
        const { editor, state, onCommit } = editorFixture();
        expect(editor.begin({ kind: 'coral', livestockId: 999 })).toBe(false);
        expect(editor.begin({ kind: 'rock', id: 'invented' })).toBe(false);
        editor.begin({ kind: 'coral', livestockId: 1 });
        editor.setPreview(
            new THREE.Vector3(0.31, -0.3, 0),
            new THREE.Vector3(0, 1, 0)
        );
        expect(editor.pending.valid).toBe(false);
        expect(editor.commit()).toBe(false);
        expect(onCommit).not.toHaveBeenCalled();
        editor.setPreview(
            new THREE.Vector3(0.12, -0.1, 0),
            new THREE.Vector3(0, 1, 0)
        );
        expect(editor.pending.valid).toBe(false);
        expect(editor.commit()).toBe(false);
        editor.setPreview(
            new THREE.Vector3(0.12, -0.3, 0),
            new THREE.Vector3(0, 1, 0)
        );
        editor.setRotation(46);
        expect(editor.commit()).toBe(true);
        expect(onCommit).toHaveBeenCalledTimes(1);
        expect(state.placedItems).toHaveLength(1);
        expect(state.placedItems[0].position.x).toBe(0.12);
        expect(state.placedItems[0].rotation).toBeCloseTo(Math.PI / 4);
        expect(editor.commit()).toBe(false);
    });
    it('checks curved boundaries, neighbors and water level', () => {
        const base = {
            point: { x: 0, y: -0.3, z: 0 },
            normal: { x: 0, y: 1, z: 0 },
            radius: 0.04,
            height: 0.08,
            spec: { shape: 'cylinder', width: 0.6, height: 0.6, depth: 0.6 },
            kind: 'coral'
        };
        expect(validatePlacement(base).valid).toBe(true);
        expect(
            validatePlacement({ ...base, point: { x: 0.22, y: -0.3, z: 0.22 } })
                .valid
        ).toBe(false);
        expect(
            validatePlacement({ ...base, point: { x: 0, y: 0.25, z: 0 } }).valid
        ).toBe(false);
        expect(
            validatePlacement({
                ...base,
                occupied: [
                    {
                        id: 'other',
                        kind: 'coral',
                        x: 0,
                        z: 0,
                        radius: 0.03,
                        minY: -0.3,
                        maxY: -0.2
                    }
                ]
            }).valid
        ).toBe(false);
        expect(snapRotation(37)).toBe(30);
    });
});
