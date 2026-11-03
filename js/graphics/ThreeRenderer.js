// =========================================
// THREE.JS SCENE RENDERER & GRAPHICS CONTROLLER
// =========================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TankBuilder } from './TankBuilder.js';
import { LivestockRenderer } from './LivestockRenderer.js';
import { getHabitat } from './Habitat.js';
import { syncCoralPlacements } from './CoralPlacement.js';
import {
    getTankSpec,
    waterLevel,
    constrainPoint
} from '../model/TankGeometry.js';
import { horizontalGeometry } from './PhysicalEnvironment.js';
import { FeedingParticles } from './FeedingParticles.js';
import { PlacementController } from './PlacementController.js';
import TextureGenerator from './TextureGenerator.js';

const WATER_VERT = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
    vUv = uv;
    vec3 p = position;
    p.y += sin((p.x + uTime * 0.6) * 3.0) * 0.0015;
    p.y += cos((p.z + uTime * 0.4) * 4.0) * 0.001;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const WATER_FRAG = `
uniform vec3 uColor;
uniform vec3 uLightPos;
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 n = normalize(vec3(-0.06 * cos((vWorldPos.x + uTime * 0.6) * 3.0), 1.0, 0.06 * sin((vWorldPos.z + uTime * 0.4) * 4.0)));
    float fresnel = pow(1.0 - abs(dot(viewDir, n)), 3.0);
    vec3 lightDir = normalize(uLightPos - vWorldPos);
    float spec = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 24.0) * 0.35;
    gl_FragColor = vec4(uColor + spec, uOpacity + fresnel * 0.2);
}
`;

const SHAFT_FRAG = `
uniform vec3 uColor;
uniform float uTime;
varying vec2 vUv;
void main() {
    float radial = 1.0 - abs(vUv.x - 0.5) * 2.0;
    float fade = 1.0 - vUv.y;
    float shimmer = 0.85 + 0.15 * sin(uTime * 1.7 + vUv.y * 10.0);
    float a = radial * radial * fade * shimmer * 0.35;
    gl_FragColor = vec4(uColor, a);
}
`;

const SHAFT_VERT = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export class ThreeRenderer {
    static instance = null;
    constructor(containerId) {
        ThreeRenderer.instance = this;
        this.container = document.getElementById(containerId);
        this.initialized = false;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.pointLight = null;
        this.waterMesh = null;
        this.waterUniforms = null;
        this.lightShaft = null;
        this.shaftUniforms = null;
        this.bubbleParticles = null;
        this._bubbleSpeeds = null;
        this.fishMeshes = new Map();
        this.coralMeshes = new Map();
        this.cleanupMeshes = new Map();
        this._coralModelCache = new Map();
        this._coralManifest = null;
        this._resizeQueued = false;
    }

    init() {
        if (!this.container) return false;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a1a30, 0.025);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 1.5, 8.5);

        // 3. WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        const initialWidth = Math.max(1, this.container.clientWidth || 0);
        const initialHeight = Math.max(1, this.container.clientHeight || 0);
        this.renderer.setSize(initialWidth, initialHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // 4. OrbitControls
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 15;

        // 5. Lights
        const ambientLight = new THREE.AmbientLight(0xb6c9dc, 1.1);
        this.scene.add(ambientLight);

        this.pointLight = new THREE.SpotLight(
            0xffffff,
            12,
            5,
            Math.PI / 3,
            0.65,
            2
        );
        this.pointLight.castShadow = true;
        this.pointLight.shadow.mapSize.set(1024, 1024);
        this.pointLight.shadow.bias = -0.0001;
        this.pointLight.shadow.normalBias = 0.001;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
        this.pointLight.position.set(0, 4, 0);
        this.scene.add(this.pointLight);

        // 6. Water volume (custom shader, cheap surface wave + fresnel)
        const waterGeo = new THREE.PlaneGeometry(5.7, 2.7, 48, 24);
        waterGeo.rotateX(-Math.PI / 2);
        this.waterUniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0x0f4c81) },
            uLightPos: { value: this.pointLight.position },
            uOpacity: { value: 0.32 }
        };
        const waterMat = new THREE.ShaderMaterial({
            vertexShader: WATER_VERT,
            fragmentShader: WATER_FRAG,
            uniforms: this.waterUniforms,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
        this.waterMesh.position.y = 1.15;
        this.waterMesh.renderOrder = 2;
        this.scene.add(this.waterMesh);

        // 7. Volumetric light shaft under the fixture
        const shaftGeo = new THREE.CylinderGeometry(2.2, 1.0, 2.8, 24, 1, true);
        this.shaftUniforms = {
            uColor: { value: new THREE.Color(0x6bcfff) },
            uTime: { value: 0 }
        };
        const shaftMat = new THREE.ShaderMaterial({
            vertexShader: SHAFT_VERT,
            fragmentShader: SHAFT_FRAG,
            uniforms: this.shaftUniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        this.lightShaft = new THREE.Mesh(shaftGeo, shaftMat);
        this.lightShaft.position.set(0, 0.7, 0);
        this.lightShaft.visible = false;
        this.lightShaft.renderOrder = 3;
        this.scene.add(this.lightShaft);

        // 8. Bubbles Particle System (sprite texture, staggered speeds)
        const particleCount = 60;
        const bubbleGeo = new THREE.BufferGeometry();
        const bubblePos = new Float32Array(particleCount * 3);
        this._bubbleSpeeds = new Float32Array(particleCount);
        for (let i = 0; i < particleCount; i++) {
            bubblePos[i * 3] = (Math.random() - 0.5) * 4.4;
            bubblePos[i * 3 + 1] = -1.15 + Math.random() * 2.3;
            bubblePos[i * 3 + 2] = (Math.random() - 0.5) * 2.1;
            this._bubbleSpeeds[i] = 0.01 + Math.random() * 0.0015;
        }
        const bubbleAttr = new THREE.BufferAttribute(bubblePos, 3);
        bubbleAttr.setUsage(THREE.DynamicDrawUsage);
        bubbleGeo.setAttribute('position', bubbleAttr);
        const bubbleMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.07,
            map: TextureGenerator.bubbleSprite(),
            transparent: true,
            opacity: 0.7,
            alphaTest: 0.1,
            sizeAttenuation: true
        });
        this.bubbleParticles = new THREE.Points(bubbleGeo, bubbleMat);
        this.scene.add(this.bubbleParticles);

        // Window resize
        window.addEventListener('resize', () => this.onResize());
        this._resizeObserver = new window.ResizeObserver(() => this.onResize());
        this._resizeObserver.observe(this.container);

        window.requestAnimationFrame(() => this.onResize());

        this.initialized = true;
        return true;
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = Math.max(1, this.container.clientWidth || 0);
        const height = Math.max(1, this.container.clientHeight || 0);
        if (
            this.renderer.domElement.width ===
                Math.floor(width * this.renderer.getPixelRatio()) &&
            this.renderer.domElement.height ===
                Math.floor(height * this.renderer.getPixelRatio())
        ) {
            return;
        }
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    updatePhysicalTank(state) {
        const spec = getTankSpec(state);
        const signature = JSON.stringify(spec);
        if (this._tankSignature === signature) return;
        this.placement?.cancel();
        this._tankSignature = signature;
        this.tankSpec = spec;
        const span = Math.max(spec.width, spec.height, spec.depth);
        this.camera.near = 0.005;
        this.camera.far = span * 30;
        this.camera.position.set(span * 0.12, spec.height * 0.65, span * 1.9);
        this.camera.updateProjectionMatrix();
        this.controls.target.set(0, -spec.height * 0.06, 0);
        this.controls.minDistance = span * 0.45;
        this.controls.maxDistance = span * 5;
        this.pointLight.position.set(0, spec.height / 2 + span * 0.4, 0);
        this.pointLight.distance = span * 5;
        this.pointLight.shadow.camera.near = 0.01;
        this.pointLight.shadow.camera.far = span * 5;
        this.scene.fog.density = 0.06 / span;
        this.waterMesh.geometry.dispose();
        this.waterMesh.geometry = horizontalGeometry(spec);
        this.waterMesh.position.y = waterLevel(spec);
        this.lightShaft.scale.set(
            spec.width / 5.8,
            (spec.height - 0.025) / 2.8,
            spec.depth / 5.8
        );
        this.lightShaft.position.set(0, -0.0125, 0);
        this.bubbleParticles.material.size = 0.0025;
        const positions =
            this.bubbleParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const point = constrainPoint(
                spec,
                {
                    x: (Math.random() - 0.5) * spec.width,
                    y: (Math.random() - 0.5) * spec.height,
                    z: (Math.random() - 0.5) * spec.depth
                },
                0.015
            );
            positions.set([point.x, point.y, point.z], i);
        }
        this.bubbleParticles.geometry.attributes.position.needsUpdate = true;
    }

    render(state) {
        if (!this.initialized) return;

        if (this._state && this._state !== state) {
            this.placement?.cancel();
            for (const map of [
                this.fishMeshes,
                this.coralMeshes,
                this.cleanupMeshes
            ]) {
                for (const mesh of map.values()) {
                    this.scene.remove(mesh);
                    TankBuilder.disposeGroup(mesh);
                }
                map.clear();
            }
            this._wildlifeTime = 0;
            if (this.feedingParticles) this.feedingParticles.key = null;
        }
        this._state = state;
        this.updatePhysicalTank(state);
        const now = performance.now();
        const delta = Math.min(
            (now - (this._lastFrameTime ?? now - 1000 / 60)) / 1000,
            0.05
        );
        this._lastFrameTime = now;
        const wildlifeDelta = state.paused ? 0 : delta;
        this._wildlifeTime = (this._wildlifeTime || 0) + wildlifeDelta * 1000;
        const wildlifeTime = this._wildlifeTime;
        this.waterUniforms.uTime.value = now * 0.001;
        this.shaftUniforms.uTime.value = now * 0.001;

        if (this.controls) this.controls.update();

        // 1. Rebuild equipment & environment if updated
        TankBuilder.buildEnvironment(this.scene, state);
        const habitat = getHabitat(this.scene, state);
        if (!this.placement)
            this.placement = new PlacementController({
                scene: this.scene,
                camera: this.camera,
                canvas: this.renderer.domElement,
                getState: () => this._state,
                getMeshes: () => ({ coralMeshes: this.coralMeshes }),
                getHabitat: () => getHabitat(this.scene, this._state),
                onCommit: (item) => this.onPlacementCommit?.(item),
                onStatus: (status) => this.onPlacementStatus?.(status)
            });
        this._wildlifeContext = {
            habitat,
            state,
            fishMeshes: this.fishMeshes,
            coralMeshes: this.coralMeshes,
            cleanupMeshes: this.cleanupMeshes
        };
        const caustics = TextureGenerator.causticsTexture();
        caustics.offset.set(now * 0.000018, now * 0.000011);

        // 2. Light status + god-ray shaft
        const hasLight =
            state.equipment.lightOn &&
            (state.equipment.lightBasic || state.equipment.lightReef);
        if (hasLight) {
            this.pointLight.intensity =
                (state.equipment.lightReef ? 12 : 6) *
                Math.max(
                    0.3,
                    (this.tankSpec.width * this.tankSpec.depth) / 0.4
                );
            const colorHex = state.equipment.lightReef ? 0x6bcfff : 0xfff2cf;
            this.pointLight.color.setHex(colorHex);
            this.shaftUniforms.uColor.value.setHex(colorHex);
            this.lightShaft.visible = true;
        } else {
            this.pointLight.intensity = 0.2;
            this.lightShaft.visible = false;
        }

        // 3. Water visibility & Algae tint
        if (state.water.salinity < 5 && !state.equipment.tank) {
            this.waterMesh.visible = false;
            this.lightShaft.visible = false;
        } else {
            this.waterMesh.visible = true;
            if (state.algaeLevel > 20) {
                this.scene.fog.color.setHex(0x1a3a2a);
                this.waterUniforms.uColor.value.setHex(0x2a5c41);
            } else {
                this.scene.fog.color.setHex(0x0a1a30);
                this.waterUniforms.uColor.value.setHex(0x0f4c81);
            }
        }

        // 4. Synchronize Fish Meshes (O(1) Map lookups)
        const fishIds = new Set(state.livestock.map((fish) => fish.id));
        state.livestock.forEach((fish) => {
            let mesh = this.fishMeshes.get(fish.id);
            if (!mesh) {
                mesh = LivestockRenderer.createFishMesh(
                    fish,
                    this._wildlifeContext,
                    wildlifeTime
                );
                this.scene.add(mesh);
                this.fishMeshes.set(fish.id, mesh);
            }
            LivestockRenderer.updateFishAnimation(
                mesh,
                fish,
                wildlifeTime,
                wildlifeDelta,
                this._wildlifeContext
            );
        });

        // Remove deleted fish meshes
        for (let id of this.fishMeshes.keys()) {
            const fishExists = fishIds.has(id);
            if (!fishExists) {
                const mesh = this.fishMeshes.get(id);
                if (mesh) {
                    this.scene.remove(mesh);
                    TankBuilder.disposeGroup(mesh);
                    this.fishMeshes.delete(id);
                }
            }
        }

        // 5. Synchronize Coral Meshes (O(1) Map lookups)
        const coralIds = new Set(state.corals.map((coral) => coral.id));
        state.corals.forEach((coral) => {
            let mesh = this.coralMeshes.get(coral.id);
            if (!mesh) {
                mesh = LivestockRenderer.createCoralMesh(coral);
                this.scene.add(mesh);
                this.coralMeshes.set(coral.id, mesh);
            }
            LivestockRenderer.updateCoralAnimation(
                mesh,
                coral,
                wildlifeTime,
                wildlifeDelta
            );
        });

        // Remove deleted coral meshes
        for (let id of this.coralMeshes.keys()) {
            const coralExists = coralIds.has(id);
            if (!coralExists) {
                const mesh = this.coralMeshes.get(id);
                if (mesh) {
                    this.scene.remove(mesh);
                    TankBuilder.disposeGroup(mesh);
                    this.coralMeshes.delete(id);
                }
            }
        }

        syncCoralPlacements(state.corals, this.coralMeshes, habitat);

        // Cleanup purchases are cohorts; render each individual with a stable identity.
        const cleanupIds = new Set();
        for (const crew of state.cleanupCrew || []) {
            for (let index = 0; index < crew.count; index++) {
                const id = `${crew.id}:${index}`;
                cleanupIds.add(id);
                let mesh = this.cleanupMeshes.get(id);
                const animal = {
                    ...crew,
                    id,
                    cohortId: crew.id,
                    instanceIndex: index,
                    alive: crew.alive !== false && crew.health !== 0
                };
                if (!mesh) {
                    mesh = LivestockRenderer.createCleanupMesh(
                        animal,
                        this._wildlifeContext
                    );
                    this.cleanupMeshes.set(id, mesh);
                    this.scene.add(mesh);
                }
                LivestockRenderer.updateCleanupAnimation(
                    mesh,
                    animal,
                    wildlifeTime,
                    wildlifeDelta,
                    this._wildlifeContext
                );
            }
        }
        for (const [id, mesh] of this.cleanupMeshes) {
            if (!cleanupIds.has(id)) {
                this.scene.remove(mesh);
                TankBuilder.disposeGroup(mesh);
                this.cleanupMeshes.delete(id);
            }
        }

        // 6. Bubbles Animation (staggered speeds, single timestamp)
        const hasBubbles =
            state.equipment.tank &&
            ((state.equipment.powerhead && state.equipment.powerheadOn) ||
                (state.equipment.proteinSkimmer &&
                    state.equipment.proteinSkimmerOn));
        if (hasBubbles) {
            this.bubbleParticles.visible = true;
            const positions =
                this.bubbleParticles.geometry.attributes.position.array;
            const t = now * 0.005;
            for (let i = 0, p = 0; i < positions.length; i += 3, p++) {
                positions[i + 1] += this._bubbleSpeeds[p] * delta * 3;
                const point = constrainPoint(
                    this.tankSpec,
                    {
                        x: positions[i] + Math.sin(t + p) * 0.001 * delta,
                        y: positions[i + 1],
                        z: positions[i + 2]
                    },
                    0.005
                );
                positions[i] = point.x;
                positions[i + 2] = point.z;
                if (positions[i + 1] > waterLevel(this.tankSpec))
                    positions[i + 1] = -this.tankSpec.height / 2 + 0.02;
            }
            this.bubbleParticles.geometry.attributes.position.needsUpdate = true;
        } else {
            this.bubbleParticles.visible = false;
        }

        this.feedingParticles ||= new FeedingParticles(this.scene);
        this.feedingParticles.update(state, wildlifeDelta);
        this.renderer.render(this.scene, this.camera);
    }
}
