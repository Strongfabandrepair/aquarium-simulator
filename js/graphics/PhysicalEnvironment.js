import * as THREE from 'three';
import { createDecor, createBackground } from './DecorModels.js';
import TextureGenerator from './TextureGenerator.js';
import {
    getTankSpec,
    tankOutline,
    substrateHeight,
    defaultRockPlacements,
    constrainPoint,
    waterLevel
} from '../model/TankGeometry.js';

const labels = new Map();
const mat = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...extra });
function mesh(parent, geometry, material, p = [0, 0, 0]) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...p);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
}
const box = (g, m, size, p) => mesh(g, new THREE.BoxGeometry(...size), m, p);
const cylinder = (g, m, r, h, p, top = r) =>
    mesh(g, new THREE.CylinderGeometry(top, r, h, 24), m, p);
function hose(g, points, radius = 0.003, color = 0x303b40) {
    return mesh(
        g,
        new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
                points.map((p) => new THREE.Vector3(...p))
            ),
            20,
            radius,
            6,
            false
        ),
        mat(color)
    );
}
function label(g, text, width, p) {
    if (typeof document === 'undefined') return;
    let texture = labels.get(text);
    if (!texture) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 64;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#122435';
        ctx.fillRect(0, 0, 256, 64);
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#d6f8ff';
        ctx.fillText(text, 128, 32, 244);
        texture = new THREE.CanvasTexture(c);
        texture.encoding = THREE.sRGBEncoding;
        labels.set(text, texture);
    }
    mesh(
        g,
        new THREE.PlaneGeometry(width, width / 4),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
        p
    ).castShadow = false;
}
export function footprintShape(spec) {
    const shape = new THREE.Shape();
    tankOutline(spec).forEach((p, i) =>
        i ? shape.lineTo(p.x, -p.z) : shape.moveTo(p.x, -p.z)
    );
    shape.closePath();
    return shape;
}
export function horizontalGeometry(spec, thickness = 0) {
    const geo =
        thickness > 0
            ? new THREE.ExtrudeGeometry(footprintShape(spec), {
                  depth: thickness,
                  bevelEnabled: false,
                  steps: 1
              })
            : new THREE.ShapeGeometry(footprintShape(spec), 48);
    geo.rotateX(-Math.PI / 2);
    return geo;
}
function glassWalls(spec, material) {
    const points = tankOutline(spec),
        positions = [],
        indices = [];
    for (const p of points)
        positions.push(p.x, -spec.height / 2, p.z, p.x, spec.height / 2, p.z);
    for (let i = 0; i < points.length; i++) {
        const n = (i + 1) % points.length;
        indices.push(i * 2, n * 2, i * 2 + 1, n * 2, n * 2 + 1, i * 2 + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
}
function equipment(parent, state, s, floor) {
    const eq = state.equipment,
        w = s.width,
        h = s.height,
        d = s.depth;
    const black = mat(0x18232d, { roughness: 0.35 }),
        silver = mat(0xa4b4be, { metalness: 0.85, roughness: 0.25 }),
        blue = mat(0x1678a5),
        red = mat(0xcc3f46);
    const clear = mat(0xb9ebff, {
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const group = (id) => {
        const g = new THREE.Group();
        g.userData = { isEnv: true, type: id, equipmentId: id };
        parent.add(g);
        return g;
    };
    const attach = (g, x, y, z, margin = 0.04) => {
        const p = constrainPoint(s, { x, y, z }, margin);
        g.position.set(p.x, p.y, p.z);
    };
    if (eq.heater) {
        const g = group('heater'),
            length = Math.min(0.27, h * 0.65);
        cylinder(g, silver, 0.012, length);
        cylinder(g, black, 0.017, 0.035, [0, length / 2, 0]);
        for (const y of [-length * 0.32, length * 0.32]) {
            const cup = cylinder(g, black, 0.021, 0.01, [0, y, -0.02]);
            cup.rotation.x = Math.PI / 2;
        }
        mesh(
            g,
            new THREE.SphereGeometry(0.004, 8, 6),
            new THREE.MeshBasicMaterial({
                color: eq.heaterOn ? 0xff4522 : 0x28353d
            }),
            [0, length / 2, 0.017]
        );
        attach(g, -w * 0.38, -0.015, -d * 0.4);
        hose(
            g,
            [
                [0, length / 2 + 0.015, 0],
                [0, h / 2 - g.position.y + 0.04, -0.02],
                [0.04, h / 2 - g.position.y + 0.04, -0.05]
            ],
            0.002
        );
        label(g, 'HEATER', 0.065, [0, -length * 0.18, 0.013]);
    }
    for (const id of ['powerhead', 'wavemaker'])
        if (eq[id]) {
            const g = group(id),
                r = Math.min(0.035, d * 0.1);
            cylinder(g, black, r, 0.018).rotation.z = Math.PI / 2;
            cylinder(g, black, r * 0.88, 0.042, [0.027, 0, 0]).rotation.z =
                Math.PI / 2;
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                box(
                    g,
                    silver,
                    [0.043, 0.0025, 0.003],
                    [0.035, Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92]
                ).rotation.x = a;
            }
            mesh(
                g,
                new THREE.TorusGeometry(r * 0.92, 0.003, 6, 24),
                black,
                [0.057, 0, 0]
            ).rotation.y = Math.PI / 2;
            mesh(
                g,
                new THREE.CircleGeometry(r * 0.6, 3),
                blue,
                [0.06, 0, 0]
            ).rotation.y = Math.PI / 2;
            attach(
                g,
                id === 'powerhead' ? -w * 0.46 : w * 0.46,
                h * 0.24,
                0,
                0.035
            );
            if (id === 'wavemaker') g.rotation.y = Math.PI;
            label(
                g,
                id === 'powerhead' ? 'FLOW' : 'WAVE',
                0.055,
                [0, -0.05, 0.02]
            );
        }
    if (eq.proteinSkimmer) {
        const g = group('proteinSkimmer'),
            height = Math.min(0.28, h * 0.65),
            r = Math.min(0.035, d * 0.1);
        cylinder(g, clear, r, height, [0, height / 2, 0]);
        cylinder(g, clear, r, 0.045, [0, height + 0.022, 0], r * 0.44);
        cylinder(g, clear, r * 1.15, 0.055, [0, height + 0.07, 0]);
        cylinder(g, black, r * 1.2, 0.007, [0, height + 0.1, 0]);
        cylinder(
            g,
            mat(0x9b8850, { transparent: true, opacity: 0.7 }),
            r * 0.98,
            0.015,
            [0, height + 0.06, 0]
        );
        box(g, red, [r * 2.3, 0.016, r * 2.3], [0, 0, 0]);
        box(g, black, [0.045, 0.035, 0.035], [r + 0.02, 0.025, 0]);
        hose(
            g,
            [
                [r + 0.02, 0.04, 0],
                [r + 0.035, height + 0.05, 0],
                [0, height + 0.07, 0]
            ],
            0.0025,
            0xd9dfe1
        );
        attach(g, w * 0.37, floor + 0.025, -d * 0.3, 0.075);
        label(g, 'SKIMMER', 0.075, [0, height * 0.55, r + 0.002]);
    }
    if (eq.lightBasic || eq.lightReef) {
        const g = group(eq.lightReef ? 'lightReef' : 'lightBasic'),
            length = w * 0.76,
            depth = Math.min(0.12, d * 0.4);
        box(g, black, [length, 0.025, depth], [0, h / 2 + 0.08, 0]);
        for (let i = 0; i < 10; i++)
            box(
                g,
                silver,
                [0.003, 0.009, depth * 0.9],
                [-length / 2 + (length * (i + 0.5)) / 10, h / 2 + 0.097, 0]
            );
        const led = new THREE.MeshBasicMaterial({
            color: eq.lightOn ? (eq.lightReef ? 0xa0d3ff : 0xffedc4) : 0x3a414c
        });
        for (let i = 0; i < 12; i++)
            cylinder(g, led, 0.006, 0.002, [
                -length / 2 + (length * (i + 0.5)) / 12,
                h / 2 + 0.066,
                0
            ]).castShadow = false;
        for (const side of [-1, 1])
            box(
                g,
                black,
                [0.01, 0.09, 0.055],
                [side * w * 0.4, h / 2 + 0.03, 0]
            );
        label(g, eq.lightReef ? 'REEF LED' : 'DAYLIGHT', 0.12, [
            0,
            h / 2 + 0.081,
            depth / 2 + 0.001
        ]);
        // The scene's area-light approximation sits above this visible housing.
        // Let its light pass through the fixture instead of shadowing the tank.
        g.traverse((object) => {
            object.castShadow = false;
        });
    }
    if (eq.returnPump) {
        const g = group('returnPump'),
            p = constrainPoint(
                s,
                { x: w * 0.3, y: floor + 0.035, z: -d * 0.32 },
                0.05
            );
        box(g, black, [0.06, 0.05, 0.045], [p.x, p.y, p.z]);
        hose(
            g,
            [
                [p.x, p.y + 0.02, p.z],
                [p.x, waterLevel(s) - 0.03, p.z],
                [p.x - 0.08, waterLevel(s) - 0.03, p.z + 0.025]
            ],
            0.009
        );
        label(g, 'RETURN', 0.055, [p.x, p.y, p.z + 0.023]);
    }
    if (eq.thermometer) {
        const g = group('thermometer');
        attach(g, w * 0.33, h * 0.16, d * 0.45, 0.015);
        box(g, black, [0.035, 0.055, 0.008], [0, 0, 0]);
        label(g, 'TEMP', 0.029, [0, 0.008, 0.005]);
    }
    if (eq.autoTopOff) {
        const g = group('autoTopOff');
        attach(g, w * 0.36, waterLevel(s) - 0.025, -d * 0.4, 0.025);
        cylinder(g, blue, 0.009, 0.022);
        hose(
            g,
            [
                [0, 0.01, 0],
                [0, 0.1, -0.01],
                [0.04, 0.12, -0.03]
            ],
            0.002
        );
        label(g, 'ATO', 0.035, [0, -0.025, 0.012]);
    }
    const outer = w / 2 + 0.075;
    if (eq.dosingPump) {
        const g = group('dosingPump');
        box(g, black, [0.14, 0.065, 0.055], [outer + 0.035, -h / 2 - 0.09, 0]);
        for (let i = 0; i < 3; i++) {
            cylinder(g, i === 0 ? blue : i === 1 ? red : silver, 0.016, 0.01, [
                outer - 0.012 + i * 0.045,
                -h / 2 - 0.09,
                0.033
            ]).rotation.x = Math.PI / 2;
            hose(
                g,
                [
                    [outer - 0.012 + i * 0.045, -h / 2 - 0.09, 0.04],
                    [outer + i * 0.01, h / 2 + 0.025, -0.02],
                    [w * 0.3 + i * 0.015, waterLevel(s), -0.03]
                ],
                0.0015,
                [0x74cbff, 0xff949b, 0xb6e8bf][i]
            );
        }
        label(g, 'DOSING', 0.1, [outer + 0.035, -h / 2 - 0.065, 0.03]);
    }
    if (eq.sump) {
        const g = group('sump'),
            sw = w * 0.65,
            sd = Math.min(d * 0.75, 0.35);
        box(g, clear, [sw, 0.2, sd], [0, -h / 2 - 0.3, 0]);
        box(
            g,
            mat(0x246278, { transparent: true, opacity: 0.28 }),
            [sw - 0.01, 0.1, sd - 0.01],
            [0, -h / 2 - 0.34, 0]
        );
        for (const x of [-sw * 0.18, sw * 0.18])
            box(g, clear, [0.004, 0.15, sd - 0.006], [x, -h / 2 - 0.28, 0]);
        label(g, 'SUMP', 0.1, [0, -h / 2 - 0.23, sd / 2 + 0.001]);
    }
    for (const [i, id] of ['mediaReactor', 'uvSterilizer'].entries())
        if (eq[id]) {
            const g = group(id),
                x = outer + 0.04,
                z = -d * 0.2 + i * 0.11;
            cylinder(g, id === 'mediaReactor' ? clear : black, 0.025, 0.19, [
                x,
                -h / 2 - 0.24,
                z
            ]);
            cylinder(g, blue, 0.029, 0.012, [x, -h / 2 - 0.14, z]);
            cylinder(g, black, 0.029, 0.012, [x, -h / 2 - 0.34, z]);
            if (id === 'mediaReactor')
                cylinder(g, mat(0x5f4132), 0.02, 0.12, [x, -h / 2 - 0.27, z]);
            hose(
                g,
                [
                    [x, -h / 2 - 0.14, z],
                    [x, -h / 2 - 0.1, z - 0.02],
                    [w * 0.3, -h / 2 - 0.1, z - 0.02]
                ],
                0.004
            );
            label(g, id === 'mediaReactor' ? 'MEDIA' : 'UV', 0.055, [
                x,
                -h / 2 - 0.23,
                z + 0.026
            ]);
        }
    if (eq.macroAlgae) {
        const g = group('macroAlgae'),
            y = eq.sump ? -h / 2 - 0.32 : floor + 0.045,
            x = eq.sump ? 0 : -w * 0.32;
        for (let i = 0; i < 16; i++) {
            const ring = mesh(
                g,
                new THREE.TorusGeometry(0.019, 0.0018, 5, 18),
                mat(0x3d9155),
                [
                    x + Math.sin(i * 2.4) * 0.025,
                    y + Math.cos(i * 1.8) * 0.023,
                    Math.cos(i * 2.4) * 0.025
                ]
            );
            ring.rotation.set(i * 0.42, i * 0.75, 0);
        }
    }
    if (eq.quarantineTank) {
        const g = group('quarantineTank'),
            x = w / 2 + 0.31,
            y = -h / 2 - 0.22;
        box(g, clear, [0.4, 0.25, 0.22], [x, y, 0]);
        box(g, black, [0.405, 0.012, 0.225], [x, y - 0.125, 0]);
        cylinder(g, mat(0xe3e6df), 0.027, 0.07, [x, y - 0.095, 0]).rotation.z =
            Math.PI / 2;
        label(g, 'QUARANTINE', 0.15, [x, y + 0.07, 0.111]);
    }
    if (eq.rodiUnit) {
        const g = group('rodiUnit');
        for (let i = 0; i < 3; i++)
            cylinder(g, i === 0 ? blue : mat(0xf0eee6), 0.023, 0.14, [
                outer + i * 0.052,
                -h / 2 - 0.45,
                0
            ]);
        box(g, black, [0.17, 0.015, 0.055], [outer + 0.052, -h / 2 - 0.37, 0]);
        label(g, 'RO / DI', 0.12, [outer + 0.052, -h / 2 - 0.39, 0.03]);
    }
    for (const [i, id] of ['testKit', 'refractometer', 'saltMix'].entries())
        if (eq[id]) {
            const g = group(id),
                x = -w / 2 + 0.08 + i * 0.12,
                y = -h / 2 - 0.55;
            if (id === 'saltMix') {
                cylinder(g, mat(0xebe7dc), 0.035, 0.085, [x, y, 0]);
                cylinder(g, blue, 0.038, 0.007, [x, y + 0.043, 0]);
            } else
                box(
                    g,
                    id === 'testKit' ? blue : black,
                    [0.09, 0.035, 0.055],
                    [x, y, 0]
                );
            label(
                g,
                id === 'testKit'
                    ? 'TEST KIT'
                    : id === 'saltMix'
                      ? 'REEF SALT'
                      : 'SALINITY',
                0.078,
                [x, y, 0.036]
            );
        }
}

export function buildPhysicalEnvironment(state) {
    const spec = getTankSpec(state),
        eq = state.equipment,
        group = new THREE.Group();
    group.userData = {
        isEnv: true,
        type: 'environment',
        units: 'meters',
        tankSpec: spec
    };
    const floor = -spec.height / 2,
        sandDepth = substrateHeight(state),
        surface = floor + sandDepth,
        black = mat(0x14212d);
    if (eq.tank || eq.stand) {
        box(
            group,
            black,
            [spec.width + 0.035, 0.025, spec.depth + 0.035],
            [0, floor - 0.02, 0]
        );
        box(
            group,
            black,
            [spec.width + 0.035, 0.025, spec.depth + 0.035],
            [0, floor - 0.62, 0]
        );
        for (const x of [-1, 1])
            for (const z of [-1, 1])
                box(
                    group,
                    black,
                    [0.032, 0.6, 0.032],
                    [(x * spec.width) / 2, floor - 0.32, (z * spec.depth) / 2]
                );
    }
    if (!eq.tank) return group;
    const glass = mat(0x9bc8dc, {
        transparent: true,
        opacity: 0.085,
        depthWrite: false,
        roughness: 0.12,
        side: THREE.DoubleSide
    });
    const walls = glassWalls(spec, glass);
    walls.userData = { isEnv: true, type: 'glass' };
    walls.castShadow = false;
    group.add(walls);
    const bottom = mesh(group, horizontalGeometry(spec, 0.006), mat(0x253b44), [
        0,
        floor - 0.006,
        0
    ]);
    bottom.userData = { isEnv: true, type: 'bottom', placementSurface: true };
    for (const y of [floor, spec.height / 2]) {
        const points = tankOutline(spec).map(
            (p) => new THREE.Vector3(p.x, y, p.z)
        );
        points.push(points[0].clone());
        const rim = mesh(
            group,
            new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0),
                points.length * 2,
                0.003,
                6,
                false
            ),
            black
        );
        rim.userData = { isEnv: true, type: 'rim' };
    }
    if (sandDepth > 0) {
        const lit = (eq.lightBasic || eq.lightReef) && eq.lightOn;
        const m = mat(0xd4c2a3, {
            roughness: 0.96,
            emissive: 0x8aaebd,
            emissiveIntensity: lit ? 0.1 : 0
        });
        if (typeof document !== 'undefined') {
            m.emissiveMap = TextureGenerator.causticsTexture();
            m.emissiveMap.repeat.set(spec.width / 0.18, spec.depth / 0.18);
        }
        const sand = mesh(group, horizontalGeometry(spec, sandDepth), m, [
            0,
            floor,
            0
        ]);
        sand.userData = {
            isEnv: true,
            type: 'sand',
            isSand: true,
            placementSurface: true
        };
    }
    if (
        eq.liveRock > 0 ||
        state.placedItems?.some((item) => item.kind === 'rock')
    ) {
        const rocks = new THREE.Group();
        rocks.userData = { isEnv: true, type: 'rocks' };
        group.add(rocks);
        state.placedItems ||= [];
        if (eq.liveRock > 0 && !state.aquascapeInitialized) {
            if (!state.placedItems.some((i) => i.kind === 'rock'))
                state.placedItems.push(...defaultRockPlacements(spec, surface));
            state.aquascapeInitialized = true;
        }
        for (const item of state.placedItems.filter((i) => i.kind === 'rock')) {
            const size = Math.max(
                0.025,
                Math.min(0.5, Number(item.size) || 0.12)
            );
            const decoration = createDecor(item);
            if (decoration) {
                decoration.position.set(
                    item.position.x,
                    item.position.y,
                    item.position.z
                );
                decoration.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(
                        item.normal?.x || 0,
                        item.normal?.y ?? 1,
                        item.normal?.z || 0
                    ).normalize()
                );
                decoration.rotateY(item.rotation || 0);
                decoration.userData = {
                    isEnv: true,
                    type: 'rock',
                    placementSurface: true,
                    placedItemId: item.id,
                    id: item.id,
                    diameterMeters: size
                };
                rocks.add(decoration);
                continue;
            }
            const geo = new THREE.DodecahedronGeometry(size / 2, 2);
            geo.scale(1, 0.8, 0.78);
            geo.computeBoundingBox();
            geo.translate(0, -geo.boundingBox.min.y, 0);
            const m = mat(state.cycleComplete ? 0x8b6e85 : 0x918b7a, {
                roughness: 1
            });
            if (typeof document !== 'undefined')
                m.map = TextureGenerator.mottleTexture(
                    state.cycleComplete
                        ? 'physical-coralline'
                        : 'physical-rock',
                    state.cycleComplete ? 0x8b6e85 : 0x918b7a,
                    [0x746c64, 0xc4b5a0, 0x685775],
                    { count: 36, alpha: 0.28, speckle: 350 }
                );
            const rock = mesh(rocks, geo, m, [
                item.position.x,
                item.position.y,
                item.position.z
            ]);
            const n = new THREE.Vector3(
                item.normal?.x || 0,
                item.normal?.y ?? 1,
                item.normal?.z || 0
            ).normalize();
            rock.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
            rock.rotateY(Number(item.rotation) || 0);
            rock.userData = {
                isEnv: true,
                type: 'rock',
                placementSurface: true,
                placedItemId: item.id,
                id: item.id,
                diameterMeters: size
            };
        }
    }
    const backdrop = createBackground(state, spec);
    if (backdrop) group.add(backdrop);
    equipment(group, state, spec, surface);
    group.updateMatrixWorld(true);
    return group;
}
