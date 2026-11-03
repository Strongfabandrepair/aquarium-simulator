import * as THREE from 'three';
import { DECOR_CATALOG, BACKGROUNDS } from '../model/DecorCatalog.js';
import TextureGenerator from './TextureGenerator.js';
const textures = new Map();
function material(color) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
}
function part(parent, geometry, mat, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
}
export function createDecor(item) {
    const t = DECOR_CATALOG.find((d) => d.id === item.templateId);
    if (!t) return null;
    const s = item.size,
        wood = material(t.color),
        brass = material(0xb39140);
    if (typeof document !== 'undefined')
        wood.map = TextureGenerator.mottleTexture(
            `decor-${t.id}`,
            t.color,
            [0x292d28, 0xc1af8d, 0x796981],
            { count: 90, alpha: 0.25, speckle: 1000 }
        );
    let geo;
    if (t.shape === 'ship')
        geo = new THREE.BoxGeometry(s * 0.78, s * 0.16, s * 0.3);
    else if (t.shape === 'chest')
        geo = new THREE.BoxGeometry(s * 0.78, s * 0.38, s * 0.5);
    else if (t.shape === 'arch')
        geo = new THREE.TorusGeometry(s * 0.32, s * 0.12, 8, 24, Math.PI);
    else {
        geo = new THREE.DodecahedronGeometry(s * 0.5, 2);
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i),
                y = p.getY(i),
                z = p.getZ(i);
            const f =
                0.82 +
                0.12 *
                    Math.sin((x / s) * 23 + (y / s) * 13) *
                    Math.cos((z / s) * 27);
            p.setXYZ(i, x * f, y * f, z * f);
        }
        geo.scale(
            1,
            t.shape === 'shelf' ? 0.24 : t.shape === 'pebble' ? 0.55 : 0.8,
            0.72
        );
        geo.computeVertexNormals();
    }
    geo.computeBoundingBox();
    geo.translate(0, -geo.boundingBox.min.y, 0);
    const root = new THREE.Mesh(geo, wood);
    root.castShadow = true;
    root.receiveShadow = true;
    if (t.shape === 'ship') {
        for (let k = 0; k < 7; k++)
            part(
                root,
                new THREE.BoxGeometry(s * 0.015, s * 0.03, s * 0.32),
                material(0x38271e),
                s * (k - 3) * 0.11,
                s * 0.16
            );
        for (const side of [-1, 1]) {
            const bow = part(
                root,
                new THREE.ConeGeometry(s * 0.15, s * 0.22, 4),
                wood,
                side * s * 0.39,
                s * 0.08
            );
            bow.rotation.z = (-side * Math.PI) / 2;
            bow.rotation.x = Math.PI / 4;
        }
        part(
            root,
            new THREE.CylinderGeometry(s * 0.014, s * 0.02, s * 0.52, 8),
            wood,
            0,
            s * 0.4
        );
        part(
            root,
            new THREE.BoxGeometry(s * 0.4, s * 0.014, s * 0.014),
            wood,
            0,
            s * 0.57
        );
        const sail = part(
            root,
            new THREE.PlaneGeometry(s * 0.32, s * 0.23),
            new THREE.MeshStandardMaterial({
                color: 0xbcb296,
                roughness: 1,
                side: THREE.DoubleSide
            }),
            -0.025 * s,
            s * 0.43,
            0.012 * s
        );
        sail.rotation.y = 0.12;
        for (const side of [-1, 1])
            for (let i = 0; i < 4; i++)
                part(
                    root,
                    new THREE.TorusGeometry(s * 0.025, s * 0.007, 5, 12),
                    brass,
                    s * (i - 1.5) * 0.15,
                    s * 0.09,
                    side * s * 0.153
                );
    } else if (t.shape === 'chest') {
        const lid = part(
            root,
            new THREE.CylinderGeometry(
                s * 0.25,
                s * 0.25,
                s * 0.78,
                16,
                1,
                false,
                0,
                Math.PI
            ),
            wood,
            0,
            s * 0.38
        );
        lid.rotation.z = Math.PI / 2;
        for (const x of [-s * 0.27, s * 0.27])
            part(
                root,
                new THREE.BoxGeometry(s * 0.035, s * 0.43, s * 0.515),
                brass,
                x,
                s * 0.215
            );
        part(
            root,
            new THREE.BoxGeometry(s * 0.09, s * 0.12, s * 0.025),
            brass,
            0,
            s * 0.32,
            s * 0.26
        );
        for (let i = 0; i < 9; i++) {
            const coin = part(
                root,
                new THREE.CylinderGeometry(s * 0.035, s * 0.035, s * 0.012, 12),
                brass,
                ((i % 3) - 1) * s * 0.055,
                s * 0.42 + Math.floor(i / 3) * s * 0.012,
                s * 0.1
            );
            coin.rotation.x = 0.2;
        }
    }
    // Normalize every decorative silhouette to its promised footprint and floor contact.
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const span = Math.hypot(
        bounds.max.x - bounds.min.x,
        bounds.max.z - bounds.min.z
    );
    root.geometry.translate(0, -bounds.min.y, 0);
    for (const child of root.children) child.position.y -= bounds.min.y;
    root.scale.setScalar(Math.min(1, s / span));
    return root;
}
export function createBackground(state, spec) {
    const t = BACKGROUNDS.find((b) => b.id === state.activeBackground);
    if (!t) return null;
    let tex = textures.get(t.id);
    if (!tex && typeof document !== 'undefined') {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 512;
        const ctx = c.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        t.colors.forEach((color, i) => gradient.addColorStop(i / 2, color));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 512);
        for (let layer = 0; layer < 3; layer++) {
            ctx.fillStyle = ['#174d5c', '#123b48', '#0a2c39'][layer];
            ctx.beginPath();
            ctx.moveTo(0, 512);
            for (let x = 0; x <= 1024; x += 8) {
                const y =
                    390 +
                    layer * 30 +
                    Math.sin(x * 0.017 + layer) * 35 +
                    Math.sin(x * 0.041) * 12;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(1024, 512);
            ctx.fill();
        }
        if (t.id === 'backgroundKelp')
            for (let i = 0; i < 28; i++) {
                ctx.strokeStyle = i % 2 ? '#527846' : '#2d6048';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(i * 39, 512);
                ctx.bezierCurveTo(
                    i * 39 - 35,
                    320,
                    i * 39 + 45,
                    260,
                    i * 39,
                    120 + (i % 5) * 25
                );
                ctx.stroke();
                for (let j = 0; j < 7; j++) {
                    ctx.beginPath();
                    ctx.ellipse(
                        i * 39 + Math.sin(j) * 13,
                        460 - j * 40,
                        18,
                        6,
                        j * 0.7,
                        0,
                        Math.PI * 2
                    );
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.fill();
                }
            }
        if (t.id === 'backgroundReef')
            for (let i = 0; i < 45; i++) {
                ctx.strokeStyle = ['#526d7b', '#6f6a82', '#307278'][i % 3];
                ctx.lineWidth = 6;
                const x = i * 24,
                    y = 470 - (i % 4) * 18;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y - 45);
                ctx.lineTo(x - 15, y - 65);
                ctx.moveTo(x, y - 30);
                ctx.lineTo(x + 19, y - 52);
                ctx.stroke();
            }
        tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        textures.set(t.id, tex);
    }
    const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.width, spec.height),
        new THREE.MeshBasicMaterial({
            map: tex || null,
            color: tex ? 0xffffff : 0x12455c,
            side: THREE.DoubleSide
        })
    );
    panel.position.set(0, 0, -spec.depth / 2 - 0.008);
    panel.userData = { isEnv: true, type: 'background', backgroundId: t.id };
    return panel;
}
