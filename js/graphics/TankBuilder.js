// =========================================
// PROCEDURAL 3D TANK & ALL EQUIPMENT BUILDER
// =========================================

import * as THREE from 'three';
import TextureGenerator from './TextureGenerator.js';

export class TankBuilder {
    static buildEnvironment(scene, state) {
        if (!scene || !state) return;

        const eq = state.equipment;
        const config = { width: 6.0, height: 3.0, depth: 3.0 }; // Default medium tank dimensions
        // Cheap signature string (no JSON.stringify per frame)
        const envSignature =
            (eq.tank ? 1 : 0) +
            '|' +
            (eq.stand ? 1 : 0) +
            '|' +
            (eq.substrate || 0) +
            '|' +
            (eq.liveRock || 0) +
            '|' +
            (eq.heater ? 1 : 0) +
            '|' +
            (eq.heaterOn ? 1 : 0) +
            '|' +
            (eq.powerhead ? 1 : 0) +
            '|' +
            (eq.wavemaker ? 1 : 0) +
            '|' +
            (eq.proteinSkimmer ? 1 : 0) +
            '|' +
            (eq.lightBasic ? 1 : 0) +
            '|' +
            (eq.lightReef ? 1 : 0) +
            '|' +
            (state.equipment.lightOn ? 1 : 0) +
            '|' +
            (eq.sump ? 1 : 0) +
            '|' +
            (eq.autoTopOff ? 1 : 0) +
            '|' +
            (eq.dosingPump ? 1 : 0) +
            '|' +
            (eq.quarantineTank ? 1 : 0) +
            '|' +
            (eq.macroAlgae ? 1 : 0) +
            '|' +
            (state.cycleComplete || state.cycleDay > 15 ? 1 : 0);

        scene.userData = scene.userData || {};
        if (
            scene.userData.tankEnvironmentSignature === envSignature &&
            scene.userData.tankEnvironmentGroup
        ) {
            return;
        }

        if (scene.userData.tankEnvironmentGroup) {
            scene.remove(scene.userData.tankEnvironmentGroup);
            TankBuilder.disposeGroup(scene.userData.tankEnvironmentGroup);
        }

        const envGroup = new THREE.Group();
        envGroup.userData = { isEnv: true, type: 'environment' };
        scene.userData.tankEnvironmentSignature = envSignature;
        scene.userData.tankEnvironmentGroup = envGroup;

        const seededRandom = (seed) => {
            const x = Math.sin(seed * 999.1) * 43758.5453;
            return x - Math.floor(x);
        };

        // 1. Tank Stand (Wooden Cabinet underneath tank)
        if (eq.stand || eq.tank) {
            const standGeo = new THREE.BoxGeometry(
                config.width + 0.4,
                2.5,
                config.depth + 0.4
            );
            const standMat = new THREE.MeshStandardMaterial({
                color: 0x1e1510,
                roughness: 0.8,
                metalness: 0.1
            });
            const standMesh = new THREE.Mesh(standGeo, standMat);
            standMesh.position.set(0, -2.75, 0);
            standMesh.userData = { isEnv: true, type: 'stand' };
            envGroup.add(standMesh);

            const doorGeo = new THREE.BoxGeometry(
                config.width * 0.45,
                2.2,
                0.05
            );
            const doorMat = new THREE.MeshStandardMaterial({
                color: 0x120c08,
                roughness: 0.9
            });
            const doorLeft = new THREE.Mesh(doorGeo, doorMat);
            doorLeft.position.set(
                -config.width * 0.23,
                -2.75,
                config.depth / 2 + 0.21
            );
            doorLeft.userData = { isEnv: true };
            envGroup.add(doorLeft);

            const doorRight = new THREE.Mesh(doorGeo, doorMat);
            doorRight.position.set(
                config.width * 0.23,
                -2.75,
                config.depth / 2 + 0.21
            );
            doorRight.userData = { isEnv: true };
            envGroup.add(doorRight);
        }

        // 2. Glass Tank Frame & Walls
        if (eq.tank) {
            const glassGeo = new THREE.BoxGeometry(
                config.width,
                config.height,
                config.depth
            );
            const glassMat = new THREE.MeshPhysicalMaterial({
                color: 0x8ba4b8,
                metalness: 0.1,
                roughness: 0.1,
                transmission: 0.9,
                transparent: true,
                opacity: 0.12,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const glassMesh = new THREE.Mesh(glassGeo, glassMat);
            glassMesh.position.set(0, 0, 0);
            glassMesh.userData = { isEnv: true, type: 'glass' };
            envGroup.add(glassMesh);

            const bgGeo = new THREE.PlaneGeometry(
                config.width - 0.05,
                config.height - 0.05
            );
            const bgMat = new THREE.MeshBasicMaterial({
                color: 0x050e18,
                side: THREE.DoubleSide
            });
            const bgMesh = new THREE.Mesh(bgGeo, bgMat);
            bgMesh.position.set(0, 0, -config.depth / 2 + 0.02);
            bgMesh.userData = { isEnv: true, type: 'bg' };
            envGroup.add(bgMesh);
        }

        // 3. Substrate (Live Sand Bed) with caustics
        if (eq.substrate > 0 && eq.tank) {
            const sandHeight = Math.min(0.4, 0.1 + (eq.substrate / 40) * 0.15);
            const sandGeo = new THREE.BoxGeometry(
                config.width - 0.1,
                sandHeight,
                config.depth - 0.1
            );
            const isLit =
                (eq.lightBasic || eq.lightReef) && state.equipment.lightOn;
            const sandMat = new THREE.MeshStandardMaterial({
                color: 0xd6c29a,
                roughness: 0.95,
                metalness: 0.05,
                emissive: isLit ? 0x9fd4e8 : 0x000000,
                emissiveIntensity: isLit ? 0.25 : 0,
                emissiveMap: TextureGenerator.causticsTexture()
            });
            if (sandMat.emissiveMap) {
                sandMat.emissiveMap.wrapS = THREE.RepeatWrapping;
                sandMat.emissiveMap.wrapT = THREE.RepeatWrapping;
                sandMat.emissiveMap.repeat.set(3, 1.5);
            }
            const sandMesh = new THREE.Mesh(sandGeo, sandMat);
            sandMesh.userData = { isEnv: true, type: 'sand', isSand: true };
            sandMesh.position.set(
                0,
                -config.height / 2 + sandHeight / 2 + 0.02,
                0
            );
            envGroup.add(sandMesh);
        }

        // 4. Live Rock Aquascape
        if (eq.liveRock > 0 && eq.tank) {
            const rockCount = Math.min(
                18,
                Math.max(3, Math.floor(eq.liveRock / 7))
            );
            const rockGroup = new THREE.Group();
            rockGroup.userData = { isEnv: true, type: 'rocks' };

            for (let i = 0; i < rockCount; i++) {
                const radius = 0.5 + seededRandom(i * 11) * 0.4;
                const rockGeo = new THREE.DodecahedronGeometry(radius, 2);

                const isCoralline = state.cycleComplete || state.cycleDay > 15;
                const rockMat = new THREE.MeshStandardMaterial({
                    map: isCoralline
                        ? TextureGenerator.mottleTexture(
                              'rock-coralline',
                              0x6a3855,
                              [0x8a4a70, 0x4e2a42, 0xa05878],
                              { count: 22, alpha: 0.4, speckle: 200 }
                          )
                        : TextureGenerator.mottleTexture(
                              'rock-live',
                              0x73706c,
                              [0x8a857e, 0x5c5954, 0x948f88],
                              { count: 22, alpha: 0.4, speckle: 200 }
                          ),
                    roughness: 1.0,
                    metalness: 0.05
                });

                const rockMesh = new THREE.Mesh(rockGeo, rockMat);

                // Use non-uniform scale instead of vertex distortion to prevent fragmentation
                rockMesh.scale.set(
                    0.8 + seededRandom(i * 13) * 0.6,
                    0.6 + seededRandom(i * 17) * 0.6,
                    0.8 + seededRandom(i * 19) * 0.6
                );

                // Form a more natural ridge/cave structure
                // Base layer
                const isBase = i < rockCount * 0.5;
                const isMid = !isBase && i < rockCount * 0.85;

                const angle = (i / rockCount) * Math.PI * 2.5;
                const dist = isBase
                    ? 1.0 + seededRandom(i) * 0.4
                    : isMid
                      ? 0.6
                      : 0.2;

                const rx = Math.sin(angle) * dist * 1.5; // wider X
                const rz = Math.cos(angle) * dist * 0.6;
                // Place rocks lower so they sit securely on the sand
                let ry = -config.height / 2 + 0.2;
                if (isMid) ry += 0.4 + seededRandom(i) * 0.3;
                if (!isBase && !isMid) ry += 0.9 + seededRandom(i) * 0.3;

                // Add a slight overhang/cave arch look
                if (isMid) {
                    rockMesh.position.set(rx * 0.7, ry, rz - 0.4);
                } else if (!isBase && !isMid) {
                    rockMesh.position.set(rx * 0.4, ry, rz - 0.2);
                } else {
                    rockMesh.position.set(rx, ry, rz);
                }

                rockMesh.rotation.set(
                    seededRandom(i + 1) * Math.PI,
                    seededRandom(i + 2) * Math.PI,
                    0
                );
                rockGroup.add(rockMesh);
            }

            envGroup.add(rockGroup);
        }

        // 5. Titanium Heater
        if (eq.heater && eq.tank) {
            const heaterGroup = new THREE.Group();
            heaterGroup.userData = { isEnv: true, type: 'heater' };

            const rodGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 16);
            const rodMat = new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.9,
                roughness: 0.1
            });
            const rod = new THREE.Mesh(rodGeo, rodMat);

            const topGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.2, 16);
            const topMat = new THREE.MeshStandardMaterial({
                color: 0x0ea5e9,
                roughness: 0.6
            });
            const top = new THREE.Mesh(topGeo, topMat);
            top.position.y = 0.75;

            const suctionGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
            const suctionMat = new THREE.MeshStandardMaterial({
                color: 0x111111,
                transparent: true,
                opacity: 0.8
            });

            const suction1 = new THREE.Mesh(suctionGeo, suctionMat);
            suction1.rotation.x = Math.PI / 2;
            suction1.position.set(0, 0.4, -0.06);

            const suction2 = new THREE.Mesh(suctionGeo, suctionMat);
            suction2.rotation.x = Math.PI / 2;
            suction2.position.set(0, -0.4, -0.06);

            const ledGeo = new THREE.SphereGeometry(0.02, 8, 8);
            const ledMat = new THREE.MeshBasicMaterial({
                color: eq.heaterOn ? 0xff2200 : 0x222222
            });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(0, 0.75, 0.06);

            heaterGroup.add(rod, top, suction1, suction2, led);
            heaterGroup.position.set(
                -config.width / 2 + 0.3,
                -0.2,
                -config.depth / 2 + 0.1
            );
            envGroup.add(heaterGroup);
        }

        // 6. Circulation Powerhead / Wavemaker
        if ((eq.powerhead || eq.wavemaker) && eq.tank) {
            const powerGroup = new THREE.Group();
            powerGroup.userData = { isEnv: true, type: 'powerhead' };

            // VorTech / Nero style flat puck design
            const baseGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 32);
            baseGeo.rotateZ(Math.PI / 2);
            const baseMat = new THREE.MeshStandardMaterial({
                color: 0x111111,
                roughness: 0.4
            });
            const base = new THREE.Mesh(baseGeo, baseMat);

            const cageGeo = new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI);
            cageGeo.rotateZ(-Math.PI / 2);
            const cageMat = new THREE.MeshStandardMaterial({
                color: 0x222222,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            });
            const cage = new THREE.Mesh(cageGeo, cageMat);
            cage.position.set(0.05, 0, 0);

            const propGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 3); // 3 blade propeller
            propGeo.rotateZ(Math.PI / 2);
            const propMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9 });
            const prop = new THREE.Mesh(propGeo, propMat);
            prop.position.set(0.1, 0, 0);

            // Outer dry side magnet
            const magnetGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 32);
            magnetGeo.rotateZ(Math.PI / 2);
            const magnet = new THREE.Mesh(magnetGeo, baseMat);
            magnet.position.set(-0.2, 0, 0);

            powerGroup.add(base, cage, prop, magnet);
            powerGroup.position.set(
                -config.width / 2 + 0.15,
                config.height / 2 - 0.6,
                0
            );
            envGroup.add(powerGroup);
        }

        // 7. Protein Skimmer
        if (eq.proteinSkimmer && eq.tank) {
            const skimmerGroup = new THREE.Group();
            skimmerGroup.userData = { isEnv: true, type: 'skimmer' };

            const acrylicMat = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transmission: 0.9,
                transparent: true,
                opacity: 0.3,
                roughness: 0.1
            });
            const plasticMat = new THREE.MeshStandardMaterial({
                color: 0xe11d48,
                roughness: 0.4
            }); // Red accents
            const foamMat = new THREE.MeshStandardMaterial({
                color: 0xddcc88,
                opacity: 0.85,
                transparent: true
            });

            // Main chamber
            const cylGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 32);
            const cylinder = new THREE.Mesh(cylGeo, acrylicMat);

            // Neck transition
            const neckGeo = new THREE.ConeGeometry(0.25, 0.3, 32);
            const neck = new THREE.Mesh(neckGeo, acrylicMat);
            neck.position.y = 0.75;
            neck.rotation.x = Math.PI; // upside down cone

            // Collection cup
            const cupGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 32);
            const cup = new THREE.Mesh(cupGeo, acrylicMat);
            cup.position.y = 1.1;

            // Cup lid
            const lidGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.02, 32);
            const lid = new THREE.Mesh(lidGeo, plasticMat);
            lid.position.y = 1.31;

            // Skimmate foam
            const foamGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.15, 32);
            const foam = new THREE.Mesh(foamGeo, foamMat);
            foam.position.y = 1.0;

            // Silencer / Air intake
            const silGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 16);
            const silencer = new THREE.Mesh(silGeo, plasticMat);
            silencer.position.set(0.3, 1.2, 0);

            skimmerGroup.add(cylinder, neck, cup, lid, foam, silencer);
            skimmerGroup.position.set(
                config.width / 2 - 0.4,
                -0.4,
                -config.depth / 2 + 0.4
            );
            envGroup.add(skimmerGroup);
        }

        // 8. Basic / Reef LED Lighting Fixture
        if ((eq.lightBasic || eq.lightReef) && eq.tank) {
            const lightGroup = new THREE.Group();
            lightGroup.userData = { isEnv: true, type: 'lighting' };

            const isReef = eq.lightReef;
            const fixtureGeo = new THREE.BoxGeometry(
                config.width - 1.0,
                0.12,
                0.6
            );
            const fixtureMat = new THREE.MeshStandardMaterial({
                color: isReef ? 0x0f172a : 0x334155,
                metalness: 0.8,
                roughness: 0.2
            });
            const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
            fixture.position.set(0, config.height / 2 + 0.4, 0);

            const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.6);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
            const legLeft = new THREE.Mesh(legGeo, legMat);
            legLeft.position.set(
                -config.width / 2 + 0.4,
                config.height / 2 + 0.2,
                0
            );
            const legRight = new THREE.Mesh(legGeo, legMat);
            legRight.position.set(
                config.width / 2 - 0.4,
                config.height / 2 + 0.2,
                0
            );

            lightGroup.add(fixture, legLeft, legRight);
            envGroup.add(lightGroup);
        }

        // 9. Sump Tank (Visible inside wooden cabinet if stand owned)
        if (eq.sump && eq.stand) {
            const sumpGroup = new THREE.Group();
            sumpGroup.userData = { isEnv: true, type: 'sump' };

            const sumpGeo = new THREE.BoxGeometry(
                config.width * 0.7,
                1.2,
                config.depth * 0.7
            );
            const sumpMat = new THREE.MeshPhysicalMaterial({
                color: 0xaaccff,
                transmission: 0.85,
                transparent: true,
                opacity: 0.3
            });
            const sumpMesh = new THREE.Mesh(sumpGeo, sumpMat);

            sumpGroup.add(sumpMesh);
            sumpGroup.position.set(0, -3.1, 0);
            envGroup.add(sumpGroup);
        }

        // 10. Auto Top-Off & Dosing Pump
        if ((eq.autoTopOff || eq.dosingPump) && eq.tank) {
            const autoGroup = new THREE.Group();
            autoGroup.userData = { isEnv: true, type: 'automation' };

            const unitGeo = new THREE.BoxGeometry(0.4, 0.6, 0.2);
            const unitMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
            const unit = new THREE.Mesh(unitGeo, unitMat);
            unit.position.set(config.width / 2 + 0.3, -2.0, 0);

            autoGroup.add(unit);
            envGroup.add(autoGroup);
        }

        // 11. Quarantine Tank (Rendered beside main stand)
        if (eq.quarantineTank) {
            const qtGroup = new THREE.Group();
            qtGroup.userData = { isEnv: true, type: 'qt' };

            const qtGlassGeo = new THREE.BoxGeometry(1.8, 1.2, 1.2);
            const qtGlassMat = new THREE.MeshPhysicalMaterial({
                color: 0x94a3b8,
                transmission: 0.9,
                transparent: true,
                opacity: 0.3
            });
            const qtGlass = new THREE.Mesh(qtGlassGeo, qtGlassMat);

            qtGroup.add(qtGlass);
            qtGroup.position.set(config.width / 2 + 1.8, -2.0, 0);
            envGroup.add(qtGroup);
        }

        // 12. Macroalgae (Chaetomorpha plants)
        if (eq.macroAlgae && eq.tank) {
            const plantGroup = new THREE.Group();
            plantGroup.userData = { isEnv: true, type: 'macroAlgae' };

            for (let k = 0; k < 6; k++) {
                const strandGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
                const strandMat = new THREE.MeshStandardMaterial({
                    color: 0x22c55e,
                    roughness: 0.6
                });
                const strand = new THREE.Mesh(strandGeo, strandMat);
                const xSeed = seededRandom(k + 21);
                const ySeed = seededRandom(k + 31);
                const zSeed = seededRandom(k + 41);
                strand.position.set(
                    -config.width / 3 + (xSeed - 0.5) * 0.4,
                    -config.height / 2 + 0.4 + k * 0.1,
                    (zSeed - 0.5) * 0.4
                );
                strand.rotation.set(xSeed * 3, ySeed * 3, 0);
                plantGroup.add(strand);
            }
            envGroup.add(plantGroup);
        }

        scene.add(envGroup);
    }

    // Geometry/materials belong to a scene group; generated textures are shared cache entries.
    static disposeGroup(group) {
        const geometries = new Set();
        const materials = new Set();
        group.traverse((object) => {
            if (object.geometry) geometries.add(object.geometry);
            if (object.material) {
                for (const material of Array.isArray(object.material)
                    ? object.material
                    : [object.material])
                    materials.add(material);
            }
        });
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
    }
}
