// Species construction and frame-rate-independent world-space locomotion.
import * as THREE from 'three';
import { physicalSize } from '../model/SpeciesCatalog.js';
import { getTankSpec, constrainPoint } from '../model/TankGeometry.js';

export function scaleWildlife(mesh, animal, kind = 'fish') {
    const target = physicalSize(animal, kind);
    if (!mesh.userData.modelLength) {
        const box = new THREE.Box3().setFromObject(mesh);
        mesh.userData.modelLength = Math.max(
            0.001,
            kind === 'coral'
                ? Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
                : box.max.x - box.min.x
        );
    }
    mesh.scale.setScalar(target / mesh.userData.modelLength);
    mesh.userData[kind === 'coral' ? 'physicalDiameterM' : 'physicalLengthM'] =
        target;
}
import { updateCleanupMotion } from './CleanupMotion.js';
import { createFishModel, animateFishModel } from './FishModels.js';
import { advanceFishMotion, fishTarget, habitatHeight } from './FishMotion.js';
import { createCoralModel, animateCoralModel } from './CoralModels.js';
import { measureCoralMount } from './CoralPlacement.js';
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

    static createFishMesh(fish, context = null, time = 0) {
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
        scaleWildlife(mesh, fish);
        const spec =
            context?.habitat?.spec || getTankSpec(context?.state || {});
        const initial = constrainPoint(
            spec,
            {
                x: (finite(fish.x, 0.5) - 0.5) * spec.width,
                y: (finite(fish.y, 0.5) - 0.5) * spec.height,
                z: (finite(fish.z, 0.5) - 0.5) * spec.depth
            },
            physicalSize(fish) * 0.55
        );
        mesh.position.set(initial.x, initial.y, initial.z);
        if (context) {
            const surfaceHeight =
                context.surfaceHeight ||
                ((x, z) => habitatHeight(context.habitat, x, z));
            const target = fishTarget(
                fish,
                time * 0.001,
                surfaceHeight,
                context.habitat,
                context.state
            );
            mesh.position.set(target.x, target.y, target.z);
            // Resolve an initial colony overlap even when the tank starts paused.
            advanceFishMotion(mesh, fish, time * 0.001, 1 / 60, context);
        }
        mesh.rotation.order = 'YXZ';
        return mesh;
    }

    static updateFishAnimation(
        mesh,
        fish,
        time,
        delta = 1 / 60,
        context = null
    ) {
        if (!mesh || !fish) return;
        scaleWildlife(mesh, fish);
        const spec =
            context?.habitat?.spec || getTankSpec(context?.state || {});
        const dt = clamp(finite(delta, 1 / 60), 0, 0.1);
        const seconds = finite(time, 0) * 0.001;
        const id = this.resolveTemplateId(fish.templateId);
        const data = mesh.userData;
        data.animationPhase ??= phaseFor(fish.id);
        data.dead = fish.alive === false;
        if (dt === 0) return;
        if (fish.alive === false) {
            mesh.position.y = Math.max(
                -spec.height / 2 + physicalSize(fish) * 0.2,
                mesh.position.y - physicalSize(fish) * 0.4 * dt
            );
            mesh.rotation.x +=
                angleDelta(Math.PI, mesh.rotation.x) * blend(2, dt);
            data.swimSpeed = 0;
            return;
        }
        if (context) {
            const oldX = mesh.position.x,
                oldY = mesh.position.y,
                oldZ = mesh.position.z;
            advanceFishMotion(mesh, fish, seconds, dt, context);
            const dx = mesh.position.x - oldX,
                dy = mesh.position.y - oldY,
                dz = mesh.position.z - oldZ;
            const speed = Math.hypot(dx, dy, dz) / dt;
            data.swimSpeed =
                finite(data.swimSpeed, 0) +
                (speed - finite(data.swimSpeed, 0)) * blend(6, dt);
            let turn = 0;
            if (Math.hypot(dx, dz) > 0.0001) {
                turn = angleDelta(Math.atan2(-dz, dx), mesh.rotation.y);
                mesh.rotation.y +=
                    turn * blend(id === 'sixLineWrasse' ? 8 : 4, dt);
            }
            data.turnRate = turn;
            const pitch =
                speed > 0.015
                    ? clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.35, 0.35)
                    : 0;
            mesh.rotation.z += (pitch - mesh.rotation.z) * blend(4, dt);
            mesh.rotation.x +=
                (clamp(-turn * speed * 0.24, -0.32, 0.32) - mesh.rotation.x) *
                blend(5, dt);
            animateFishModel(mesh, fish, seconds, dt);
            return;
        }
        const targetX =
            (clamp(finite(fish.x, 0.5), 0.04, 0.96) - 0.5) * spec.width;
        const targetY =
            (clamp(finite(fish.y, 0.5), 0.04, 0.96) - 0.5) * spec.height;
        const targetZ =
            (clamp(finite(fish.z, 0.5), 0.04, 0.96) - 0.5) * spec.depth;
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
            finite(coral.x, 0),
            finite(coral.y, -getTankSpec({}).height / 2),
            finite(coral.z, 0)
        );
        mesh.rotation.y = phase;
        measureCoralMount(mesh);
        mesh.userData.physicalDiameterM = physicalSize(coral, 'coral');
        mesh.scale.setScalar(
            mesh.userData.physicalDiameterM / (2 * mesh.userData.coralRadius)
        );
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

    static createCleanupMesh(animal, context = {}) {
        const id = this.resolveTemplateId(animal.templateId);
        const mesh = createInvertebrateModel(animal, id) || new THREE.Group();
        Object.assign(mesh.userData, {
            id: animal.id,
            templateId: id,
            isCleanup: true,
            animationPhase: phaseFor(animal.id),
            swimSpeed: 0
        });
        // Cleaner animals are smaller than the fish; preserve a common local
        // surface-contact origin while scaling their entire anatomy together.
        scaleWildlife(mesh, animal, 'cleanup');
        this.updateCleanupAnimation(mesh, animal, 0, 0, context);
        return mesh;
    }

    static updateCleanupAnimation(
        mesh,
        animal,
        time,
        delta = 1 / 60,
        context = {}
    ) {
        if (!mesh || !animal) return;
        scaleWildlife(mesh, animal, 'cleanup');
        updateCleanupMotion(mesh, animal, delta, context);
        animateInvertebrateModel(
            mesh,
            animal,
            finite(time, 0) * 0.001,
            clamp(finite(delta, 1 / 60), 0, 0.1)
        );
    }
}
