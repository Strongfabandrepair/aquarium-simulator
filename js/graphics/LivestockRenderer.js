// Species construction and frame-rate-independent world-space locomotion.
import * as THREE from 'three';
import { createFishModel, animateFishModel } from './FishModels.js';
import { createCoralModel, animateCoralModel } from './CoralModels.js';
import {
    createInvertebrateModel,
    animateInvertebrateModel
} from './InvertebrateModels.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = (value, fallback) => (Number.isFinite(value) ? value : fallback);
const blend = (rate, delta) => 1 - Math.exp(-rate * delta);
const phaseFor = (id) => {
    let hash = 2166136261;
    for (const char of String(id ?? 0))
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return ((hash >>> 0) / 4294967296) * Math.PI * 2;
};
const angleDelta = (target, current) =>
    Math.atan2(Math.sin(target - current), Math.cos(target - current));

export class LivestockRenderer {
    static resolveTemplateId(templateId) {
        if (!templateId) return templateId;
        const aliases = {
            yellowtang: 'yellowTang',
            bluehippotang: 'blueHippoTang',
            royalgramma: 'royalGramma',
            firefishgoby: 'firefishGoby',
            banggaicardinal: 'banggaiCardinal',
            tailspotblenny: 'tailspotBlenny',
            sixlinewrasse: 'sixLineWrasse',
            mandaringoby: 'mandarinGoby',
            flameangel: 'flameAngel',
            pulsingxenia: 'xeniaCorals',
            xeniacorals: 'xeniaCorals',
            greenstarpolyps: 'greenStarPolyps',
            hammercoral: 'hammerCoral',
            torchcoral: 'torchCoral',
            hermitcrab: 'hermitCrab',
            turbosnail: 'turboSnail',
            nassariussnail: 'nassariusSnail',
            emeraldcrab: 'emeraldCrab',
            cleanershrimp: 'cleanerShrimp',
            peppermintshrimp: 'peppermintShrimp'
        };
        return aliases[String(templateId).toLowerCase()] || String(templateId);
    }

    static createFishMesh(fish) {
        const id = this.resolveTemplateId(fish.templateId);
        const mesh = createFishModel(fish, id) || new THREE.Group();
        Object.assign(mesh.userData, {
            id: fish.id,
            templateId: id,
            isFish: true,
            animationPhase: phaseFor(fish.id),
            swimSpeed: 0,
            turnRate: 0
        });
        mesh.position.set(
            (finite(fish.x, 0.5) - 0.5) * 5,
            (finite(fish.y, 0.5) - 0.5) * 2.2,
            (finite(fish.z, 0.5) - 0.5) * 2.2
        );
        mesh.rotation.order = 'YXZ';
        return mesh;
    }

    static updateFishAnimation(mesh, fish, time, delta = 1 / 60) {
        if (!mesh || !fish) return;
        const dt = clamp(finite(delta, 1 / 60), 0, 0.1);
        const seconds = finite(time, 0) * 0.001;
        const id = this.resolveTemplateId(fish.templateId);
        const data = mesh.userData;
        data.animationPhase ??= phaseFor(fish.id);
        if (fish.alive === false) {
            mesh.position.y = Math.max(-1.12, mesh.position.y - 0.16 * dt);
            mesh.rotation.x +=
                angleDelta(Math.PI, mesh.rotation.x) * blend(2, dt);
            data.swimSpeed = 0;
            return;
        }
        const targetX = (clamp(finite(fish.x, 0.5), 0.04, 0.96) - 0.5) * 5;
        const targetY = (clamp(finite(fish.y, 0.5), 0.04, 0.96) - 0.5) * 2.2;
        const targetZ = (clamp(finite(fish.z, 0.5), 0.04, 0.96) - 0.5) * 2.2;
        const dx = targetX - mesh.position.x;
        const dy = targetY - mesh.position.y;
        const dz = targetZ - mesh.position.z;
        const distance = Math.hypot(dx, dy, dz);
        // Exact exponential response gives the same position at any refresh rate.
        const response = fish.behaviorState === 'darting' ? 7 : 5;
        const move = blend(response, dt);
        mesh.position.x += dx * move;
        mesh.position.y += dy * move;
        mesh.position.z += dz * move;
        const speed = dt > 0 ? (distance * move) / dt : 0;
        data.swimSpeed =
            finite(data.swimSpeed, 0) +
            (speed - finite(data.swimSpeed, 0)) * blend(6, dt);
        // Hold heading while hovering: noisy near-zero velocities must not spin a fish.
        let turn = 0;
        if (Math.hypot(dx, dz) > 0.004) {
            turn = angleDelta(Math.atan2(-dz, dx), mesh.rotation.y);
            mesh.rotation.y += turn * blend(id === 'sixLineWrasse' ? 8 : 4, dt);
        }
        data.turnRate = turn;
        const pitch =
            distance > 0.008
                ? clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.35, 0.35)
                : 0;
        const bank = clamp(-turn * data.swimSpeed * 0.24, -0.32, 0.32);
        mesh.rotation.z += (pitch - mesh.rotation.z) * blend(4, dt);
        mesh.rotation.x += (bank - mesh.rotation.x) * blend(5, dt);
        // Species wiggles belong to the model rig, never accumulate on the world transform.
        animateFishModel(mesh, fish, seconds, dt);
    }

    static createCoralMesh(coral) {
        const id = this.resolveTemplateId(coral.templateId);
        const mesh = createCoralModel(coral, id) || new THREE.Group();
        const phase = phaseFor(coral.id);
        Object.assign(mesh.userData, {
            id: coral.id,
            templateId: id,
            isCoral: true,
            animationPhase: phase
        });
        mesh.position.set(
            finite(coral.x, Math.sin(phase) * 1.6),
            finite(coral.y, -1.15),
            finite(coral.z, Math.cos(phase) * 0.7)
        );
        mesh.rotation.y = phase;
        mesh.scale.setScalar(clamp(finite(coral.scale, 1), 0.4, 1.6));
        return mesh;
    }

    static updateCoralAnimation(mesh, coral, time, delta = 1 / 60) {
        if (!mesh || !coral) return;
        animateCoralModel(
            mesh,
            coral,
            finite(time, 0) * 0.001,
            clamp(finite(delta, 1 / 60), 0, 0.1)
        );
    }

    static createCleanupMesh(animal) {
        const id = this.resolveTemplateId(animal.templateId);
        const mesh = createInvertebrateModel(animal, id) || new THREE.Group();
        Object.assign(mesh.userData, {
            id: animal.id,
            templateId: id,
            isCleanup: true,
            animationPhase: phaseFor(animal.id),
            swimSpeed: 0
        });
        this.updateCleanupAnimation(mesh, animal, 0, 0);
        return mesh;
    }

    static updateCleanupAnimation(mesh, animal, time, delta = 1 / 60) {
        if (!mesh || !animal) return;
        const seconds = finite(time, 0) * 0.001;
        const phase = mesh.userData.animationPhase ?? phaseFor(animal.id);
        const id = this.resolveTemplateId(animal.templateId);
        const isSnail = id === 'turboSnail' || id === 'nassariusSnail';
        const isShrimp = id === 'cleanerShrimp' || id === 'peppermintShrimp';
        const rate = isSnail ? 0.009 : isShrimp ? 0.035 : 0.019;
        const t = seconds * rate + phase;
        // Stable elliptical foraging lanes in the foreground avoid intersecting central rocks.
        const radius = 1.4 + 0.65 * Math.abs(Math.sin(phase * 3));
        mesh.position.set(
            Math.sin(t) * radius,
            -1.15,
            0.86 + Math.cos(t) * 0.22
        );
        mesh.rotation.y = Math.atan2(Math.sin(t) * 0.22, Math.cos(t) * radius);
        mesh.userData.swimSpeed =
            rate * Math.hypot(Math.cos(t) * radius, Math.sin(t) * 0.22);
        animateInvertebrateModel(
            mesh,
            animal,
            seconds,
            clamp(finite(delta, 1 / 60), 0, 0.1)
        );
    }
}
