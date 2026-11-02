import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { GameEngine } from '../js/engine/GameEngine.js';
import { TankBuilder } from '../js/graphics/TankBuilder.js';
import { LivestockRenderer } from '../js/graphics/LivestockRenderer.js';
import { UIController } from '../js/ui/UIController.js';

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('review regressions', () => {
    it('releases shared group resources once without destroying cached textures', () => {
        const geometry = new THREE.BoxGeometry();
        const texture = new THREE.Texture();
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const group = new THREE.Group();
        group.add(
            new THREE.Mesh(geometry, material),
            new THREE.Mesh(geometry, material)
        );
        const geoDispose = vi.spyOn(geometry, 'dispose');
        const matDispose = vi.spyOn(material, 'dispose');
        const texDispose = vi.spyOn(texture, 'dispose');
        TankBuilder.disposeGroup(group);
        expect(geoDispose).toHaveBeenCalledTimes(1);
        expect(matDispose).toHaveBeenCalledTimes(1);
        expect(texDispose).not.toHaveBeenCalled();
    });

    it('interpolates fish consistently across display refresh rates', () => {
        const fish = {
            templateId: 'yellowTang',
            alive: true,
            x: 0.9,
            y: 0.5,
            z: 0.8
        };
        const slow = new THREE.Group();
        const fast = new THREE.Group();
        for (let i = 0; i < 30; i++)
            LivestockRenderer.updateFishAnimation(slow, fish, 0, 1 / 30);
        for (let i = 0; i < 144; i++)
            LivestockRenderer.updateFishAnimation(fast, fish, 0, 1 / 144);
        expect(slow.position.distanceTo(fast.position)).toBeLessThan(1e-10);
    });

    it('accepts only one quiz answer while feedback is visible', () => {
        vi.useFakeTimers();
        vi.stubGlobal('document', { querySelectorAll: () => [] });
        vi.spyOn(UIController, 'showToast').mockImplementation(() => {});
        const engine = Object.create(GameEngine.prototype);
        engine.currentQuiz = {
            currentQuestionIndex: 0,
            score: 0,
            answers: [],
            questions: [
                { options: ['a', 'b'], correct: 0, explanation: 'yes' },
                { options: ['a', 'b'], correct: 0, explanation: 'yes' }
            ]
        };
        engine.showQuizQuestion = vi.fn();
        engine.submitQuizAnswer(0);
        engine.submitQuizAnswer(0);
        expect(engine.currentQuiz.score).toBe(1);
        expect(engine.currentQuiz.currentQuestionIndex).toBe(1);
        vi.advanceTimersByTime(1500);
        expect(engine.showQuizQuestion).toHaveBeenCalledTimes(1);
    });

    it('does not repaint the dashboard for unchanged animation frames', () => {
        vi.spyOn(UIController, 'renderAll').mockImplementation(() => {});
        const engine = Object.create(GameEngine.prototype);
        engine.store = { state: {} };
        engine.renderer = { render: vi.fn() };
        engine._uiDirty = true;
        engine.render(false);
        engine.render(false);
        expect(UIController.renderAll).toHaveBeenCalledTimes(1);
        expect(engine.renderer.render).toHaveBeenCalledTimes(2);
    });
});
