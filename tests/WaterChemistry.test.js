import { describe, it, expect, beforeEach } from 'vitest';
import { WaterChemistry } from '../js/model/WaterChemistry.js';

describe('WaterChemistry Simulation Model', () => {
    let mockState;

    beforeEach(() => {
        // Construct a clean, isolated mock of the simulation game state
        mockState = {
            day: 1,
            cycleDay: 0,
            cycleComplete: false,
            ghostFedForCycle: false,
            phase: 1,
            algaeLevel: 10,
            lastFed: 0,
            feedingsToday: 0,
            journal: [],
            water: {
                temperature: 75.0,
                salinity: 35.0,
                ammonia: 0.0,
                nitrite: 0.0,
                nitrate: 5.0,
                phosphate: 0.1,
                alkalinity: 8.5,
                calcium: 420,
                magnesium: 1300,
                dissolvedOxygen: 7.0
            },
            equipment: {
                heater: false,
                heaterOn: false,
                autoTopOff: false,
                proteinSkimmer: false,
                proteinSkimmerOn: false,
                macroAlgae: false,
                mediaReactor: false,
                powerhead: false,
                powerheadOn: false,
                wavemaker: false,
                wavemakerOn: false,
                lightBasic: false,
                lightReef: false,
                lightOn: false
            },
            livestock: [],
            cleanupCrew: [],
            corals: []
        };
    });

    describe('1. Temperature Simulation', () => {
        it('should slowly pull temperature toward room ambient (72) when heater is off', () => {
            mockState.water.temperature = 76.0;
            mockState.equipment.heater = false;

            // Run for 1 hour
            WaterChemistry.tick(mockState, 1);

            // Thermal inertia should drop temperature
            expect(mockState.water.temperature).toBeLessThan(76.0);
            expect(mockState.water.temperature).toBeGreaterThan(72.0);
        });

        it('should drive temperature toward 78 when heater is owned and turned on', () => {
            mockState.water.temperature = 74.0;
            mockState.equipment.heater = true;
            mockState.equipment.heaterOn = true;

            WaterChemistry.tick(mockState, 1);

            // Temperature should rise
            expect(mockState.water.temperature).toBeGreaterThan(74.0);
            expect(mockState.water.temperature).toBeLessThan(78.0);
        });
    });

    describe('2. Evaporation & Salinity Creep', () => {
        it('should increase salinity as pure water evaporates when ATO is off', () => {
            mockState.water.salinity = 35.0;
            mockState.equipment.autoTopOff = false;

            WaterChemistry.tick(mockState, 24); // Tick 24 hours

            // Salinity should rise due to evaporation
            expect(mockState.water.salinity).toBeGreaterThan(35.0);
        });

        it('should maintain stable salinity when Auto Top-Off is installed/active', () => {
            mockState.water.salinity = 35.0;
            mockState.equipment.autoTopOff = true;

            WaterChemistry.tick(mockState, 24);

            // Salinity should remain perfectly stable
            expect(mockState.water.salinity).toBe(35.0);
        });
    });

    describe('3. Nitrogen Cycle Progression', () => {
        it('should inject Ammonia when ghost-feeding during initial cycling phase (days 1-10)', () => {
            mockState.cycleDay = 0.1;
            mockState.ghostFedForCycle = true;
            mockState.water.ammonia = 0.0;

            WaterChemistry.tick(mockState, 6);

            // Ammonia should spike
            expect(mockState.water.ammonia).toBeGreaterThan(0.0);
        });

        it('should convert Ammonia to Nitrite after day 1', () => {
            mockState.cycleDay = 2;
            mockState.water.ammonia = 2.0;
            mockState.water.nitrite = 0.0;

            WaterChemistry.tick(mockState, 10);

            // Ammonia should decrease, Nitrite should increase
            expect(mockState.water.ammonia).toBeLessThan(2.0);
            expect(mockState.water.nitrite).toBeGreaterThan(0.0);
        });

        it('should convert Nitrite to Nitrate after day 3', () => {
            mockState.cycleDay = 4;
            mockState.water.nitrite = 2.0;
            mockState.water.nitrate = 5.0;

            WaterChemistry.tick(mockState, 10);

            // Nitrite should drop, Nitrate should rise
            expect(mockState.water.nitrite).toBeLessThan(2.0);
            expect(mockState.water.nitrate).toBeGreaterThan(5.0);
        });

        it('should complete cycling when criteria are met on or after day 12', () => {
            mockState.day = 12;
            mockState.cycleDay = 12.5;
            mockState.ghostFedForCycle = true;
            mockState.water.ammonia = 0.05;
            mockState.water.nitrite = 0.1;
            mockState.water.nitrate = 5.0;

            WaterChemistry.tick(mockState, 1);

            // Cycle flags should trigger completion
            expect(mockState.cycleComplete).toBe(true);
            expect(mockState.phase).toBeGreaterThanOrEqual(2);
            expect(mockState.journal.some(j => j.text.includes('Cycle Complete'))).toBe(true);
        });
    });

    describe('4. Bioload, Waste, & Filtration Dynamics', () => {
        it('should increase Nitrate contribution from alive fish over time', () => {
            mockState.water.nitrate = 5.0;
            mockState.livestock = [
                { alive: true, nitrateContrib: 0.5 },
                { alive: true, nitrateContrib: 0.3 },
                { alive: false, nitrateContrib: 0.8 } // Dead fish should not contribute metabolic bioload
            ];

            WaterChemistry.tick(mockState, 10);

            // Nitrate should rise
            expect(mockState.water.nitrate).toBeGreaterThan(5.0);
        });

        it('should deplete Nitrate if protein skimmer or macroalgae are active', () => {
            mockState.water.nitrate = 20.0;
            mockState.equipment.proteinSkimmer = true;
            mockState.equipment.proteinSkimmerOn = true;

            WaterChemistry.tick(mockState, 24);

            // Nitrate should be reduced by the skimmer
            expect(mockState.water.nitrate).toBeLessThan(20.0);
        });

        it('should deplete Phosphate if GFO media reactor is active', () => {
            mockState.water.phosphate = 0.5;
            mockState.equipment.mediaReactor = true;

            WaterChemistry.tick(mockState, 24);

            // Phosphate should be siphoned out
            expect(mockState.water.phosphate).toBeLessThan(0.5);
        });
    });

    describe('5. Algae and Cleanup Crew', () => {
        it('should increase algaeLevel when light is installed and on', () => {
            mockState.algaeLevel = 10.0;
            mockState.equipment.lightBasic = true;
            mockState.equipment.lightOn = true;

            WaterChemistry.tick(mockState, 24);

            // Algae should grow
            expect(mockState.algaeLevel).toBeGreaterThan(10.0);
        });

        it('should decrease algaeLevel when cleanup crew (snails/crabs) is present', () => {
            mockState.algaeLevel = 50.0;
            mockState.cleanupCrew = [
                { count: 10, algaeReduce: 0.5 }
            ];

            WaterChemistry.tick(mockState, 24);

            // Algae should decrease
            expect(mockState.algaeLevel).toBeLessThan(50.0);
        });
    });

    describe('6. Dissolved Oxygen Exchange', () => {
        it('should decrease dissolvedOxygen from livestock respiration', () => {
            mockState.water.dissolvedOxygen = 8.0;
            mockState.livestock = [
                { alive: true, o2Consume: 0.2 },
                { alive: true, o2Consume: 0.1 }
            ];

            WaterChemistry.tick(mockState, 12);

            // Respiration should deplete O2
            expect(mockState.water.dissolvedOxygen).toBeLessThan(8.0);
        });

        it('should increase dissolvedOxygen and maintain high levels when circulation pumps are active', () => {
            mockState.water.dissolvedOxygen = 4.0;
            mockState.equipment.powerhead = true;
            mockState.equipment.powerheadOn = true;

            WaterChemistry.tick(mockState, 12);

            // Oxygen should be replenished by aeration
            expect(mockState.water.dissolvedOxygen).toBeGreaterThan(4.0);
        });
    });
});
