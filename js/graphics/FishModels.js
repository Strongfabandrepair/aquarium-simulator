import * as THREE from 'three';
import { fishTexture } from './FishTextures.js';

// Body dimensions exclude the caudal fin. Shapes are deliberately species-specific.
export const FISH_PROFILES = {
    valentiniPuffer: {
        length: 0.55,
        height: 0.14,
        width: 0.13,
        color: 0xe3d8a4,
        fin: 0xeac73c,
        tail: 'round',
        frequency: 3.8
    },
    orchidDottyback: {
        length: 0.58,
        height: 0.075,
        width: 0.045,
        color: 0xb03bc7,
        fin: 0xb65ad3,
        tail: 'round',
        frequency: 2.5
    },
    lyretailAnthias: {
        length: 0.61,
        height: 0.115,
        width: 0.052,
        color: 0xed7d4c,
        fin: 0xcc4676,
        tail: 'lyre',
        frequency: 2.8
    },
    greenChromis: {
        length: 0.48,
        height: 0.12,
        width: 0.052,
        color: 0x4bc3bc,
        fin: 0x5db5ae,
        tail: 'fork',
        frequency: 2.8
    },
    yellowWatchmanGoby: {
        length: 0.6,
        height: 0.08,
        width: 0.065,
        color: 0xf2cc22,
        fin: 0xe3ba34,
        tail: 'round',
        frequency: 2.0
    },
    clownfish: {
        length: 0.53,
        height: 0.135,
        width: 0.075,
        color: 0xf87915,
        fin: 0xf39030,
        tail: 'round',
        frequency: 3.0
    },
    royalGramma: {
        length: 0.57,
        height: 0.095,
        width: 0.055,
        color: 0x9937d0,
        fin: 0xe6bf27,
        tail: 'round',
        frequency: 2.0
    },
    firefishGoby: {
        length: 0.61,
        height: 0.067,
        width: 0.041,
        color: 0xe6d6b8,
        fin: 0xcf3437,
        tail: 'fork',
        frequency: 2.7
    },
    yellowTang: {
        length: 0.67,
        height: 0.255,
        width: 0.064,
        color: 0xf8dd10,
        fin: 0xf8d917,
        tail: 'fork',
        frequency: 2.1
    },
    blueHippoTang: {
        length: 0.78,
        height: 0.205,
        width: 0.076,
        color: 0x2075ea,
        fin: 0x254eab,
        tail: 'fork',
        frequency: 2.3
    },
    banggaiCardinal: {
        length: 0.45,
        height: 0.13,
        width: 0.052,
        color: 0xbec5c8,
        fin: 0x282d38,
        tail: 'lyre',
        frequency: 1.6
    },
    tailspotBlenny: {
        length: 0.5,
        height: 0.078,
        width: 0.057,
        color: 0xb49055,
        fin: 0xbba762,
        tail: 'round',
        frequency: 3.3
    },
    sixLineWrasse: {
        length: 0.53,
        height: 0.095,
        width: 0.057,
        color: 0xce6035,
        fin: 0x5caf6e,
        tail: 'round',
        frequency: 4.0
    },
    mandarinGoby: {
        length: 0.48,
        height: 0.078,
        width: 0.075,
        color: 0x15a69b,
        fin: 0x1e8d87,
        tail: 'round',
        frequency: 1.8
    },
    flameAngel: {
        length: 0.58,
        height: 0.175,
        width: 0.059,
        color: 0xf45d19,
        fin: 0x2859c7,
        tail: 'round',
        frequency: 2.8
    }
};

function bodyGeometry(p) {
    const positions = [],
        uvs = [],
        indices = [];
    const rows = 48,
        sides = 32;
    for (let i = 0; i <= rows; i++) {
        const u = i / rows;
        // Narrow peduncle, full shoulders, tapered but blunt muzzle.
        const envelope =
            Math.pow(Math.sin(Math.PI * u), 0.7) * (0.55 + 0.65 * u);
        const radius = 0.055 + envelope * 0.95;
        for (let j = 0; j <= sides; j++) {
            const a = (j / sides) * Math.PI * 2;
            positions.push(
                (u - 0.5) * p.length,
                Math.cos(a) * p.height * radius,
                Math.sin(a) * p.width * radius
            );
            uvs.push(u, j / sides);
            if (i < rows && j < sides) {
                const k = i * (sides + 1) + j;
                indices.push(
                    k,
                    k + 1,
                    k + sides + 1,
                    k + 1,
                    k + sides + 2,
                    k + sides + 1
                );
            }
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

function fin(points, color, rayColor = 0xffe4bd, spotted = false) {
    const shape = new THREE.Shape();
    shape.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1],
            current = points[i],
            next = points[(i + 1) % points.length];
        shape.lineTo(
            current[0] * 0.85 + previous[0] * 0.15,
            current[1] * 0.85 + previous[1] * 0.15
        );
        shape.quadraticCurveTo(
            ...current,
            current[0] * 0.85 + next[0] * 0.15,
            current[1] * 0.85 + next[1] * 0.15
        );
    }
    shape.closePath();
    const group = new THREE.Group();
    const membrane = new THREE.Mesh(
        new THREE.ShapeGeometry(shape, 12),
        new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color).convertSRGBToLinear(),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.84,
            depthWrite: false,
            roughness: 0.45,
            clearcoat: 0.7
        })
    );
    group.add(membrane);
    const rays = [];
    for (let i = 1; i < points.length - 1; i++) {
        for (let j = 0; j < 3; j++) {
            const f = j / 3;
            rays.push(
                points[0][0],
                points[0][1],
                0.001,
                THREE.MathUtils.lerp(points[i][0], points[i + 1][0], f),
                THREE.MathUtils.lerp(points[i][1], points[i + 1][1], f),
                0.001
            );
        }
    }
    const lines = new THREE.BufferGeometry();
    lines.setAttribute('position', new THREE.Float32BufferAttribute(rays, 3));
    group.add(
        new THREE.LineSegments(
            lines,
            new THREE.LineBasicMaterial({
                color: rayColor,
                transparent: true,
                opacity: 0.48
            })
        )
    );
    if (spotted) {
        const dots = [];
        for (let i = 3; i < rays.length; i += 6) {
            for (let t = 0.35; t < 1; t += 0.25)
                dots.push(
                    THREE.MathUtils.lerp(points[0][0], rays[i], t),
                    THREE.MathUtils.lerp(points[0][1], rays[i + 1], t),
                    0.003
                );
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(dots, 3));
        group.add(
            new THREE.Points(
                geo,
                new THREE.PointsMaterial({
                    color: 0xffffff,
                    size: 0.008,
                    sizeAttenuation: true
                })
            )
        );
    }
    return group;
}

function sphere(group, material, position, scale) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    group.add(mesh);
    return mesh;
}

export function createFishModel(fish, resolvedId = fish.templateId) {
    const p = FISH_PROFILES[resolvedId];
    if (!p) return null;
    const group = new THREE.Group();
    group.userData = { id: fish.id, templateId: resolvedId, isFish: true };
    const bodyMat = new THREE.MeshPhysicalMaterial({
        map: fishTexture(resolvedId),
        roughness: 0.4,
        metalness: 0,
        clearcoat: 0.85,
        clearcoatRoughness: 0.2
    });
    const swim = {
        time: { value: 0 },
        amplitude: { value: 0 },
        phase: { value: 0 }
    };
    bodyMat.onBeforeCompile = (shader) => {
        shader.uniforms.swimTime = swim.time;
        shader.uniforms.swimAmplitude = swim.amplitude;
        shader.uniforms.swimPhase = swim.phase;
        shader.vertexShader =
            'uniform float swimTime; uniform float swimAmplitude; uniform float swimPhase;\n' +
            shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            float aft = clamp(0.5 - position.x / ${p.length.toFixed(4)}, 0.0, 1.0);
            transformed.z += sin(swimTime - aft * 3.4 + swimPhase) * swimAmplitude * aft * aft;
        `
        );
    };
    bodyMat.customProgramCacheKey = () => `reef-fish-${resolvedId}`;
    const body = new THREE.Mesh(bodyGeometry(p), bodyMat);
    body.name = `${resolvedId}-anatomical-body`;
    group.add(body);
    const L = p.length,
        H = p.height;
    const cardinal = resolvedId === 'banggaiCardinal';
    const tang = resolvedId === 'yellowTang' || resolvedId === 'blueHippoTang';
    const blenny = resolvedId === 'tailspotBlenny';
    const mandarin = resolvedId === 'mandarinGoby';
    const eyeX = L * (blenny || mandarin ? 0.34 : 0.32);
    const eyeY = H * (blenny || mandarin ? 0.64 : 0.35);
    const eyeSize = cardinal ? 0.027 : blenny ? 0.024 : L * 0.034;
    const iris = new THREE.MeshPhysicalMaterial({
        color: tang ? 0x4b3320 : 0xdbac55,
        roughness: 0.3,
        clearcoat: 1
    });
    const pupil = new THREE.MeshPhysicalMaterial({
        color: 0x03070a,
        roughness: 0.12,
        clearcoat: 1
    });
    const gleam = new THREE.MeshBasicMaterial({ color: 0xe8f7ff });
    for (const side of [-1, 1]) {
        sphere(
            group,
            iris,
            [eyeX, eyeY, side * p.width * 0.71],
            [eyeSize, eyeSize, eyeSize * 0.48]
        );
        sphere(
            group,
            pupil,
            [eyeX + 0.003, eyeY, side * (p.width * 0.71 + eyeSize * 0.32)],
            [eyeSize * 0.65, eyeSize * 0.73, eyeSize * 0.27]
        );
        sphere(
            group,
            gleam,
            [
                eyeX + eyeSize * 0.24,
                eyeY + eyeSize * 0.3,
                side * (p.width * 0.71 + eyeSize * 0.6)
            ],
            [eyeSize * 0.17, eyeSize * 0.17, eyeSize * 0.1]
        );
        const gillPoints = [];
        for (let k = 0; k <= 16; k++) {
            const a = -1.15 + (k / 16) * 2.3;
            gillPoints.push(
                new THREE.Vector3(
                    L * 0.2 - Math.cos(a) * L * 0.065,
                    Math.sin(a) * H * 0.7,
                    side * p.width * 0.96
                )
            );
        }
        group.add(
            new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(gillPoints),
                new THREE.LineBasicMaterial({
                    color: 0x3a4036,
                    transparent: true,
                    opacity: 0.45
                })
            )
        );
    }
    // Small forward muzzle and lip seam, especially pronounced on grazing tangs.
    const muzzle = new THREE.MeshPhysicalMaterial({
        color: p.color,
        roughness: 0.4,
        clearcoat: 0.7
    });
    sphere(
        group,
        muzzle,
        [L * 0.47, -H * 0.1, 0],
        [L * (tang ? 0.08 : 0.035), H * 0.16, p.width * 0.36]
    );
    sphere(
        group,
        pupil,
        [L * (tang ? 0.545 : 0.499), -H * 0.1, 0],
        [0.002, H * 0.025, p.width * 0.24]
    );

    const tail = new THREE.Group();
    tail.position.x = -L * 0.49;
    const tailLength = L * (cardinal ? 0.48 : 0.29);
    const spread = H * (cardinal ? 1.5 : tang ? 0.76 : 1.05);
    const tailPoints =
        p.tail === 'round'
            ? [
                  [0, 0],
                  [-tailLength * 0.75, spread],
                  [-tailLength, spread * 0.7],
                  [-tailLength * 1.08, 0],
                  [-tailLength, -spread * 0.7],
                  [-tailLength * 0.75, -spread]
              ]
            : [
                  [0, 0],
                  [-tailLength, spread],
                  [-tailLength * 0.62, spread * 0.3],
                  [-tailLength * 0.48, 0],
                  [-tailLength * 0.62, -spread * 0.3],
                  [-tailLength, -spread]
              ];
    tail.add(
        fin(
            tailPoints,
            resolvedId === 'blueHippoTang' ? 0xffdc16 : p.fin,
            cardinal ? 0xe2e7ec : p.color,
            cardinal
        )
    );
    group.add(tail);

    const dorsalHeight = H * (cardinal ? 2.15 : tang ? 0.68 : 0.7);
    const dorsal = fin(
        [
            [L * 0.24, H * 0.6],
            [L * 0.13, H + dorsalHeight],
            [-L * 0.1, H + dorsalHeight * 0.77],
            [-L * 0.43, H * 0.22],
            [-L * 0.2, H * 0.55]
        ],
        p.fin,
        cardinal ? 0xeeeeee : p.color,
        cardinal
    );
    if (resolvedId === 'valentiniPuffer') {
        dorsal.scale.set(0.45, 0.45, 1);
        dorsal.position.x = -L * 0.22;
    }
    group.add(dorsal);
    const anal = fin(
        [
            [L * 0.06, -H * 0.65],
            [-L * 0.04, -H * (cardinal ? 2.0 : 1.45)],
            [-L * 0.39, -H * 0.42],
            [-L * 0.2, -H * 0.52]
        ],
        p.fin,
        p.color,
        cardinal
    );
    if (resolvedId === 'valentiniPuffer') {
        anal.scale.set(0.45, 0.45, 1);
        anal.position.x = -L * 0.22;
    }
    group.add(anal);
    let sail = null;
    if (resolvedId === 'firefishGoby') {
        sail = fin(
            [
                [0, 0],
                [-0.015, 0.26],
                [-0.047, 0.29],
                [-0.062, 0.04]
            ],
            0xf3d7b0,
            0xfdf4db
        );
        sail.position.set(L * 0.18, H * 0.8, 0);
        group.add(sail);
    }
    const paired = [];
    for (const side of [-1, 1]) {
        const f = fin(
            [
                [0, 0],
                [-L * 0.12, H * 0.5],
                [-L * (mandarin ? 0.43 : 0.25), 0],
                [-L * 0.15, -H * (mandarin ? 1.3 : 0.6)]
            ],
            mandarin ? 0x21b8bb : p.fin,
            mandarin ? 0xe68d28 : 0xf7dba9
        );
        f.position.set(L * 0.13, -H * 0.12, side * p.width * 0.85);
        f.rotation.x = side * 0.75;
        f.rotation.y = side * 0.45;
        f.userData.side = side;
        group.add(f);
        paired.push(f);
        const pelvic = fin(
            [
                [0, 0],
                [-L * 0.16, -H * 0.65],
                [-L * 0.2, -H * 0.2]
            ],
            p.fin
        );
        pelvic.position.set(L * 0.13, -H * 0.65, side * p.width * 0.35);
        pelvic.rotation.y = side * 0.28;
        if (resolvedId !== 'valentiniPuffer') group.add(pelvic);
    }
    // Surgeonfish scalpel at the caudal peduncle; blenny cirri above the eyes.
    if (tang)
        for (const side of [-1, 1])
            sphere(
                group,
                new THREE.MeshStandardMaterial({ color: 0xfff1c8 }),
                [-L * 0.35, 0, side * p.width * 0.38],
                [L * 0.055, 0.007, 0.003]
            );
    if (blenny)
        for (const side of [-1, 1]) {
            const cirrus = new THREE.Mesh(
                new THREE.ConeGeometry(0.006, 0.04, 6),
                muzzle
            );
            cirrus.position.set(
                eyeX,
                eyeY + eyeSize + 0.015,
                side * p.width * 0.65
            );
            group.add(cirrus);
        }
    group.userData.fishRig = {
        swim,
        tail,
        paired,
        dorsal,
        anal,
        sail,
        profile: p
    };
    return group;
}

export function animateFishModel(mesh, fish, timeSeconds, deltaSeconds) {
    const rig = mesh.userData.fishRig;
    if (!rig) return;
    const active = fish.alive !== false;
    const speed = Math.min(1.5, Math.max(0, mesh.userData.swimSpeed || 0));
    const target = active ? 0.012 + speed * 0.027 : 0;
    rig.swim.amplitude.value +=
        (target - rig.swim.amplitude.value) * (1 - Math.exp(-8 * deltaSeconds));
    const rate = rig.profile.frequency + speed * 2;
    // Integrate phase: changing speed cannot jump the tail to a new wave phase.
    rig.swim.time.value += deltaSeconds * rate * Math.PI * 2 * (active ? 1 : 0);
    rig.swim.phase.value = mesh.userData.animationPhase || 0;
    const phase = rig.swim.time.value + rig.swim.phase.value;
    const amp = rig.swim.amplitude.value;
    rig.tail.position.z = Math.sin(phase - 3.4) * amp;
    rig.tail.rotation.y = Math.cos(phase - 3.4) * amp * 7;
    rig.dorsal.rotation.x = Math.sin(phase - 1.3) * amp * 1.3;
    rig.anal.rotation.x = -Math.sin(phase - 1.5) * amp * 1.1;
    for (const f of rig.paired) {
        const side = f.userData.side;
        f.rotation.y =
            side * (0.45 + (active ? Math.sin(phase * 1.5 + side) * 0.32 : 0));
        f.rotation.x =
            side *
            (0.75 +
                Math.min(0.25, Math.abs(mesh.userData.turnRate || 0) * 0.15));
    }
    if (rig.sail)
        rig.sail.rotation.z = active
            ? -0.12 + Math.sin(timeSeconds * 3) * 0.1
            : -0.5;
}
