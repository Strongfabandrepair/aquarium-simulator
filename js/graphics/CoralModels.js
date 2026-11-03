import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const mergeBufferGeometries =
    BufferGeometryUtils.mergeBufferGeometries.bind(BufferGeometryUtils);

const IDS = new Set([
    'bubbleTipAnemone',
    'toadstoolLeather',
    'candyCaneCoral',
    'zoanthids',
    'greenStarPolyps',
    'mushrooms',
    'xeniaCorals',
    'hammerCoral',
    'torchCoral',
    'frogspawn',
    'acropora',
    'montipora',
    'birdsnest'
]);
const rand = (n) => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
};
const vec = (x, y, z) => new THREE.Vector3(x, y, z);

function material(color, glow = 0) {
    return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color).convertSRGBToLinear(),
        roughness: 0.46,
        metalness: 0,
        clearcoat: 0.45,
        clearcoatRoughness: 0.3,
        emissive: new THREE.Color(color).convertSRGBToLinear(),
        emissiveIntensity: glow
    });
}

// Static details are merged by material, leaving only living polyps as articulated groups.
function batch(parent, geometries, mat) {
    if (!geometries.length) return;
    const merged = mergeBufferGeometries(
        geometries.map((g) => (g.index ? g.toNonIndexed() : g))
    );
    const mesh = new THREE.Mesh(merged, mat);
    parent.add(mesh);
    geometries.forEach((g) => g.dispose());
    return mesh;
}

function bead(x, y, z, r, stretch = [1, 1, 1]) {
    const g = new THREE.SphereGeometry(r, 10, 7);
    g.scale(...stretch);
    g.translate(x, y, z);
    return g;
}

function stem(a, b, r1, r2 = r1 * 0.7, sides = 9) {
    const d = b.clone().sub(a);
    const g = new THREE.CylinderGeometry(r2, r1, d.length(), sides, 1);
    g.applyMatrix4(
        new THREE.Matrix4().makeRotationFromQuaternion(
            new THREE.Quaternion().setFromUnitVectors(
                vec(0, 1, 0),
                d.normalize()
            )
        )
    );
    g.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
    return g;
}

function disk(radius, depth, lobes, phase) {
    const positions = [],
        colors = [],
        index = [];
    const rings = 12,
        segments = 64;
    for (let r = 0; r <= rings; r++) {
        const t = r / rings;
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            const edge =
                radius * t * (1 + 0.08 * t * Math.sin(a * lobes + phase));
            positions.push(
                Math.cos(a) * edge,
                depth * t * t + Math.sin(a * 20) * t * 0.009,
                Math.sin(a) * edge
            );
            const intensity = 0.7 + 0.3 * Math.pow(Math.cos(a * 23 + t * 4), 2);
            colors.push(intensity, intensity, intensity);
            if (r < rings && i < segments) {
                const n = r * (segments + 1) + i;
                index.push(
                    n,
                    n + segments + 1,
                    n + 1,
                    n + 1,
                    n + segments + 1,
                    n + segments + 2
                );
            }
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
}

export function createCoralModel(coral, id = coral.templateId) {
    if (!IDS.has(id)) return null;
    const root = new THREE.Group();
    root.userData = { modelKind: 'coral', speciesId: id, motions: [] };
    const rock = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.28, 1),
        material(0x655669)
    );
    rock.scale.set(1.35, 0.26, 1);
    rock.position.y = 0.025;
    root.add(rock);
    if (id === 'bubbleTipAnemone') {
        const column = new THREE.Mesh(
            new THREE.CylinderGeometry(0.19, 0.12, 0.18, 24),
            material(0x914c58)
        );
        column.position.y = 0.12;
        root.add(column);
        const oral = new THREE.Mesh(
            new THREE.SphereGeometry(0.29, 32, 16),
            material(0xb76b77)
        );
        oral.scale.y = 0.2;
        oral.position.y = 0.22;
        root.add(oral);
        const mouth = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 16, 8),
            material(0x65384c)
        );
        mouth.scale.set(1, 0.18, 0.45);
        mouth.position.y = 0.28;
        root.add(mouth);
        for (let i = 0; i < 64; i++) {
            const a = i * 2.39996,
                r = 0.12 + 0.15 * Math.sqrt(i / 64),
                h = 0.18 + 0.08 * rand(i + 4);
            const crown = new THREE.Group();
            crown.position.set(Math.cos(a) * r, 0.24, Math.sin(a) * r);
            const end = vec(Math.cos(a) * 0.06, h, Math.sin(a) * 0.06);
            const curve = new THREE.QuadraticBezierCurve3(
                vec(0, 0, 0),
                vec(-0.02, h * 0.6, 0.01),
                end
            );
            crown.add(
                new THREE.Mesh(
                    new THREE.TubeGeometry(curve, 8, 0.014, 6, false),
                    material(0xb76377, 0.035)
                )
            );
            crown.add(
                new THREE.Mesh(
                    bead(end.x, end.y, end.z, 0.033, [1, 1.3, 1]),
                    material(0xe8a49e, 0.07)
                )
            );
            root.add(crown);
            root.userData.motions.push({
                group: crown,
                phase: i * 1.7,
                kind: 'lps'
            });
        }
    } else if (['acropora', 'birdsnest'].includes(id)) {
        const fine = id === 'birdsnest';
        const branches = [],
            tips = [],
            pores = [];
        const branch = (a, b, radius, depth, seed) => {
            branches.push(stem(a, b, radius, radius * 0.7));
            const d = b.clone().sub(a);
            for (let p = 1; p < 5; p++) {
                const q = a.clone().addScaledVector(d, p / 5);
                for (let k = 0; k < 3; k++) {
                    const angle = (k * Math.PI * 2) / 3 + p;
                    pores.push(
                        bead(
                            q.x + Math.cos(angle) * radius,
                            q.y,
                            q.z + Math.sin(angle) * radius,
                            fine ? 0.007 : 0.012,
                            [1, 0.65, 1]
                        )
                    );
                }
            }
            if (!depth) {
                tips.push(bead(b.x, b.y, b.z, radius * 0.72, [1, 1.5, 1]));
                return;
            }
            const count = fine ? 2 : 3;
            for (let j = 0; j < count; j++) {
                const a2 = seed * 1.7 + (j * Math.PI * 2) / count;
                const len = (fine ? 0.14 : 0.15) * (0.8 + rand(seed + j) * 0.5);
                branch(
                    b,
                    b
                        .clone()
                        .add(
                            vec(
                                Math.cos(a2) * len,
                                len * (0.7 + rand(seed * 3 + j)),
                                Math.sin(a2) * len
                            )
                        ),
                    radius * 0.67,
                    depth - 1,
                    seed * 3 + j + 1
                );
            }
        };
        for (let i = 0; i < 5; i++) {
            const a = i * 2.4;
            branch(
                vec(Math.cos(a) * 0.1, 0.06, Math.sin(a) * 0.1),
                vec(Math.cos(a) * 0.16, 0.24, Math.sin(a) * 0.16),
                fine ? 0.025 : 0.043,
                fine ? 3 : 2,
                i + 1
            );
        }
        batch(root, branches, material(fine ? 0xe998c0 : 0x35afbd));
        batch(root, tips, material(fine ? 0xffdbdc : 0xb7ecff, 0.12));
        batch(root, pores, material(fine ? 0x82375d : 0x266b97));
    } else if (id === 'montipora') {
        const mat = material(0xe67843, 0.035);
        mat.side = THREE.DoubleSide;
        mat.vertexColors = true;
        for (let i = 0; i < 4; i++) {
            const plate = new THREE.Mesh(
                disk(0.36 - i * 0.045, 0.08, 7, i),
                mat
            );
            plate.position.set(
                Math.sin(i * 2) * 0.09,
                0.09 + i * 0.095,
                Math.cos(i * 2) * 0.06
            );
            plate.rotation.set(i * 0.06, i * 1.4, 0.12 * Math.sin(i));
            root.add(plate);
        }
    } else if (id === 'toadstoolLeather') {
        root.add(
            new THREE.Mesh(
                stem(vec(0, 0, 0), vec(0, 0.5, 0), 0.12, 0.09),
                material(0xb69a73)
            )
        );
        const cap = new THREE.Mesh(
            disk(0.42, 0.055, 8, 0.7),
            material(0xb9a486)
        );
        cap.position.y = 0.5;
        root.add(cap);
        const polyps = [];
        for (let i = 0; i < 90; i++) {
            const a = i * 2.39996,
                r = Math.sqrt((i + 0.5) / 90) * 0.39;
            const x = Math.cos(a) * r,
                z = Math.sin(a) * r,
                y = 0.5 + 0.055 * (r / 0.42) ** 2;
            polyps.push(stem(vec(x, y, z), vec(x, y + 0.06, z), 0.004));
            polyps.push(bead(x, y + 0.065, z, 0.012));
        }
        batch(root, polyps, material(0xc4e5ad, 0.03));
    } else if (id === 'candyCaneCoral') {
        const branches = [],
            heads = [],
            mouths = [];
        for (let i = 0; i < 7; i++) {
            const a = i * 2.4,
                r = i === 0 ? 0 : 0.25,
                x = Math.cos(a) * r,
                z = Math.sin(a) * r,
                y = 0.32 + rand(i) * 0.16;
            branches.push(
                stem(vec(x * 0.4, 0.03, z * 0.4), vec(x, y, z), 0.035, 0.05)
            );
            heads.push(bead(x, y, z, 0.11, [1, 0.55, 1]));
            const disc = disk(0.09, -0.012, 12, i);
            disc.translate(x, y + 0.055, z);
            mouths.push(disc);
            mouths.push(bead(x, y + 0.057, z, 0.018, [1, 0.2, 0.4]));
        }
        batch(root, branches, material(0x947f6b));
        batch(root, heads, material(0x629d77));
        const oral = material(0x83e4b2, 0.08);
        oral.side = THREE.DoubleSide;
        mouths.forEach((geometry) => {
            geometry.deleteAttribute('uv');
            geometry.deleteAttribute('color');
        });
        batch(root, mouths, oral);
    } else if (id === 'mushrooms') {
        const mat = material(0x3bada1, 0.05);
        mat.side = THREE.DoubleSide;
        mat.vertexColors = true;
        for (let i = 0; i < 7; i++) {
            const a = i * 2.4,
                rad = i ? 0.22 : 0;
            const polyp = new THREE.Group();
            polyp.position.set(
                Math.cos(a) * rad,
                0.13 + rand(i) * 0.04,
                Math.sin(a) * rad
            );
            polyp.add(new THREE.Mesh(disk(0.15, -0.025, 9, i), mat));
            const bumps = [];
            for (let j = 0; j < 35; j++) {
                const t = j * 2.4,
                    r = 0.125 * Math.sqrt(j / 35);
                bumps.push(
                    bead(
                        Math.cos(t) * r,
                        0.012 - r * 0.15,
                        Math.sin(t) * r,
                        0.009
                    )
                );
            }
            batch(polyp, bumps, material(0x8bd0ac));
            batch(
                polyp,
                [bead(0, 0.009, 0, 0.023, [1, 0.35, 0.6])],
                material(0x304b60)
            );
            root.add(polyp);
            root.userData.motions.push({
                group: polyp,
                phase: i,
                kind: 'disk'
            });
        }
    } else {
        const lps = ['hammerCoral', 'torchCoral', 'frogspawn'].includes(id);
        const xenia = id === 'xeniaCorals',
            star = id === 'greenStarPolyps';
        const count = lps ? 4 : xenia ? 9 : star ? 24 : 15;
        const flesh = material(
            lps ? 0x619c92 : xenia ? 0xd7b1d6 : star ? 0x41ba6a : 0x6e508c,
            0.04
        );
        const tipMat = material(
            lps ? 0xd8f58b : xenia ? 0xffd0e3 : 0xa5ee61,
            0.15
        );
        const mouths = material(0xf49b32, 0.09);
        for (let i = 0; i < count; i++) {
            const a = i * 2.39996,
                rad = 0.28 * Math.sqrt(i / count);
            const p = new THREE.Group();
            p.position.set(Math.cos(a) * rad, 0.06, Math.sin(a) * rad);
            const h = lps
                ? 0.15
                : xenia
                  ? 0.2 + rand(i) * 0.14
                  : star
                    ? 0.09
                    : 0.075;
            batch(
                p,
                [stem(vec(0, 0, 0), vec(0, h, 0), lps ? 0.06 : 0.023)],
                flesh
            );
            const crown = new THREE.Group();
            crown.position.y = h;
            p.add(crown);
            const tentacles = [],
                ends = [];
            const n = lps ? 16 : xenia || star ? 8 : 20;
            for (let j = 0; j < n; j++) {
                const angle = (j / n) * Math.PI * 2;
                const len = lps
                    ? (id === 'torchCoral' ? 0.3 : 0.17) *
                      (0.7 + rand(i * 33 + j) * 0.4)
                    : xenia
                      ? 0.095
                      : star
                        ? 0.065
                        : 0.035;
                const r = lps ? 0.055 : xenia || star ? 0.008 : 0.05;
                const end = vec(
                    Math.cos(angle) * (r + len * 0.55),
                    lps ? len : xenia ? len * 0.6 : 0.005,
                    Math.sin(angle) * (r + len * 0.55)
                );
                const start = vec(Math.cos(angle) * r, 0, Math.sin(angle) * r);
                const curve = new THREE.QuadraticBezierCurve3(
                    start,
                    start
                        .clone()
                        .lerp(end, 0.5)
                        .add(vec(0.025, len * 0.25, 0)),
                    end
                );
                tentacles.push(
                    new THREE.TubeGeometry(
                        curve,
                        7,
                        lps ? 0.012 : 0.0045,
                        6,
                        false
                    )
                );
                if (id === 'hammerCoral')
                    ends.push(
                        bead(end.x, end.y, end.z, 0.021, [1.9, 0.7, 0.8])
                    );
                else if (id === 'frogspawn')
                    for (let k = 0; k < 3; k++)
                        ends.push(
                            bead(
                                end.x + (k - 1) * 0.013,
                                end.y + Math.sin(k) * 0.012,
                                end.z,
                                0.014
                            )
                        );
                else if (lps) ends.push(bead(end.x, end.y, end.z, 0.015));
                else if (xenia) {
                    for (let k = 1; k < 6; k++) {
                        const q = start.clone().lerp(end, k / 6);
                        for (const side of [-1, 1])
                            tentacles.push(
                                stem(
                                    q,
                                    q
                                        .clone()
                                        .add(
                                            vec(
                                                Math.sin(angle) * side * 0.013,
                                                0.01,
                                                -Math.cos(angle) * side * 0.013
                                            )
                                        ),
                                    0.002
                                )
                            );
                    }
                }
            }
            batch(crown, tentacles, lps || xenia ? flesh : tipMat);
            batch(crown, ends, tipMat);
            if (!lps && !xenia && !star) {
                const oral = new THREE.Mesh(
                    new THREE.CircleGeometry(0.047, 24),
                    mouths
                );
                oral.rotation.x = -Math.PI / 2;
                oral.position.y = 0.002;
                crown.add(oral);
                batch(
                    crown,
                    [bead(0, 0.004, 0, 0.009, [1, 0.2, 1])],
                    material(0x422e68)
                );
            }
            root.add(p);
            root.userData.motions.push({
                group: crown,
                phase: i * 1.7,
                kind: xenia ? 'pulse' : lps ? 'lps' : 'polyp'
            });
        }
    }
    return root;
}

export function animateCoralModel(mesh, coral, timeSeconds) {
    const extension =
        coral.alive === false
            ? 0.2
            : THREE.MathUtils.clamp((coral.health ?? 100) / 100, 0.35, 1);
    for (const motion of mesh.userData.motions || []) {
        const wave = Math.sin(timeSeconds * 1.35 + motion.phase);
        motion.group.rotation.z = wave * (motion.kind === 'lps' ? 0.16 : 0.06);
        motion.group.rotation.x =
            Math.sin(timeSeconds * 0.9 + motion.phase) * 0.09;
        const pulse =
            motion.kind === 'pulse'
                ? 0.65 + 0.35 * Math.sin(timeSeconds * 2.6 + motion.phase)
                : 1;
        motion.group.scale.set(
            extension * pulse,
            extension * (motion.kind === 'pulse' ? 1.2 - pulse * 0.2 : 1),
            extension * pulse
        );
    }
}
