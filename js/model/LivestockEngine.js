// =========================================
// LIVESTOCK ENGINE: SPECIES BEHAVIOR & HEALTH
// =========================================

import {
    FISH_DATABASE,
    CORAL_DATABASE,
    CLEANUP_DATABASE
} from './StoreService.js';

export class LivestockEngine {
    static tick(state, hoursPassed = 1) {
        const w = state.water;

        // 1. Process Fish Health & Behaviors
        state.livestock.forEach((fish) => {
            if (!fish.alive) return;

            fish.stateTimer = (fish.stateTimer || 0) + hoursPassed;

            const species = String(fish.templateId || '').toLowerCase();

            const getFishTraits = (sp) => {
                if (sp === 'yellowtang' || sp === 'bluehippotang') {
                    return {
                        zone: {
                            x: [0.1, 0.9],
                            y: [0.4, 0.9],
                            z: [0.1, 0.9],
                            spread: 0.4
                        },
                        behavior: 'cruising'
                    };
                } else if (sp === 'clownfish') {
                    return {
                        zone: {
                            x: [0.4, 0.6],
                            y: [0.3, 0.5],
                            z: [0.4, 0.6],
                            spread: 0.1
                        },
                        behavior: 'hovering'
                    };
                } else if (sp === 'royalgramma') {
                    return {
                        zone: {
                            x: [0.2, 0.4],
                            y: [0.2, 0.5],
                            z: [0.2, 0.4],
                            spread: 0.15
                        },
                        behavior: 'hovering'
                    };
                } else if (sp === 'firefishgoby') {
                    return {
                        zone: {
                            x: [0.6, 0.8],
                            y: [0.15, 0.3],
                            z: [0.6, 0.8],
                            spread: 0.1
                        },
                        behavior: 'hovering'
                    };
                } else if (sp === 'banggaicardinal') {
                    return {
                        zone: {
                            x: [0.3, 0.7],
                            y: [0.4, 0.6],
                            z: [0.3, 0.7],
                            spread: 0.15
                        },
                        behavior: 'hovering'
                    };
                } else if (sp === 'tailspotblenny' || sp === 'mandaringoby') {
                    return {
                        zone: {
                            x: [0.1, 0.9],
                            y: [0.05, 0.15],
                            z: [0.1, 0.9],
                            spread: 0.15
                        },
                        behavior: 'perching'
                    };
                } else if (sp === 'sixlinewrasse') {
                    return {
                        zone: {
                            x: [0.1, 0.9],
                            y: [0.2, 0.6],
                            z: [0.1, 0.9],
                            spread: 0.35
                        },
                        behavior: 'darting'
                    };
                }
                return {
                    zone: {
                        x: [0.2, 0.8],
                        y: [0.2, 0.8],
                        z: [0.2, 0.8],
                        spread: 0.2
                    },
                    behavior: 'swimming'
                };
            };

            const traits = getFishTraits(species);
            const zone = traits.zone;
            const behavior = traits.behavior;

            if (
                fish.homeX == null ||
                fish.homeY == null ||
                fish.homeZ == null
            ) {
                const laneSeed = (((fish.id || 1) * 37) % 100) / 100;
                fish.homeX = zone.x[0] + laneSeed * (zone.x[1] - zone.x[0]);
                fish.homeY =
                    zone.y[0] + ((laneSeed * 7) % 1) * (zone.y[1] - zone.y[0]);
                fish.homeZ =
                    zone.z[0] + ((laneSeed * 13) % 1) * (zone.z[1] - zone.z[0]);
                fish.roamSeed = laneSeed * Math.PI * 2;
                fish.roamSpread = zone.spread;
            }

            fish.behaviorState = behavior;

            const baseX = fish.homeX ?? fish.x ?? 0.5;
            const baseY = fish.homeY ?? fish.y ?? 0.5;
            const baseZ = fish.homeZ ?? fish.z ?? 0.5;
            const roamSeed = fish.roamSeed ?? (fish.id || 1) * 0.37;
            const spread =
                fish.roamSpread ??
                (behavior === 'cruising'
                    ? 0.28
                    : behavior === 'darting'
                      ? 0.24
                      : behavior === 'perching'
                        ? 0.12
                        : 0.16);

            if (behavior === 'cruising') {
                fish.targetX =
                    baseX + Math.sin(fish.stateTimer * 0.7 + roamSeed) * spread;
                fish.targetY =
                    baseY +
                    Math.sin(fish.stateTimer * 0.45 + roamSeed * 0.5) *
                        (spread * 0.55);
                fish.targetZ =
                    baseZ +
                    Math.cos(fish.stateTimer * 0.55 + roamSeed * 0.8) *
                        (spread * 0.75);
            } else if (behavior === 'hovering') {
                fish.targetX =
                    baseX +
                    Math.sin(fish.stateTimer * 1.2 + roamSeed) *
                        (spread * 0.85);
                fish.targetY =
                    baseY +
                    Math.cos(fish.stateTimer * 1.4 + roamSeed * 0.9) *
                        (spread * 0.55);
                fish.targetZ =
                    baseZ +
                    Math.cos(fish.stateTimer * 1.0 + roamSeed * 0.7) *
                        (spread * 0.8);
            } else if (behavior === 'perching') {
                fish.targetX =
                    baseX +
                    Math.sin(fish.stateTimer * 0.7 + roamSeed) * (spread * 0.9);
                fish.targetY =
                    baseY +
                    Math.abs(Math.sin(fish.stateTimer * 1.3 + roamSeed * 0.8)) *
                        (spread * 0.55);
                fish.targetZ =
                    baseZ +
                    Math.cos(fish.stateTimer * 0.6 + roamSeed * 0.6) *
                        (spread * 0.65);
            } else if (behavior === 'darting') {
                fish.targetX =
                    baseX +
                    Math.sin(fish.stateTimer * 1.6 + roamSeed) * (spread * 1.3);
                fish.targetY =
                    baseY +
                    Math.cos(fish.stateTimer * 1.3 + roamSeed * 0.75) *
                        (spread * 0.9);
                fish.targetZ =
                    baseZ +
                    Math.sin(fish.stateTimer * 1.1 + roamSeed * 1.2) *
                        (spread * 1.0);
            } else {
                fish.targetX =
                    baseX + Math.sin(fish.stateTimer * 0.8 + roamSeed) * spread;
                fish.targetY =
                    baseY +
                    Math.cos(fish.stateTimer * 0.7 + roamSeed * 0.85) *
                        (spread * 0.75);
                fish.targetZ =
                    baseZ +
                    Math.sin(fish.stateTimer * 0.6 + roamSeed * 1.1) *
                        (spread * 0.85);
            }

            fish.targetX = Math.max(0.08, Math.min(0.92, fish.targetX));
            fish.targetY = Math.max(0.12, Math.min(0.88, fish.targetY));
            fish.targetZ = Math.max(0.08, Math.min(0.92, fish.targetZ));

            const moveSpeed =
                behavior === 'darting'
                    ? 0.14
                    : behavior === 'cruising'
                      ? 0.04
                      : behavior === 'perching'
                        ? 0.03
                        : 0.06;
            fish.x += ((fish.targetX ?? fish.x) - fish.x) * moveSpeed;
            fish.y += ((fish.targetY ?? fish.y) - fish.y) * moveSpeed;
            fish.z += ((fish.targetZ ?? fish.z) - fish.z) * moveSpeed;
            fish.vx = ((fish.targetX ?? fish.x) - fish.x) * moveSpeed;
            fish.vy = ((fish.targetY ?? fish.y) - fish.y) * moveSpeed;
            fish.vz = ((fish.targetZ ?? fish.z) - fish.z) * moveSpeed;

            let healthChange = -0.04 * hoursPassed;

            // Temperature stress
            if (w.temperature < 74 || w.temperature > 84)
                healthChange -= 1.0 * hoursPassed;
            else if (w.temperature < 76 || w.temperature > 82)
                healthChange -= 0.25 * hoursPassed;
            else healthChange += 0.03 * hoursPassed;

            // Salinity stress
            if (w.salinity < 30 || w.salinity > 38)
                healthChange -= 1.5 * hoursPassed;
            else if (w.salinity < 34 || w.salinity > 36)
                healthChange -= 0.25 * hoursPassed;
            else healthChange += 0.02 * hoursPassed;

            // Toxins (Ammonia / Nitrite)
            if (w.ammonia > 0.25) healthChange -= 3.0 * hoursPassed;
            if (w.nitrite > 0.25) healthChange -= 2.0 * hoursPassed;
            if (w.nitrate > 40) healthChange -= 0.5 * hoursPassed;

            // Dissolved Oxygen
            if (w.dissolvedOxygen < 5.5) healthChange -= 0.8 * hoursPassed;

            // Starvation tracking
            const daysUnfed = state.day - state.lastFed;
            if (daysUnfed > 3)
                healthChange -= (daysUnfed - 2) * 1.5 * hoursPassed;
            else if (state.lastFed === state.day)
                healthChange += 0.18 * hoursPassed;

            if (state.feedingsToday > 0 && state.lastFed === state.day)
                healthChange += 0.05 * hoursPassed;
            if (species === 'tailspotblenny' && state.algaeLevel > 20)
                healthChange += 0.08 * hoursPassed;
            if (species === 'yellowtang' && state.algaeLevel > 25)
                healthChange += 0.1 * hoursPassed;
            if (species === 'clownfish' && state.feedingsToday > 0)
                healthChange += 0.04 * hoursPassed;
            if (species === 'banggaicardinal' && state.feedingsToday > 0)
                healthChange += 0.04 * hoursPassed;
            if (fish.health < 90 && healthChange > 0)
                healthChange += 0.03 * hoursPassed;

            fish.health = Math.max(
                0,
                Math.min(100, fish.health + healthChange)
            );

            if (fish.health <= 0) {
                fish.alive = false;
                state.journal.push({
                    time: `Day ${state.day} ${state.hour}:00`,
                    text: `☠️ ${fish.name} passed away due to poor environmental conditions.`,
                    tip: 'Maintain zero ammonia/nitrite, stable 78°F temp, and 35 ppt salinity.'
                });
            }
        });

        // 2. Process Coral Health & Calcification
        state.corals.forEach((coral) => {
            const tmpl = CORAL_DATABASE.find((c) => c.id === coral.templateId);
            let healthChange = 0;

            // Environmental stress for all corals
            if (w.temperature < 75 || w.temperature > 83)
                healthChange -= 0.5 * hoursPassed;
            if (w.salinity < 32 || w.salinity > 37)
                healthChange -= 0.5 * hoursPassed;
            if (w.ammonia > 0.1) healthChange -= 1.5 * hoursPassed;
            if (w.nitrite > 0.1) healthChange -= 1.0 * hoursPassed;
            if (w.nitrate > 40) healthChange -= 0.5 * hoursPassed;

            if (tmpl && tmpl.type === 'sps') {
                if (w.alkalinity < 7 || w.alkalinity > 11)
                    healthChange -= 1.5 * hoursPassed;
                if (w.nitrate > 15 || w.phosphate > 0.05)
                    healthChange -= 1.0 * hoursPassed;
                if (!state.equipment.lightReef || !state.equipment.lightOn)
                    healthChange -= 2.0 * hoursPassed;
            } else {
                if (
                    !state.equipment.lightOn &&
                    !state.equipment.lightBasic &&
                    !state.equipment.lightReef
                )
                    healthChange -= 0.5 * hoursPassed;
                if (
                    tmpl &&
                    tmpl.type === 'lps' &&
                    (w.alkalinity < 7 || w.alkalinity > 12)
                )
                    healthChange -= 0.5 * hoursPassed;
            }

            // Recovery if conditions are good
            if (healthChange === 0 && coral.health < 100) {
                healthChange += 0.5 * hoursPassed;
            }

            coral.health = Math.max(
                0,
                Math.min(100, coral.health + healthChange)
            );
        });
    }

    static addFish(state, templateId) {
        const tmpl = FISH_DATABASE.find((f) => f.id === templateId);
        if (!tmpl) return null;

        const species = String(tmpl.id || '').toLowerCase();

        const getFishTraits = (sp) => {
            if (sp === 'yellowtang' || sp === 'bluehippotang') {
                return {
                    zone: {
                        x: [0.1, 0.9],
                        y: [0.4, 0.9],
                        z: [0.1, 0.9],
                        spread: 0.4
                    },
                    behavior: 'cruising'
                };
            } else if (sp === 'clownfish') {
                return {
                    zone: {
                        x: [0.4, 0.6],
                        y: [0.3, 0.5],
                        z: [0.4, 0.6],
                        spread: 0.1
                    },
                    behavior: 'hovering'
                };
            } else if (sp === 'royalgramma') {
                return {
                    zone: {
                        x: [0.2, 0.4],
                        y: [0.2, 0.5],
                        z: [0.2, 0.4],
                        spread: 0.15
                    },
                    behavior: 'hovering'
                };
            } else if (sp === 'firefishgoby') {
                return {
                    zone: {
                        x: [0.6, 0.8],
                        y: [0.15, 0.3],
                        z: [0.6, 0.8],
                        spread: 0.1
                    },
                    behavior: 'hovering'
                };
            } else if (sp === 'banggaicardinal') {
                return {
                    zone: {
                        x: [0.3, 0.7],
                        y: [0.4, 0.6],
                        z: [0.3, 0.7],
                        spread: 0.15
                    },
                    behavior: 'hovering'
                };
            } else if (sp === 'tailspotblenny' || sp === 'mandaringoby') {
                return {
                    zone: {
                        x: [0.1, 0.9],
                        y: [0.05, 0.15],
                        z: [0.1, 0.9],
                        spread: 0.15
                    },
                    behavior: 'perching'
                };
            } else if (sp === 'sixlinewrasse') {
                return {
                    zone: {
                        x: [0.1, 0.9],
                        y: [0.2, 0.6],
                        z: [0.1, 0.9],
                        spread: 0.35
                    },
                    behavior: 'darting'
                };
            }
            return {
                zone: {
                    x: [0.2, 0.8],
                    y: [0.2, 0.8],
                    z: [0.2, 0.8],
                    spread: 0.2
                },
                behavior: 'swimming'
            };
        };

        const traits = getFishTraits(species);
        const zone = traits.zone;
        const laneSeed = (((state.nextLivestockId || 1) * 37) % 100) / 100;

        const newFish = {
            id: state.nextLivestockId++,
            templateId: tmpl.id,
            name: tmpl.name,
            icon: tmpl.icon,
            health: 94 + laneSeed * 4,
            addedDay: state.day,
            alive: true,
            size: tmpl.size,
            nitrateContrib: tmpl.nitrateContrib,
            o2Consume: tmpl.o2Consume,
            homeX: zone.x[0] + laneSeed * (zone.x[1] - zone.x[0]),
            homeY: zone.y[0] + ((laneSeed * 7) % 1) * (zone.y[1] - zone.y[0]),
            homeZ: zone.z[0] + ((laneSeed * 13) % 1) * (zone.z[1] - zone.z[0]),
            roamSeed: laneSeed * Math.PI * 2,
            roamSpread: zone.spread,
            x: 0.2 + Math.random() * 0.6,
            y: 0.2 + Math.random() * 0.6,
            z: 0.2 + Math.random() * 0.6,
            vx: (Math.random() - 0.5) * 0.01,
            vy: (Math.random() - 0.5) * 0.005,
            vz: (Math.random() - 0.5) * 0.01,
            targetX: Math.random(),
            targetY: Math.random(),
            targetZ: Math.random(),
            stateTimer: 0,
            behaviorState: traits.behavior // swimming, hovering, grazing, hiding, perching, pulsing
        };

        state.livestock.push(newFish);
        return newFish;
    }

    static addCoral(state, templateId) {
        const tmpl = CORAL_DATABASE.find((c) => c.id === templateId);
        if (!tmpl) return null;

        // Determine general spread positioning
        const rx = (Math.random() - 0.5) * 3.5;
        const rz = (Math.random() - 0.5) * 1.5;

        // Corals rest on rocks or sand bed (bottom is ~ -1.5 for med tank, sand is ~ -1.4)
        // Rocks go up to ~ -0.2.
        // We'll give it a rough height correlating to its position from center (rocks are usually center)
        const distFromCenter = Math.sqrt(rx * rx + rz * rz);
        const yBase = -1.2 + Math.max(0, 0.8 - distFromCenter * 0.4);
        const ry = yBase + Math.random() * 0.3;

        const newCoral = {
            id: state.nextCoralId++,
            templateId: tmpl.id,
            name: tmpl.name,
            icon: tmpl.icon,
            health: 100,
            addedDay: state.day,
            alkConsume: tmpl.alkConsume,
            calcConsume: tmpl.calcConsume,
            x: rx,
            y: ry,
            z: rz,
            scale: 0.8 + Math.random() * 0.4
        };

        state.corals.push(newCoral);
        return newCoral;
    }

    static addCleanup(state, crewId) {
        const tmpl = CLEANUP_DATABASE.find((c) => c.id === crewId);
        if (!tmpl) return null;

        const existing = state.cleanupCrew.find((c) => c.templateId === crewId);
        if (existing) {
            existing.count += tmpl.count;
            return existing;
        }

        const newCrew = {
            id: state.nextCleanupId++,
            templateId: tmpl.id,
            name: tmpl.name,
            icon: tmpl.icon,
            count: tmpl.count,
            algaeReduce: tmpl.algaeReduce,
            addedDay: state.day
        };

        state.cleanupCrew.push(newCrew);
        return newCrew;
    }
}
