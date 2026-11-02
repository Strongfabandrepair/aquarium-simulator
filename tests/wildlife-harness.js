import * as THREE from 'three';
import { LivestockRenderer } from '../js/graphics/LivestockRenderer.js';
import {
    FISH_DATABASE,
    CORAL_DATABASE,
    CLEANUP_DATABASE
} from '../js/model/StoreService.js';
import { TankBuilder } from '../js/graphics/TankBuilder.js';

export function showWildlife(category) {
    document.body.innerHTML = '';
    document.body.style.cssText =
        'margin:0;background:#071722;color:#e9f6ff;font-family:Arial';
    const heading = document.createElement('h1');
    heading.textContent = `ReefSim · ${category}`;
    heading.style.cssText = 'font-size:24px;margin:20px';
    document.body.append(heading);
    const grid = document.createElement('div');
    grid.style.cssText =
        'display:grid;grid-template-columns:repeat(5, 1fr);gap:12px;padding:12px';
    document.body.append(grid);
    const catalog =
        category === 'Fish'
            ? FISH_DATABASE
            : category === 'Corals'
              ? CORAL_DATABASE
              : CLEANUP_DATABASE;
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true
    });
    renderer.setSize(320, 270);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const results = [];
    for (let index = 0; index < catalog.length; index++) {
        const species = catalog[index];
        const record = {
            id: index + 1,
            templateId: species.id,
            health: 100,
            alive: true,
            size: 1,
            growth: 1,
            x: 0.5,
            y: 0.5,
            z: 0.5
        };
        const mesh =
            category === 'Corals'
                ? LivestockRenderer.createCoralMesh(record)
                : category === 'Cleanup'
                  ? LivestockRenderer.createCleanupMesh(record)
                  : LivestockRenderer.createFishMesh(record);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x102a3a);
        scene.add(new THREE.HemisphereLight(0xdceeff, 0x334d56, 0.7));
        const key = new THREE.DirectionalLight(0xfff4e7, 1.3);
        key.position.set(2, 3, 4);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x77bfff, 1.0);
        rim.position.set(-2, 1, -3);
        scene.add(rim);
        scene.add(mesh);
        mesh.position.set(0, 0, 0);
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const span = Math.max(size.x, size.y, size.z) * 0.72;
        const camera = new THREE.OrthographicCamera(
            (-span * 320) / 270,
            (span * 320) / 270,
            span,
            -span,
            0.01,
            100
        );
        camera.position.copy(center).add(new THREE.Vector3(0.5, 0.3, 4));
        camera.lookAt(center);
        renderer.render(scene, camera);
        const card = document.createElement('div');
        card.style.cssText =
            'background:#102a3a;border:1px solid #294252;border-radius:12px;overflow:hidden;text-align:center';
        const image = document.createElement('img');
        image.src = renderer.domElement.toDataURL();
        image.style.width = '100%';
        const title = document.createElement('div');
        title.textContent = species.name;
        title.style.cssText = 'padding:12px;font-size:14px';
        card.append(image, title);
        grid.append(card);
        let finite = true;
        let vertices = 0;
        mesh.traverse((object) => {
            if (object.geometry?.attributes.position) {
                const a = object.geometry.attributes.position;
                vertices += a.count;
                for (const value of a.array)
                    if (!Number.isFinite(value)) finite = false;
            }
        });
        results.push({
            species: species.id,
            finite,
            vertices,
            calls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles
        });
        TankBuilder.disposeGroup(mesh);
    }
    renderer.dispose();
    return results;
}
