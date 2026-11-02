// =========================================
// VISUALLY DISTINCT SPECIES & BEHAVIOR ANIMATIONS
// =========================================

import * as THREE from 'three';
import TextureGenerator from './TextureGenerator.js';

export class LivestockRenderer {
    // Wet-look physical material with clearcoat + optional emissive subsurface glow
    static _wetMaterial(mapTex, opts = {}) {
        return new THREE.MeshPhysicalMaterial({
            map: mapTex,
            roughness: opts.roughness !== undefined ? opts.roughness : 0.35,
            metalness: opts.metalness || 0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.15,
            emissive: opts.emissive || 0x000000,
            emissiveIntensity: opts.emissiveIntensity || 0
        });
    }

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
            flameangel: 'flameAngel'
        };

        const rawId = String(templateId);
        return aliases[rawId] || aliases[rawId.toLowerCase()] || rawId;
    }

    static createFishMesh(fish) {
        const group = new THREE.Group();
        group.userData = {
            id: fish.id,
            templateId: fish.templateId,
            isFish: true
        };

        const id = LivestockRenderer.resolveTemplateId(fish.templateId);

        // Helper to create a fin from a 2D shape
        const createFin = (pts, color, zRot = 0, yRot = 0) => {
            const shape = new THREE.Shape();
            shape.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++)
                shape.lineTo(pts[i][0], pts[i][1]);
            const geo = new THREE.ShapeGeometry(shape);
            const mat = new THREE.MeshStandardMaterial({
                color: color,
                side: THREE.DoubleSide,
                roughness: 0.7,
                transparent: true,
                opacity: 0.9
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.z = zRot;
            mesh.rotation.y = yRot;
            return mesh;
        };

        if (id === 'clownfish') {
            // Rounded teardrop body — orange with 3 white/black-bordered
            // bands painted via canvas texture so the pattern conforms to
            // the body curvature instead of floating overlay meshes.
            const bodyGeo = new THREE.SphereGeometry(0.12, 24, 16);
            bodyGeo.scale(1.8, 1.1, 0.5);
            const clownTex = TextureGenerator.stripeTexture(
                'clownfish-body',
                0xff6600,
                [
                    {
                        x: 0.62,
                        width: 0.14,
                        color: 0xffffff,
                        borderColor: 0x1a0d00,
                        borderWidth: 4
                    },
                    {
                        x: 0.42,
                        width: 0.12,
                        color: 0xffffff,
                        borderColor: 0x1a0d00,
                        borderWidth: 4
                    },
                    {
                        x: 0.15,
                        width: 0.1,
                        color: 0xffffff,
                        borderColor: 0x1a0d00,
                        borderWidth: 4
                    }
                ],
                { counterShade: [0xcc3300, 0xffcc88], speckle: 500 }
            );
            const bodyMat = LivestockRenderer._wetMaterial(clownTex, {
                roughness: 0.4
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // Pectoral Fins
            const pFin = createFin(
                [
                    [0, 0],
                    [0.05, 0.02],
                    [0.08, 0],
                    [0.05, -0.04]
                ],
                0xff5500,
                0,
                0.3
            );
            pFin.position.set(0.05, -0.05, 0.06);
            const pFin2 = pFin.clone();
            pFin2.rotation.y = -0.3;
            pFin2.position.set(0.05, -0.05, -0.06);

            // Tail Fin
            const tail = createFin(
                [
                    [0, 0],
                    [-0.08, 0.06],
                    [-0.1, 0],
                    [-0.08, -0.06]
                ],
                0xff5500
            );
            tail.position.set(-0.21, 0, 0);
            tail.userData = { isTail: true };

            // Dorsal Fin
            const dorsal = createFin(
                [
                    [0, 0],
                    [0.1, 0.05],
                    [0.05, 0]
                ],
                0xff5500
            );
            dorsal.position.set(-0.1, 0.1, 0);

            group.add(body, pFin, pFin2, tail, dorsal);
        } else if (id === 'yellowTang') {
            // Diamond/Oval flat body — bright uniform yellow with subtle
            // skin texture and the diagnostic white "scalpel" spot near
            // the tail base (real yellowTang identifying feature).
            const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 32);
            bodyGeo.rotateX(Math.PI / 2);
            bodyGeo.scale(1.2, 1.0, 1.0);
            const tangTex = TextureGenerator.mottleTexture(
                'yellowTang-body',
                0xffd700,
                [0xffe94d, 0xe6c200],
                { count: 18, alpha: 0.3, speckle: 250 }
            );
            const bodyMat = LivestockRenderer._wetMaterial(tangTex, {
                roughness: 0.3
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // White scalpel spot with dark ring, near the caudal peduncle
            const spotGeo = new THREE.CircleGeometry(0.02, 16);
            const spot = new THREE.Mesh(
                spotGeo,
                new THREE.MeshBasicMaterial({
                    color: 0xfffbe0,
                    side: THREE.DoubleSide
                })
            );
            spot.position.set(-0.13, 0, 0.021);
            const spotRing = new THREE.Mesh(
                new THREE.RingGeometry(0.02, 0.026, 16),
                new THREE.MeshBasicMaterial({
                    color: 0x8a5a00,
                    side: THREE.DoubleSide
                })
            );
            spotRing.position.set(-0.13, 0, 0.021);
            const spot2 = spot.clone();
            spot2.position.z = -0.021;
            const spotRing2 = spotRing.clone();
            spotRing2.position.z = -0.021;

            // Snout
            const snoutGeo = new THREE.ConeGeometry(0.04, 0.15, 16);
            snoutGeo.rotateZ(Math.PI / 2);
            const snout = new THREE.Mesh(snoutGeo, bodyMat);
            snout.position.set(0.2, -0.05, 0);

            // Prominent Dorsal & Anal fins
            const dorsal = createFin(
                [
                    [-0.15, 0],
                    [0, 0.15],
                    [0.15, 0]
                ],
                0xffd700
            );
            dorsal.position.set(0, 0.15, 0);
            const anal = createFin(
                [
                    [-0.12, 0],
                    [0, -0.12],
                    [0.12, 0]
                ],
                0xffd700
            );
            anal.position.set(0, -0.15, 0);

            // Tail
            const tail = createFin(
                [
                    [0, 0],
                    [-0.1, 0.1],
                    [-0.08, 0],
                    [-0.1, -0.1]
                ],
                0xffd700
            );
            tail.position.set(-0.2, 0, 0);
            tail.userData = { isTail: true };

            group.add(
                body,
                snout,
                dorsal,
                anal,
                tail,
                spot,
                spotRing,
                spot2,
                spotRing2
            );
        } else if (id === 'blueHippoTang') {
            // Oval body — royal blue with the iconic black "painter's
            // palette" pattern conforming to the body via canvas texture,
            // plus a fine skin texture instead of flat floating planes.
            const bodyGeo = new THREE.SphereGeometry(0.16, 24, 16);
            bodyGeo.scale(1.6, 1.2, 0.3);
            const hippoTex = TextureGenerator.mottleTexture(
                'blueHippoTang-body',
                0x1d4ed8,
                [0x0f172a, 0x111827],
                { count: 10, alpha: 0.85, speckle: 300 }
            );
            const bodyMat = LivestockRenderer._wetMaterial(hippoTex, {
                roughness: 0.3
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // Yellow tail
            const tail = createFin(
                [
                    [0, 0],
                    [-0.12, 0.1],
                    [-0.08, 0],
                    [-0.12, -0.1]
                ],
                0xfacc15
            );
            tail.position.set(-0.25, 0, 0);
            tail.userData = { isTail: true };

            // Pectoral fins (yellow tips)
            const pFin = createFin(
                [
                    [0, 0],
                    [0.06, 0.02],
                    [0.04, -0.04]
                ],
                0xfacc15,
                0,
                0.4
            );
            pFin.position.set(0.08, -0.05, 0.05);
            const pFin2 = pFin.clone();
            pFin2.rotation.y = -0.4;
            pFin2.position.set(0.08, -0.05, -0.05);

            group.add(body, tail, pFin, pFin2);
        } else if (id === 'royalGramma') {
            // Bullet shaped body, two-tone — single sphere with a soft
            // blended diagonal-split texture (violet front / gold back)
            // instead of two hard-seamed hemisphere meshes.
            const bodyGeo = new THREE.SphereGeometry(0.1, 24, 16);
            bodyGeo.scale(2.0, 1.0, 0.5);
            const grammaTex = TextureGenerator.diagonalSplitTexture(
                'royalGramma-body',
                0x9333ea,
                0xeab308,
                0.45,
                { softness: 0.1, speckle: 300 }
            );
            const bodyMat = new THREE.MeshStandardMaterial({
                map: grammaTex,
                roughness: 0.4
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // Fins
            const dorsal = createFin(
                [
                    [-0.1, 0],
                    [0.05, 0.06],
                    [0.1, 0]
                ],
                0x9333ea
            );
            dorsal.position.set(0, 0.09, 0);
            const tail = createFin(
                [
                    [0, 0],
                    [-0.08, 0.06],
                    [-0.06, 0],
                    [-0.08, -0.06]
                ],
                0xeab308
            );
            tail.position.set(-0.19, 0, 0);
            tail.userData = { isTail: true };

            group.add(body, dorsal, tail);
        } else if (id === 'firefishGoby') {
            // Elongated slender body — pale cream nose blending smoothly
            // into fiery red-orange tail via a lengthwise gradient texture.
            const bodyGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 16);
            bodyGeo.rotateZ(Math.PI / 2);
            const fireTex = TextureGenerator.gradientTexture(
                'firefishGoby-body',
                [
                    [0, 0xffedd5],
                    [0.55, 0xffedd5],
                    [0.75, 0xf59e0b],
                    [1, 0xdc2626]
                ],
                { vertical: true, speckle: 150 }
            );
            const bodyMat = new THREE.MeshStandardMaterial({
                map: fireTex,
                roughness: 0.5
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // Red tail section
            const tailBodyGeo = new THREE.CylinderGeometry(
                0.04,
                0.02,
                0.15,
                16
            );
            tailBodyGeo.rotateZ(Math.PI / 2);
            const tailMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
            const tailBody = new THREE.Mesh(tailBodyGeo, tailMat);
            tailBody.position.set(-0.25, 0, 0);

            // Iconic dorsal ray
            const finGeo = new THREE.ConeGeometry(0.01, 0.35, 8);
            const finMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
            const fin = new THREE.Mesh(finGeo, finMat);
            fin.position.set(0.1, 0.18, 0);
            fin.userData = { isDorsal: true };

            // Tail fin
            const tailFin = createFin(
                [
                    [0, 0],
                    [-0.06, 0.04],
                    [-0.06, -0.04]
                ],
                0xd97706
            );
            tailFin.position.set(-0.32, 0, 0);
            tailFin.userData = { isTail: true };

            group.add(body, tailBody, fin, tailFin);
        } else if (id === 'banggaiCardinal') {
            // Diamond body with long sweeping fins — silvery body with
            // black vertical bars and the diagnostic white spots
            // scattered across body & fins (the species' signature trait).
            const bodyGeo = new THREE.SphereGeometry(0.1, 16, 16);
            bodyGeo.scale(1.2, 1.4, 0.4);
            const banggaiTex = TextureGenerator.stripeTexture(
                'banggaiCardinal-body',
                0xd1d5db,
                [
                    { x: 0.4, width: 0.06, color: 0x0f172a },
                    { x: 0.62, width: 0.06, color: 0x0f172a }
                ],
                { speckle: 0 }
            );
            // Overlay white spots onto the same canvas for the species'
            // signature marking.
            {
                const ctx = banggaiTex.image.getContext('2d');
                ctx.fillStyle = '#ffffff';
                for (let i = 0; i < 40; i++) {
                    const x = Math.random() * banggaiTex.image.width;
                    const y = Math.random() * banggaiTex.image.height;
                    ctx.beginPath();
                    ctx.arc(x, y, 1 + Math.random() * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                banggaiTex.needsUpdate = true;
            }
            const bodyMat = new THREE.MeshStandardMaterial({
                map: banggaiTex,
                metalness: 0.5,
                roughness: 0.3
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // Long fins
            const dorsal = createFin(
                [
                    [0, 0],
                    [-0.1, 0.25],
                    [-0.05, 0]
                ],
                0x0f172a
            );
            dorsal.position.set(0, 0.13, 0);
            const anal = createFin(
                [
                    [0, 0],
                    [-0.1, -0.25],
                    [-0.05, 0]
                ],
                0x0f172a
            );
            anal.position.set(0, -0.13, 0);

            // Forked tail
            const tail = createFin(
                [
                    [0, 0],
                    [-0.15, 0.12],
                    [-0.05, 0],
                    [-0.15, -0.12]
                ],
                0x0f172a
            );
            tail.position.set(-0.12, 0, 0);
            tail.userData = { isTail: true };

            group.add(body, dorsal, anal, tail);
        } else if (id === 'tailspotBlenny') {
            // Small blenny shape, perching
            const bodyGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 16);
            bodyGeo.rotateZ(Math.PI / 2);
            const bodyMat = new THREE.MeshStandardMaterial({
                map: TextureGenerator.mottleTexture(
                    'tailspotBlenny-body',
                    0x78716c,
                    [0x57534e, 0x92897f],
                    { count: 25, alpha: 0.4, speckle: 300 }
                ),
                roughness: 0.7
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // Big eyes
            const eyeGeo = new THREE.SphereGeometry(0.015, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
            eyeL.position.set(0.08, 0.02, 0.03);
            const eyeR = eyeL.clone();
            eyeR.position.set(0.08, 0.02, -0.03);

            // Tail spot
            const spotGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 16);
            spotGeo.rotateX(Math.PI / 2);
            const spotMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
            const spot = new THREE.Mesh(spotGeo, spotMat);
            spot.position.set(-0.1, 0, 0);

            // Tail
            const tail = createFin(
                [
                    [0, 0],
                    [-0.05, 0.03],
                    [-0.05, -0.03]
                ],
                0x78716c
            );
            tail.position.set(-0.14, 0, 0);
            tail.userData = { isTail: true };

            group.add(body, eyeL, eyeR, spot, tail);
        } else if (id === 'sixLineWrasse') {
            // Torpedo shape — orange body with the six iconic blue
            // horizontal racing stripes running nose-to-tail, painted as
            // a texture instead of stacked ring meshes.
            const bodyGeo = new THREE.SphereGeometry(0.08, 24, 16);
            bodyGeo.scale(2.5, 1.1, 0.5);
            const wrasseTex = TextureGenerator.lengthStripeTexture(
                'sixLineWrasse-body',
                0xea580c,
                [0x0284c7],
                6,
                { speckle: 200 }
            );
            const bodyMat = new THREE.MeshStandardMaterial({
                map: wrasseTex,
                roughness: 0.3
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // Green tail
            const tail = createFin(
                [
                    [0, 0],
                    [-0.08, 0.05],
                    [-0.08, -0.05]
                ],
                0x16a34a
            );
            tail.position.set(-0.2, 0, 0);
            tail.userData = { isTail: true };

            // Pectoral fins
            const pFin = createFin(
                [
                    [0, 0],
                    [0.04, 0.02],
                    [0.03, -0.02]
                ],
                0x16a34a,
                0,
                0.3
            );
            pFin.position.set(0.05, -0.04, 0.04);
            const pFin2 = pFin.clone();
            pFin2.rotation.y = -0.3;
            pFin2.position.set(0.05, -0.04, -0.04);

            group.add(body, tail, pFin, pFin2);
        } else if (id === 'mandarinGoby') {
            // Broad flattened bottom — the psychedelic maze/labyrinth
            // pattern of turquoise, orange, green and blue is the
            // Mandarin dragonet's single most distinguishing feature.
            const bodyGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.3, 16);
            bodyGeo.rotateZ(Math.PI / 2);
            bodyGeo.scale(1.0, 0.6, 1.2);
            const mandarinTex = TextureGenerator.mazeTexture(
                'mandarinGoby-body',
                0x0891b2,
                {
                    outer: 0x1e3a8a,
                    inner: [0xf97316, 0x22c55e, 0xeab308, 0xec4899]
                },
                { lineCount: 16 }
            );
            const bodyMat = LivestockRenderer._wetMaterial(mandarinTex, {
                roughness: 0.4,
                emissive: 0x0e5f6e,
                emissiveIntensity: 0.35
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            // Pectoral fan fins
            const finGeo = new THREE.CircleGeometry(0.08, 16);
            const finMat = new THREE.MeshStandardMaterial({
                color: 0xf97316,
                side: THREE.DoubleSide
            });
            const pFin1 = new THREE.Mesh(finGeo, finMat);
            pFin1.position.set(0.05, -0.02, 0.09);
            pFin1.rotation.x = Math.PI / 2;
            pFin1.rotation.y = 0.3;

            const pFin2 = new THREE.Mesh(finGeo, finMat);
            pFin2.position.set(0.05, -0.02, -0.09);
            pFin2.rotation.x = Math.PI / 2;
            pFin2.rotation.y = -0.3;

            // Tail
            const tail = createFin(
                [
                    [0, 0],
                    [-0.1, 0.06],
                    [-0.1, -0.06]
                ],
                0xf97316
            );
            tail.position.set(-0.15, 0, 0);
            tail.userData = { isTail: true };

            group.add(body, pFin1, pFin2, tail);
        } else {
            // Improved generic fish
            const bodyGeo = new THREE.SphereGeometry(0.1, 24, 16);
            bodyGeo.scale(2.0, 1.2, 0.4);
            const bodyMat = new THREE.MeshStandardMaterial({
                map: TextureGenerator.mottleTexture(
                    'genericFish-body',
                    0x10b981,
                    [0x059669, 0x34d399],
                    { count: 15, alpha: 0.3, speckle: 250 }
                ),
                roughness: 0.4
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);

            const tail = createFin(
                [
                    [0, 0],
                    [-0.08, 0.06],
                    [-0.06, 0],
                    [-0.08, -0.06]
                ],
                0x10b981
            );
            tail.position.set(-0.2, 0, 0);
            tail.userData = { isTail: true };

            const dorsal = createFin(
                [
                    [0, 0],
                    [0.08, 0.05],
                    [0.05, 0]
                ],
                0x10b981
            );
            dorsal.position.set(-0.05, 0.1, 0);

            group.add(body, tail, dorsal);
        }

        // Add eyes to fish that don't already define custom species eyes
        const speciesWithEyes = [
            'clownfish',
            'yellowTang',
            'tailspotBlenny',
            'banggaiCardinal'
        ];
        if (!speciesWithEyes.includes(id)) {
            const eyeGeo = new THREE.SphereGeometry(0.015, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
            eyeL.position.set(0.12, 0.02, 0.04);
            const eyeR = eyeL.clone();
            eyeR.position.set(0.12, 0.02, -0.04);
            group.add(eyeL, eyeR);
        }

        const sizeScale =
            fish.size === 'large' ? 1.4 : fish.size === 'medium' ? 1.1 : 0.8;
        group.scale.setScalar(sizeScale);
        return group;
    }

    static updateFishAnimation(mesh, fish, time, delta = 1 / 60) {
        const moveBlend = 1 - Math.pow(0.92, delta * 60);
        const turnBlend = 1 - Math.pow(0.9, delta * 60);
        if (!mesh || !fish) return;

        const id = LivestockRenderer.resolveTemplateId(fish.templateId);

        if (fish.alive) {
            // Map normalized state coordinates to 3D tank bounds (Width 5.0, Height 2.2, Depth 2.2)
            const targetX = (fish.x - 0.5) * 5.0;
            const targetY = (fish.y - 0.5) * 2.2;
            const targetZ = (fish.z - 0.5) * 2.2;

            // Compute turn angle based on velocity vector
            const dx = targetX - mesh.position.x;
            const dz = targetZ - mesh.position.z;
            const currentSpeed = Math.sqrt(dx * dx + dz * dz);

            // Smooth position interpolation
            mesh.position.x += dx * moveBlend;
            mesh.position.y += (targetY - mesh.position.y) * moveBlend;
            mesh.position.z += dz * moveBlend;

            // Smooth rotation towards movement direction
            if (currentSpeed > 0.001) {
                const targetAngle = Math.atan2(-dz, dx);
                let diff = targetAngle - mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                mesh.rotation.y += diff * turnBlend;
            }

            // Baseline pitch adjustment based on Y movement
            const dy = targetY - mesh.position.y;
            mesh.rotation.z = dy * 0.5;

            // Species-Specific Behaviors & Body Animations
            if (id === 'clownfish') {
                // Playful side-to-side wiggling
                mesh.rotation.y += Math.sin(time * 0.01) * 0.2;
                mesh.position.y += Math.sin(time * 0.006) * 0.005;
            } else if (id === 'firefishGoby') {
                // Motionless hover with flicking dorsal fin ray
                const dorsal = mesh.children.find(
                    (c) => c.userData && c.userData.isDorsal
                );
                if (dorsal)
                    dorsal.rotation.z = Math.sin(time * 0.02) > 0.8 ? -0.4 : 0;
            } else if (id === 'royalGramma') {
                // Hover near rocks, often tilting upside down or perpendicular
                if (currentSpeed < 0.02) {
                    mesh.rotation.z += Math.sin(time * 0.002) * 0.5;
                }
            } else if (id === 'mandarinGoby') {
                // Methodical hover-crawling motion along bottom
                mesh.position.y =
                    -1.05 + Math.abs(Math.sin(time * 0.004)) * 0.04;
                mesh.rotation.z = (targetY - mesh.position.y) * 0.2; // Keep mostly flat
            } else if (id === 'tailspotBlenny') {
                // Hops and perches
                if (currentSpeed > 0.05) {
                    mesh.position.y += Math.abs(Math.sin(time * 0.01)) * 0.1; // Hopping
                }
            } else if (id === 'sixLineWrasse') {
                // Darting rapid eye movement / erratic swerving
                mesh.rotation.y += Math.sin(time * 0.015) * 0.3;
            }

            // Generic Tail wagging animation for all that have tails
            const tail = mesh.children.find(
                (c) => c.userData && c.userData.isTail
            );
            if (tail) {
                const wagSpeed =
                    (fish.behaviorState === 'darting' ? 0.02 : 0.01) +
                    currentSpeed * 0.05;
                const wagAmp = fish.behaviorState === 'cruising' ? 0.4 : 0.2;
                tail.rotation.y = Math.sin(time * wagSpeed) * wagAmp;
            }
        } else {
            // Sinking dead fish belly up
            mesh.position.y = Math.max(-1.1, mesh.position.y - 0.6 * delta);
            mesh.rotation.z = Math.PI;
            mesh.rotation.x = 0; // lay flat
        }
    }

    static createCoralMesh(coral) {
        const group = new THREE.Group();
        group.userData = {
            id: coral.id,
            templateId: coral.templateId,
            isCoral: true
        };

        const id = coral.templateId;

        if (id === 'pulsingXenia' || id === 'xeniaCorals') {
            // Stem with pulsing polyp fingers
            const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.4, 8);
            const stemMat = new THREE.MeshStandardMaterial({
                color: 0xf472b6,
                roughness: 0.6
            });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.2;

            // 5 Polyp fingers
            for (let f = 0; f < 5; f++) {
                const fingerGeo = new THREE.ConeGeometry(0.02, 0.18, 4);
                const finger = new THREE.Mesh(fingerGeo, stemMat);
                const angle = (f / 5) * Math.PI * 2;
                finger.position.set(
                    Math.cos(angle) * 0.08,
                    0.4,
                    Math.sin(angle) * 0.08
                );
                finger.userData = { isXeniaFinger: true, angle };
                group.add(finger);
            }
            group.add(stem);
        } else if (id === 'greenStarPolyps') {
            // Neon green grass polyp mat
            const baseGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
            const base = new THREE.Mesh(baseGeo, baseMat);

            for (let p = 0; p < 15; p++) {
                const pGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 6);
                const pMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
                const polyp = new THREE.Mesh(pGeo, pMat);
                polyp.position.set(
                    (Math.random() - 0.5) * 0.4,
                    0.1,
                    (Math.random() - 0.5) * 0.4
                );
                polyp.userData = {
                    isTentacle: true,
                    phase: Math.random() * Math.PI * 2
                };
                group.add(polyp);
            }
            group.add(base);
        } else if (id === 'zoanthids') {
            // Cluster of small button polyps
            const baseGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 12);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            group.add(base);

            const colors = [0xf97316, 0xeab308, 0xec4899, 0x14b8a6];
            const matColor = colors[coral.id % colors.length];

            for (let i = 0; i < 7; i++) {
                const pGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.1, 8);
                const pMat = new THREE.MeshStandardMaterial({
                    color: 0x7c3aed
                });
                const polyp = new THREE.Mesh(pGeo, pMat);
                const angle = (i / 7) * Math.PI * 2;
                const r = i === 0 ? 0 : 0.15;
                polyp.position.set(
                    Math.cos(angle) * r,
                    0.05,
                    Math.sin(angle) * r
                );

                const capGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.02, 12);
                const capMat = new THREE.MeshStandardMaterial({
                    color: matColor,
                    emissive: matColor,
                    emissiveIntensity: 0.2
                });
                const cap = new THREE.Mesh(capGeo, capMat);
                cap.position.y = 0.05;
                polyp.add(cap);
                group.add(polyp);
            }
        } else if (id === 'mushrooms') {
            // 2-3 overlapping flattened disks on short stalks — each cap
            // gets a concentric "gill" ring texture (the corallimorph
            // disc pattern) matched to its color for clear identification.
            for (let i = 0; i < 3; i++) {
                const r = [0xff4500, 0x8b008b, 0x00ced1][(coral.id + i) % 3];
                const stalkGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
                const stalk = new THREE.Mesh(
                    stalkGeo,
                    new THREE.MeshStandardMaterial({ color: 0x4a0404 })
                );

                const capGeo = new THREE.SphereGeometry(
                    0.15,
                    16,
                    12,
                    0,
                    Math.PI * 2,
                    0,
                    Math.PI * 0.4
                );
                // Spherical UV (u=longitude, v=polar angle) matches polar
                // coordinates directly, so horizontal-band textures render
                // as true concentric rings on the flattened dome cap.
                const darker =
                    (((r >> 16) & 255) >> 1) * 65536 +
                    ((((r >> 8) & 255) >> 1) << 8) +
                    (((r & 255) >> 1) | 0);
                const ringTex = TextureGenerator.lengthStripeTexture(
                    'mushroom-cap-' + r.toString(16),
                    r,
                    [r, darker],
                    9,
                    { speckle: 60 }
                );
                const cap = new THREE.Mesh(
                    capGeo,
                    new THREE.MeshStandardMaterial({
                        map: ringTex,
                        roughness: 0.8,
                        side: THREE.DoubleSide
                    })
                );
                cap.position.y = 0.05;
                cap.scale.y = 0.2; // flatten

                // Random position slightly offset
                stalk.position.set(
                    (Math.random() - 0.5) * 0.2,
                    0.05,
                    (Math.random() - 0.5) * 0.2
                );
                stalk.add(cap);

                // Add soft undulation capability
                cap.userData = {
                    isMushroomCap: true,
                    phase: Math.random() * Math.PI
                };
                group.add(stalk);
            }
        } else if (
            id === 'hammerCoral' ||
            id === 'torchCoral' ||
            id === 'frogspawn'
        ) {
            // Euphyllia species
            const isHammer = id === 'hammerCoral';
            const isTorch = id === 'torchCoral';

            const skeletonGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
            const skeletonMat = new THREE.MeshStandardMaterial({
                color: 0xe5e7eb,
                roughness: 0.9
            });
            const skeleton = new THREE.Mesh(skeletonGeo, skeletonMat);
            skeleton.position.y = 0.15;
            group.add(skeleton);

            const tentacleCount = isTorch ? 20 : 15;
            const tColor = isTorch ? 0xd946ef : isHammer ? 0x2dd4bf : 0x84cc16;
            const tipColor = isTorch
                ? 0xfde047
                : isHammer
                  ? 0x0ea5e9
                  : 0xd946ef;

            for (let i = 0; i < tentacleCount; i++) {
                // Tentacle body
                const len = isTorch ? 0.3 : 0.2;
                const tGeo = new THREE.CylinderGeometry(0.015, 0.01, len, 5);
                const tMat = new THREE.MeshStandardMaterial({
                    color: tColor,
                    transparent: true,
                    opacity: 0.9
                });
                const tentacle = new THREE.Mesh(tGeo, tMat);

                // Position around the top of the skeleton
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * 0.1;
                tentacle.position.set(
                    Math.cos(a) * r,
                    0.3 + len / 2,
                    Math.sin(a) * r
                );

                // Tilt outwards
                tentacle.rotation.x = (Math.random() - 0.5) * 0.5;
                tentacle.rotation.z = (Math.random() - 0.5) * 0.5;

                // Tips
                if (isTorch) {
                    const tipGeo = new THREE.SphereGeometry(0.02, 8, 8);
                    const tip = new THREE.Mesh(
                        tipGeo,
                        new THREE.MeshBasicMaterial({ color: tipColor })
                    );
                    tip.position.y = len / 2;
                    tentacle.add(tip);
                } else if (isHammer) {
                    const tipGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
                    const tip = new THREE.Mesh(
                        tipGeo,
                        new THREE.MeshBasicMaterial({ color: tipColor })
                    );
                    tip.position.y = len / 2;
                    tentacle.add(tip);
                } else {
                    // Frogspawn: multiple bubble tips down the stem
                    for (let b = 0; b < 3; b++) {
                        const tipGeo = new THREE.SphereGeometry(0.02, 8, 8);
                        const tip = new THREE.Mesh(
                            tipGeo,
                            new THREE.MeshBasicMaterial({ color: tipColor })
                        );
                        tip.position.y = (b / 3) * len - len / 2 + 0.05;
                        tip.position.x = (Math.random() - 0.5) * 0.02;
                        tentacle.add(tip);
                    }
                }

                tentacle.userData = {
                    isTentacle: true,
                    phase: Math.random() * Math.PI * 2
                };
                group.add(tentacle);
            }
        } else if (id === 'acropora') {
            // Branching SPS structure — branch surface gets a scattered
            // polyp-dot texture so the coralline flesh reads as living
            // tissue with feeding polyps rather than flat plastic tubing.
            const mat = new THREE.MeshStandardMaterial({
                map: TextureGenerator.polypFieldTexture(
                    'acropora-branch',
                    0x3b82f6,
                    0x93c5fd,
                    120
                ),
                roughness: 0.8
            }); // Blue acro
            const tipMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });

            const createBranch = (length, radius, level) => {
                const geo = new THREE.CylinderGeometry(
                    radius * 0.6,
                    radius,
                    length,
                    8
                );
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.y = length / 2;

                // Add tip
                const tip = new THREE.Mesh(
                    new THREE.SphereGeometry(radius * 0.65, 8, 8),
                    tipMat
                );
                tip.position.y = length / 2;
                mesh.add(tip);

                // Add sub-branches
                if (level < 2) {
                    const numBranches = 2 + Math.floor(Math.random() * 2);
                    for (let i = 0; i < numBranches; i++) {
                        const sub = createBranch(
                            length * 0.7,
                            radius * 0.7,
                            level + 1
                        );
                        sub.position.y =
                            ((Math.random() * 0.5 + 0.5) * length) / 2;
                        sub.rotation.z =
                            (Math.random() * 0.4 + 0.3) *
                            (Math.random() < 0.5 ? 1 : -1);
                        sub.rotation.x =
                            (Math.random() * 0.4 + 0.3) *
                            (Math.random() < 0.5 ? 1 : -1);
                        mesh.add(sub);
                    }
                }
                return mesh;
            };

            const baseBranch = createBranch(0.4, 0.05, 0);
            group.add(baseBranch);
        } else {
            // General Coral (fallback) — mottled fleshy texture instead of
            // a flat plastic-looking sphere.
            const headGeo = new THREE.SphereGeometry(0.25, 12, 12);
            const headMat = new THREE.MeshStandardMaterial({
                map: TextureGenerator.mottleTexture(
                    'genericCoral-head',
                    0xa855f7,
                    [0x9333ea, 0xc084fc],
                    { count: 30, alpha: 0.4, speckle: 250 }
                ),
                roughness: 0.5
            });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 0.25;
            group.add(head);
        }

        // Distinct pseudo-random spreading so they don't clump at origin
        const hash = coral.id * 13.37;
        const fallbackX = Math.sin(hash) * 2.5;
        const fallbackZ = Math.cos(hash) * 1.0;
        const fallbackY = -1.2 + Math.abs(Math.sin(hash * 3)) * 0.5;

        // Note: coral.x in LivestockEngine is between -1.75 and 1.75 unless modified.
        // We will make sure they stand upright (avoiding rotation issues).
        group.position.set(
            coral.x ?? fallbackX,
            coral.y ?? fallbackY,
            coral.z ?? fallbackZ
        );

        // Add a slight random tilt to make it natural
        group.rotation.y = Math.random() * Math.PI * 2;
        group.rotation.x = (Math.random() - 0.5) * 0.2;
        group.rotation.z = (Math.random() - 0.5) * 0.2;

        return group;
    }

    static updateCoralAnimation(mesh, coral, time) {
        if (!mesh) return;

        const id = coral.templateId;
        const t = time * 0.001; // Scale time for nice flow mapping

        if (id === 'pulsingXenia' || id === 'xeniaCorals') {
            // Rhythmically pulsing polyp fingers opening and closing!
            const pulse = (Math.sin(time * 0.006) + 1) * 0.5; // 0 to 1
            mesh.children.forEach((child) => {
                if (child.userData && child.userData.isXeniaFinger) {
                    const angle = child.userData.angle;
                    child.rotation.z = Math.cos(angle) * (0.2 + pulse * 0.6);
                    child.rotation.x = Math.sin(angle) * (0.2 + pulse * 0.6);
                }
            });
        } else {
            // Animate other soft/LPS coral tentacles and polyps based on water flow
            mesh.children.forEach((child) => {
                if (child.userData && child.userData.isTentacle) {
                    // Sway slowly
                    child.rotation.x +=
                        Math.sin(t + child.userData.phase) * 0.005;
                    child.rotation.z +=
                        Math.cos(t * 0.8 + child.userData.phase) * 0.005;
                    // Clamp swaying to reasonable range
                    child.rotation.x = Math.max(
                        -0.4,
                        Math.min(0.4, child.rotation.x)
                    );
                    child.rotation.z = Math.max(
                        -0.4,
                        Math.min(0.4, child.rotation.z)
                    );
                }
                if (child.userData && child.userData.isMushroomCap) {
                    // Mushrooms subtly expand/contract
                    const scale =
                        1.0 + Math.sin(t * 2.0 + child.userData.phase) * 0.05;
                    child.scale.set(scale, 0.2, scale);
                }
            });
        }
    }
}
