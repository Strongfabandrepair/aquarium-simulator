// =========================================
// EQUIPMENT MANAGER & MAINTENANCE LOGIC
// =========================================

export class EquipmentManager {
    static toggleEquipment(state, stateKey) {
        if (state.equipment[stateKey] !== undefined) {
            state.equipment[stateKey] = !state.equipment[stateKey];
            return state.equipment[stateKey];
        }
        return false;
    }

    static getEquipmentTip(equipId) {
        const tips = {
            tank: 'Position tank on a level stand. An unlevel tank creates high glass seam stress.',
            stand: 'A 55g tank full of water weighs 625+ lbs. Use an aquarium-rated heavy duty stand.',
            heater: 'Submerge near powerhead flow for uniform heating. Unplug during water changes.',
            thermometer:
                'Check daily to prevent thermal shock from faulty heaters.',
            powerhead:
                'Aim turbulent flow across rocks and corals, avoiding direct blast.',
            returnPump:
                'Size pump for 5-10x turnover accounting for head pressure height.',
            proteinSkimmer:
                'Allow 1-2 weeks break-in. Empty foam collection cup regularly.',
            lightBasic:
                'Run 8-10 hours on a timer. Consistent photoperiod reduces nuisance algae.',
            lightReef:
                'Start light intensity at 50% PAR and ramp up slowly to acclimate new corals.',
            testKit:
                'Keep reagents fresh and sealed. Test weekly once established.',
            refractometer: 'Calibrate monthly using 35 ppt calibration fluid.',
            autoTopOff:
                'Use dual sensors as failsafe to avoid freshwater overflow salinity crashes.',
            dosingPump:
                'Calibrate pump heads monthly and dose in small increments.',
            wavemaker:
                'Set alternating pulse modes to simulate real ocean reef surges.',
            quarantineTank:
                'Observe new fish in QT for 4-6 weeks before display tank addition.',
            uvSterilizer:
                'Replace UV lamp annually to ensure effective pathogen sterilization.',
            mediaReactor:
                'Tumble GFO media gently to prevent pulverization into the display.',
            sump: 'A refugium with chaetomorpha macroalgae naturally strips nitrates & phosphates.',
            rodiUnit: 'Replace DI resin when TDS meter reads above 0 PPM.',
            macroAlgae:
                'Harvest macroalgae regularly to permanently export absorbed nutrients.'
        };
        return tips[equipId] || '';
    }
}
