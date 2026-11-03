import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const mergeBufferGeometries =
    BufferGeometryUtils.mergeBufferGeometries.bind(BufferGeometryUtils);

const IDS = new Set([
    'serpentStar',
    'trochusSnail',
    'cerithSnail',
    'hermitCrab',
    'turboSnail',
    'nassariusSnail',
    'emeraldCrab',
    'cleanerShrimp',
    'peppermintShrimp'
]);
const v = (x, y, z) => new THREE.Vector3(x, y, z);
function mat(color, translucent = false) {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color).convertSRGBToLinear(),
        roughness: 0.38,
        clearcoat: 0.55,
        clearcoatRoughness: 0.2,
        transparent: translucent,
        opacity: translucent ? 0.84 : 1,
        depthWrite: !translucent
    });
}
function sphere(parent, material, xyz, scale) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), material);
    mesh.position.set(...xyz);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
}
function tube(parent, material, points, radius, segments = 12) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => v(...p)));
    const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, segments, radius, 6, false),
        material
    );
    parent.add(mesh);
    return mesh;
}
function shell(parent, elongated = false) {
    // One watertight shell envelope. A separated spiral tube looked like a stack
    // of unrelated shells; spiral ribs now live on a continuous body whorl.
    const vertices = [],
        colors = [],
        indices = [];
    const rings = 64,
        sides = 64;
    const height = elongated ? 0.29 : 0.24;
    for (let i = 0; i <= rings; i++) {
        const t = i / rings;
        const radius =
            Math.sin(Math.PI * t) *
            (elongated ? 0.15 * (1 - 0.55 * t) : 0.17 * (1 - 0.28 * t));
        for (let j = 0; j <= sides; j++) {
            const angle = (j / sides) * Math.PI * 2;
            const spiral = angle + t * Math.PI * (elongated ? 11 : 7);
            const ribs = 1 + 0.035 * Math.cos(spiral * 2);
            vertices.push(
                Math.cos(angle) * radius * ribs,
                t * height,
                Math.sin(angle) * radius * ribs
            );
            const stripe =
                0.66 +
                0.24 * Math.cos(spiral) +
                0.05 * Math.cos(angle * 19 + t * 70);
            colors.push(stripe, stripe * 0.77, stripe * 0.49);
            if (i < rings && j < sides) {
                const n = i * (sides + 1) + j;
                indices.push(
                    n,
                    n + sides + 1,
                    n + 1,
                    n + 1,
                    n + sides + 1,
                    n + sides + 2
                );
            }
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const material = mat(0xffffff);
    material.vertexColors = true;
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(-0.055, 0.055, 0);
    mesh.userData.anatomicalPart = 'shell';
    parent.add(mesh);
    return mesh;
}
function limb(root, color, side, index, shrimp = false) {
    const group = new THREE.Group();
    group.position.set(
        (shrimp ? 0.11 : 0.07) - index * 0.045,
        shrimp ? 0.09 : 0.07,
        side * 0.065
    );
    const endX = (index - 1.5) * -0.035;
    tube(
        group,
        color,
        [
            [0, 0, 0],
            [endX * 0.5, 0.01, side * 0.09],
            [endX, shrimp ? -0.09 : -0.06, side * 0.15]
        ],
        shrimp ? 0.004 : 0.009
    );
    if (!shrimp)
        sphere(
            group,
            color,
            [endX * 0.5, 0.01, side * 0.09],
            [0.013, 0.013, 0.013]
        );
    root.add(group);
    root.userData.legs.push({ group, phase: index * 1.6 + side * Math.PI });
}

export function createInvertebrateModel(animal, id = animal.templateId) {
    if (!IDS.has(id)) return null;
    const root = new THREE.Group();
    root.userData = {
        modelKind: 'invertebrate',
        speciesId: id,
        legs: [],
        feelers: [],
        claws: []
    };
    const black = mat(0x101923),
        white = mat(0xfff0dc);
    if (id === 'serpentStar') {
        sphere(root, mat(0x9b7968), [0, 0.035, 0], [0.1, 0.035, 0.1]);
        const arms = [];
        for (let arm = 0; arm < 5; arm++) {
            const group = new THREE.Group();
            group.rotation.y = (arm * Math.PI * 2) / 5;
            for (let k = 0; k < 17; k++) {
                const x = 0.07 + k * 0.022,
                    z = Math.sin(k * 0.22) * 0.04,
                    r = 0.022 * (1 - k / 20);
                sphere(
                    group,
                    mat(k % 2 ? 0x493e38 : 0xc6aa86),
                    [x, 0.025, z],
                    [0.016, r, r]
                );
            }
            root.add(group);
            arms.push(group);
        }
        root.userData.starArms = arms;
    } else if (id.includes('Snail')) {
        const nassarius = id === 'nassariusSnail' || id === 'cerithSnail';
        const flesh = mat(nassarius ? 0xc6b49a : 0x778d73);
        const foot = sphere(
            root,
            flesh,
            [0.025, 0.032, 0],
            [0.23, 0.035, 0.115]
        );
        root.userData.foot = foot;
        // The mantle fills the aperture beneath the body whorl and joins the
        // shell to the muscular foot, including when viewed against glass.
        const mantle = sphere(
            root,
            flesh,
            [-0.055, 0.085, 0],
            [0.13, 0.07, 0.095]
        );
        mantle.userData.anatomicalPart = 'mantle';
        root.userData.mantle = mantle;
        const snailShell = shell(root, nassarius);
        if (id === 'trochusSnail') {
            snailShell.scale.set(0.8, 1.5, 0.8);
        }
        if (id === 'cerithSnail') {
            snailShell.scale.set(0.7, 1.55, 0.7);
            snailShell.rotation.z = 0.2;
        }
        sphere(root, flesh, [0.17, 0.065, 0], [0.07, 0.045, 0.065]);
        for (const side of [-1, 1]) {
            const antenna = new THREE.Group();
            antenna.position.set(0.19, 0.08, side * 0.035);
            tube(
                antenna,
                flesh,
                [
                    [0, 0, 0],
                    [0.05, 0.035, side * 0.02],
                    [0.08, 0.05, side * 0.04]
                ],
                0.004
            );
            sphere(
                antenna,
                black,
                [0.05, 0.035, side * 0.02],
                [0.007, 0.007, 0.007]
            );
            root.add(antenna);
            root.userData.feelers.push(antenna);
        }
        if (nassarius)
            tube(
                root,
                flesh,
                [
                    [0.15, 0.08, 0],
                    [0.23, 0.16, 0],
                    [0.25, 0.23, 0]
                ],
                0.012
            );
    } else if (id.includes('Shrimp')) {
        const cleaner = id === 'cleanerShrimp';
        const flesh = mat(cleaner ? 0xe95135 : 0xf3b5a5, !cleaner),
            red = mat(0xc52d31);
        sphere(root, flesh, [0.065, 0.12, 0], [0.13, 0.07, 0.055]);
        const tail = new THREE.Group();
        tail.position.set(-0.04, 0.105, 0);
        root.add(tail);
        root.userData.tail = tail;
        for (let i = 0; i < 6; i++) {
            const x = -i * 0.037,
                y = -0.003 * i * i;
            sphere(
                tail,
                flesh,
                [x, y, 0],
                [0.032, 0.048 - i * 0.004, 0.049 - i * 0.004]
            );
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.041 - i * 0.003, 0.003, 5, 16),
                cleaner ? white : red
            );
            ring.rotation.y = Math.PI / 2;
            ring.position.set(x - 0.015, y, 0);
            tail.add(ring);
        }
        for (const side of [-1, 0, 1]) {
            const fan = sphere(
                tail,
                cleaner ? red : flesh,
                [-0.22, -0.08, side * 0.032],
                [0.045, 0.008, 0.03]
            );
            fan.rotation.y = side * 0.45;
        }
        // Longitudinal dorsal stripe is diagnostic for skunk cleaner shrimp.
        tube(
            root,
            cleaner ? white : red,
            [
                [-0.2, 0.1, 0],
                [-0.08, 0.16, 0],
                [0.1, 0.183, 0],
                [0.23, 0.18, 0]
            ],
            cleaner ? 0.009 : 0.004
        );
        if (!cleaner)
            for (const side of [-1, 1])
                tube(
                    root,
                    red,
                    [
                        [-0.2, 0.08, side * 0.018],
                        [-0.04, 0.14, side * 0.04],
                        [0.18, 0.14, side * 0.035]
                    ],
                    0.004
                );
        tube(
            root,
            flesh,
            [
                [0.14, 0.16, 0],
                [0.22, 0.19, 0],
                [0.28, 0.2, 0]
            ],
            0.006
        );
        for (const side of [-1, 1]) {
            tube(
                root,
                flesh,
                [
                    [0.14, 0.14, side * 0.03],
                    [0.19, 0.19, side * 0.045]
                ],
                0.006
            );
            sphere(
                root,
                black,
                [0.19, 0.19, side * 0.045],
                [0.012, 0.013, 0.012]
            );
            for (let i = 0; i < 5; i++)
                limb(root, cleaner ? white : flesh, side, i, true);
            for (let k = 0; k < 2; k++) {
                const antenna = new THREE.Group();
                antenna.position.set(0.18, 0.15, side * 0.025);
                tube(
                    antenna,
                    cleaner ? white : red,
                    [
                        [0, 0, 0],
                        [0.15, 0.11 + k * 0.05, side * 0.09],
                        [
                            0.38 - k * 0.1,
                            0.15 + k * 0.1,
                            side * (0.16 + k * 0.05)
                        ]
                    ],
                    0.0025,
                    20
                );
                root.add(antenna);
                root.userData.feelers.push(antenna);
            }
        }
    } else {
        const hermit = id === 'hermitCrab';
        const armor = mat(hermit ? 0x275ab0 : 0x377a4c),
            joint = mat(hermit ? 0x63afeb : 0x5b9b58);
        sphere(
            root,
            armor,
            [0.04, 0.095, 0],
            hermit ? [0.09, 0.06, 0.075] : [0.12, 0.065, 0.14]
        );
        if (hermit) {
            const s = shell(root, true);
            s.rotation.z = -0.6;
            s.position.x = -0.1;
        } else {
            const bumps = [];
            for (let i = 0; i < 42; i++) {
                const a = i * 2.4,
                    r = 0.1 * Math.sqrt(i / 42);
                const geo = new THREE.SphereGeometry(0.008, 6, 4);
                geo.translate(
                    0.04 + Math.cos(a) * r,
                    0.15 - r * 0.18,
                    Math.sin(a) * r
                );
                bumps.push(geo);
            }
            root.add(new THREE.Mesh(mergeBufferGeometries(bumps), joint));
            bumps.forEach((g) => g.dispose());
        }
        for (const side of [-1, 1]) {
            // Hermits expose two walking pairs; their rear two pairs hold the shell.
            for (let i = 0; i < (hermit ? 2 : 4); i++)
                limb(root, i % 2 ? joint : armor, side, i);
            tube(
                root,
                joint,
                [
                    [0.1, 0.12, side * 0.025],
                    [0.14, 0.18, side * 0.04]
                ],
                0.007
            );
            sphere(
                root,
                black,
                [0.14, 0.18, side * 0.04],
                [0.011, 0.012, 0.011]
            );
            const claw = new THREE.Group();
            claw.position.set(0.11, 0.085, side * 0.09);
            tube(
                claw,
                armor,
                [
                    [0, 0, 0],
                    [0.08, -0.015, side * 0.02],
                    [0.12, 0.015, side * 0.02]
                ],
                0.013
            );
            sphere(
                claw,
                joint,
                [0.135, 0.02, side * 0.02],
                [0.035, 0.027, 0.025]
            );
            tube(
                claw,
                armor,
                [
                    [0.15, 0.035, side * 0.02],
                    [0.19, 0.03, side * 0.02],
                    [0.2, 0.015, side * 0.02]
                ],
                0.008
            );
            const finger = new THREE.Group();
            finger.position.set(0.15, 0.005, side * 0.02);
            tube(
                finger,
                armor,
                [
                    [0, 0, 0],
                    [0.035, -0.01, 0],
                    [0.05, 0.01, 0]
                ],
                0.007
            );
            claw.add(finger);
            root.add(claw);
            root.userData.claws.push(finger);
        }
    }
    // Put the contact points on local y=0 for both sand and sloping rock.
    root.updateMatrixWorld(true);
    const base = new THREE.Box3().setFromObject(root).min.y;
    for (const child of root.children) child.position.y -= base;
    if (id === 'nassariusSnail') {
        const burrowGroup = new THREE.Group();
        for (const child of [...root.children]) burrowGroup.add(child);
        root.add(burrowGroup);
        root.userData.burrowGroup = burrowGroup;
    }
    return root;
}

export function animateInvertebrateModel(
    mesh,
    animal,
    timeSeconds,
    delta = 1 / 60
) {
    if (animal.alive === false) return;
    (mesh.userData.starArms || []).forEach((arm, i) => {
        arm.rotation.y =
            (i * Math.PI * 2) / 5 + Math.sin(timeSeconds * 0.7 + i) * 0.08;
    });
    if (mesh.userData.burrowGroup) {
        const target = -(mesh.userData.burrowDepth || 0);
        mesh.userData.burrowGroup.position.y +=
            (target - mesh.userData.burrowGroup.position.y) *
            (1 - Math.exp(-2 * Math.max(0, delta)));
    }
    const stride =
        mesh.userData.swimSpeed === undefined
            ? 1
            : Math.min(1, mesh.userData.swimSpeed / 0.035);
    for (const leg of mesh.userData.legs || []) {
        leg.group.rotation.y =
            Math.sin(timeSeconds * 4 + leg.phase) * 0.13 * stride;
        leg.group.rotation.x =
            Math.cos(timeSeconds * 4 + leg.phase) * 0.04 * stride;
    }
    (mesh.userData.feelers || []).forEach((feeler, i) => {
        feeler.rotation.y = Math.sin(timeSeconds * 1.2 + i * 1.8) * 0.18;
        feeler.rotation.z = Math.sin(timeSeconds * 0.8 + i) * 0.08;
    });
    (mesh.userData.claws || []).forEach((finger, i) => {
        finger.rotation.z =
            -0.15 - (0.5 + 0.5 * Math.sin(timeSeconds * 2.4 + i * 2)) * 0.3;
    });
    if (mesh.userData.tail)
        mesh.userData.tail.rotation.z = Math.sin(timeSeconds * 1.6) * 0.045;
    if (mesh.userData.foot)
        mesh.userData.foot.scale.y =
            0.035 * (1 + Math.sin(timeSeconds * 2) * 0.06);
}
