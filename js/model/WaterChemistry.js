// =========================================
// REALISTIC WATER CHEMISTRY & BIOLOGICAL SIMULATION
// =========================================

export class WaterChemistry {
    static tick(state, hoursPassed = 1) {
        const w = state.water;
        const eq = state.equipment;

        // 1. Temperature Simulation
        let targetTemp = 72; // Ambient room temp
        if (eq.heater && eq.heaterOn) {
            targetTemp = 78;
        }
        // Thermal inertia calculation
        const tempDiff = targetTemp - w.temperature;
        w.temperature += tempDiff * 0.05 * hoursPassed;

        // 2. Evaporation & Salinity
        if (w.salinity > 0) {
            const evapRate =
                (0.05 + (w.temperature - 70) * 0.005) * hoursPassed;
            if (eq.autoTopOff) {
                // ATO replenishes evaporated water automatically
            } else {
                // Salinity increases as pure water evaporates
                w.salinity = Math.min(45, w.salinity + evapRate * 0.1);
            }
        }

        // 3. Nitrogen Cycle Simulation
        if (state.cycleDay > 0 && !state.cycleComplete) {
            state.cycleDay += hoursPassed / 24;

            if (state.ghostFedForCycle && state.cycleDay <= 10) {
                w.ammonia += 0.08 * hoursPassed;
            }

            // Phase 1: Ammonia decay into Nitrite
            if (w.ammonia > 0 && state.cycleDay >= 1) {
                const nh3Conversion = Math.min(w.ammonia, 0.12 * hoursPassed);
                w.ammonia = Math.max(0, w.ammonia - nh3Conversion);
                w.nitrite += nh3Conversion * 0.95;
            }

            // Phase 2: Nitrite decay into Nitrate
            if (w.nitrite > 0 && state.cycleDay >= 3) {
                const no2Conversion = Math.min(w.nitrite, 0.08 * hoursPassed);
                w.nitrite = Math.max(0, w.nitrite - no2Conversion);
                w.nitrate += no2Conversion * 0.9;
            }

            // Cycle Completion criteria
            if (
                state.cycleDay >= 12 &&
                w.ammonia < 0.1 &&
                w.nitrite < 0.15 &&
                w.nitrate > 1.5 &&
                state.ghostFedForCycle
            ) {
                state.cycleComplete = true;
                state.phase = Math.max(state.phase, 2);
                state.journal.push({
                    time: `Day ${Math.floor(state.day)}`,
                    text: `✅ Nitrogen Cycle Complete!`,
                    tip: `Your biological filter is established. You can now slowly add livestock.`
                });
            }
        }

        // 4. Bioload & Waste from Livestock
        let totalNitrateProduction = 0;
        let totalO2Consumption = 0;

        state.livestock.forEach((fish) => {
            if (fish.alive) {
                totalNitrateProduction +=
                    (fish.nitrateContrib || 0.4) * 0.02 * hoursPassed;
                totalO2Consumption += (fish.o2Consume || 0.1) * hoursPassed;
            }
        });

        w.nitrate += totalNitrateProduction;

        // Filtration effects
        if (eq.proteinSkimmer && eq.proteinSkimmerOn) {
            w.nitrate = Math.max(0, w.nitrate - 0.02 * hoursPassed);
        }
        if (eq.macroAlgae) {
            w.nitrate = Math.max(0, w.nitrate - 0.05 * hoursPassed);
            w.phosphate = Math.max(0, w.phosphate - 0.005 * hoursPassed);
        }
        if (eq.mediaReactor) {
            w.phosphate = Math.max(0, w.phosphate - 0.01 * hoursPassed);
        }

        // Algae growth dynamics
        const hasLight = (eq.lightBasic || eq.lightReef) && eq.lightOn;
        if (hasLight) {
            const algaeGrowth =
                0.1 * (1 + w.nitrate / 20 + w.phosphate * 10) * hoursPassed;
            state.algaeLevel = Math.min(100, state.algaeLevel + algaeGrowth);
        }

        // Cleanup crew algae consumption
        let algaeReduced = 0;
        state.cleanupCrew.forEach((crew) => {
            algaeReduced +=
                (crew.algaeReduce || 0.5) * crew.count * 0.1 * hoursPassed;
        });
        state.algaeLevel = Math.max(0, state.algaeLevel - algaeReduced);

        // 5. Dissolved Oxygen Exchange
        let o2Generation = 0;
        if (eq.powerhead && eq.powerheadOn) o2Generation += 0.3;
        if (eq.proteinSkimmer && eq.proteinSkimmerOn) o2Generation += 0.4;
        if (eq.wavemaker && eq.wavemakerOn) o2Generation += 0.3;

        const maxO2 = Math.max(5, 8.5 - (w.temperature - 70) * 0.1); // Temp dependency
        w.dissolvedOxygen = Math.min(
            maxO2,
            Math.max(
                3,
                w.dissolvedOxygen +
                    (o2Generation - totalO2Consumption) * 0.1 * hoursPassed
            )
        );

        // 6. Calcification (Coral Growth Consumption)
        if (state.corals.length > 0) {
            let totalAlkConsume = 0;
            let totalCalcConsume = 0;
            state.corals.forEach((coral) => {
                if (coral.health > 20) {
                    totalAlkConsume +=
                        (coral.alkConsume || 0.1) * 0.02 * hoursPassed;
                    totalCalcConsume +=
                        (coral.calcConsume || 0.5) * 0.1 * hoursPassed;
                }
            });

            if (eq.dosingPump) {
                // Automated dosing balances consumption
            } else {
                w.alkalinity = Math.max(5, w.alkalinity - totalAlkConsume);
                w.calcium = Math.max(300, w.calcium - totalCalcConsume);
            }
        }

        // 7. Diurnal pH Swings
        const isDaytime = state.hour >= 8 && state.hour < 20;
        const targetPH = isDaytime ? 8.3 : 8.1;
        w.pH += (targetPH - w.pH) * 0.05 * hoursPassed;
    }
}
