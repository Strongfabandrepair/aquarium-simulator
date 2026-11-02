import { describe, it, expect, beforeEach } from 'vitest';
import { LivestockEngine } from '../js/model/LivestockEngine.js';

describe('LivestockEngine Simulation Model', () => {
    let mockState;

    beforeEach(() => {
        // Construct a clean, isolated mock state with ideal environmental conditions
        mockState = {
            day: 5,
            lastFed: 5,
            feedingsToday: 1,
            algaeLevel: 10,
            water: {
                temperature: 78.0, // Safe range: 76-82
                salinity: 35.0,    // Safe range: 34-36
                ammonia: 0.0,      // Safe: 0
                nitrite: 0.0,      // Safe: 0
                nitrate: 5.0,      // Safe: < 40
                dissolvedOxygen: 7.0 // Safe: >= 5.5
            },
            livestock: [],
            cleanupCrew: [],
            corals: []
        };
    });

    describe('1. 3D Coordinates & Swimming Behaviors', () => {
        it('should initialize swimming zones, target boundaries, and roam seeds for new fish', () => {
            mockState.livestock = [{
                id: 1,
                name: 'Clownfish',
                templateId: 'clownfish',
                alive: true,
                health: 100,
                x: 0.5,
                y: 0.5,
                z: 0.5,
                vx: 0,
                vy: 0,
                vz: 0
            }];

            LivestockEngine.tick(mockState, 1);

            const fish = mockState.livestock[0];
            // Should initialize home positions
            expect(fish.homeX).toBeDefined();
            expect(fish.homeY).toBeDefined();
            expect(fish.homeZ).toBeDefined();
            expect(fish.roamSeed).toBeDefined();
            expect(fish.behaviorState).toBe('hovering');

            // Position (x, y, z) and velocity should be updated by the move loop
            expect(fish.x).not.toBe(0.5);
            expect(fish.vx).not.toBe(0);
        });

        it('should assign different swimming behaviors to different species', () => {
            mockState.livestock = [
                { id: 1, templateId: 'clownfish', alive: true, health: 100, x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0 },
                { id: 2, templateId: 'yellowtang', alive: true, health: 100, x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0 },
                { id: 3, templateId: 'tailspotblenny', alive: true, health: 100, x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0 },
                { id: 4, templateId: 'sixlinewrasse', alive: true, health: 100, x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0 }
            ];

            LivestockEngine.tick(mockState, 1);

            expect(mockState.livestock[0].behaviorState).toBe('hovering');
            expect(mockState.livestock[1].behaviorState).toBe('cruising');
            expect(mockState.livestock[2].behaviorState).toBe('perching');
            expect(mockState.livestock[3].behaviorState).toBe('darting');
        });
    });

    describe('2. Environmental Stress & Health Decay', () => {
        it('should maintain stable or improving health when environmental conditions are optimal', () => {
            mockState.livestock = [{
                id: 1,
                templateId: 'clownfish',
                alive: true,
                health: 90.0,
                x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0
            }];

            LivestockEngine.tick(mockState, 1);

            // Health should increase slightly under perfect conditions (heals on feed)
            expect(mockState.livestock[0].health).toBeGreaterThan(90.0);
        });

        it('should decay fish health during temperature stress', () => {
            mockState.livestock = [{
                id: 1,
                templateId: 'clownfish',
                alive: true,
                health: 90.0,
                x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0
            }];

            // Cold water stress (< 74)
            mockState.water.temperature = 70.0;
            LivestockEngine.tick(mockState, 1);

            expect(mockState.livestock[0].health).toBeLessThan(90.0);
        });

        it('should decay fish health during salinity stress', () => {
            mockState.livestock = [{
                id: 1,
                templateId: 'clownfish',
                alive: true,
                health: 90.0,
                x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0
            }];

            // Hyposalinity stress (< 30)
            mockState.water.salinity = 28.0;
            LivestockEngine.tick(mockState, 1);

            expect(mockState.livestock[0].health).toBeLessThan(90.0);
        });

        it('should aggressively decay fish health in the presence of Ammonia or Nitrite toxins', () => {
            mockState.livestock = [{
                id: 1,
                templateId: 'clownfish',
                alive: true,
                health: 90.0,
                x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0
            }];

            // Severe Ammonia spike
            mockState.water.ammonia = 0.5;
            LivestockEngine.tick(mockState, 1);

            expect(mockState.livestock[0].health).toBeLessThan(88.0); // Rapid drop
        });

        it('should decay health when dissolved oxygen is depleted', () => {
            mockState.livestock = [{
                id: 1,
                templateId: 'clownfish',
                alive: true,
                health: 90.0,
                x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0
            }];

            mockState.water.dissolvedOxygen = 4.0; // Critical level (< 5.5)
            LivestockEngine.tick(mockState, 1);

            expect(mockState.livestock[0].health).toBeLessThan(90.0);
        });
    });

    describe('3. Starvation, Feeding, & Algae Grazing Dynamics', () => {
        it('should decay health if the fish is starved for more than 3 days', () => {
            mockState.livestock = [{
                id: 1,
                templateId: 'clownfish',
                alive: true,
                health: 90.0,
                x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0
            }];

            // Starved: Current day is 10, last fed is day 5 (5 days unfed > 3)
            mockState.day = 10;
            mockState.lastFed = 5;
            mockState.feedingsToday = 0;

            LivestockEngine.tick(mockState, 24); // 24 hours of starvation

            expect(mockState.livestock[0].health).toBeLessThan(90.0);
        });

        it('should boost Tailspot Blenny health when grazing algae is abundant', () => {
            mockState.livestock = [{
                id: 1,
                templateId: 'tailspotblenny',
                alive: true,
                health: 80.0,
                x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0
            }];

            // Set high algae level (> 20) for grazing
            mockState.algaeLevel = 30.0;
            LivestockEngine.tick(mockState, 1);

            // Blenny should heal and regain health rapidly from grazing
            expect(mockState.livestock[0].health).toBeGreaterThan(80.0);
        });

        it('should boost Yellow Tang health when grazing algae is abundant', () => {
            mockState.livestock = [{
                id: 1,
                templateId: 'yellowtang',
                alive: true,
                health: 80.0,
                x: 0.5, y: 0.5, z: 0.5, vx: 0, vy: 0, vz: 0
            }];

            // Set high algae level (> 25) for grazing
            mockState.algaeLevel = 30.0;
            LivestockEngine.tick(mockState, 1);

            // Tang should heal and regain health rapidly from grazing
            expect(mockState.livestock[0].health).toBeGreaterThan(80.0);
        });
    });
});
