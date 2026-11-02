// =========================================
// STORE CATALOG & PURCHASING SERVICES
// =========================================

import { TANK_CONFIGS } from '../engine/GameState.js';

export const EQUIPMENT_STORE = [
    {
        id: 'tank',
        name: 'Glass Aquarium',
        icon: '🐟',
        price: { nano: 80, medium: 200, large: 500 },
        desc: 'The foundation. High-clarity glass tank with polished edges.',
        realPrice: { nano: '$80-150', medium: '$200-400', large: '$500-1200' },
        required: true,
        category: 'essentials',
        unlockPhase: 0
    },
    {
        id: 'stand',
        name: 'Aquarium Stand',
        icon: '🪵',
        price: { nano: 60, medium: 150, large: 350 },
        desc: 'Solid wood cabinet stand designed to support heavy saltwater loads.',
        realPrice: { nano: '$60-150', medium: '$150-400', large: '$350-800' },
        required: true,
        category: 'essentials',
        unlockPhase: 0
    },
    {
        id: 'substrate',
        name: 'Live Sand (40 lbs)',
        icon: '⏳',
        price: 45,
        desc: 'Aragonite sand bed for pH buffering & biological colonization. 1-2" depth.',
        realPrice: '$25-50/40lb bag',
        category: 'essentials',
        unlockPhase: 0
    },
    {
        id: 'liveRock',
        name: 'Live Rock (per 10 lbs)',
        icon: '🪨',
        price: 60,
        desc: 'Porous reef rock colonized with beneficial nitrifying bacteria. 1-1.5 lbs/gal recommended.',
        realPrice: '$4-8/lb',
        category: 'essentials',
        unlockPhase: 0,
        stackable: true
    },
    {
        id: 'saltMix',
        name: 'Reef Salt Mix (160 gal)',
        icon: '🧂',
        price: 45,
        desc: 'Synthetic ocean salt mix. Combine with pure RO/DI water to reach 35 ppt salinity.',
        realPrice: '$40-65 per bucket',
        category: 'essentials',
        unlockPhase: 0,
        stackable: true
    },
    {
        id: 'rodiUnit',
        name: 'RO/DI Water Filter',
        icon: '💧',
        price: 150,
        desc: '4-stage Reverse Osmosis Deionization unit producing 0 PPM pure water.',
        realPrice: '$150-300',
        required: true,
        category: 'essentials',
        unlockPhase: 0
    },
    {
        id: 'heater',
        name: 'Titanium Heater',
        icon: '🔥',
        price: { nano: 30, medium: 50, large: 80 },
        desc: 'Fully submersible titanium heating element with digital temp sensor.',
        realPrice: '$25-80',
        required: true,
        category: 'essentials',
        unlockPhase: 0
    },
    {
        id: 'thermometer',
        name: 'Digital Thermometer',
        icon: '🌡',
        price: 15,
        desc: 'Precision digital thermometer probe with alert triggers.',
        realPrice: '$10-25',
        category: 'essentials',
        unlockPhase: 0
    },
    {
        id: 'powerhead',
        name: 'Circulation Powerhead',
        icon: '🌀',
        price: { nano: 35, medium: 55, large: 90 },
        desc: 'Submersible magnetic pump creating wide oceanic water currents.',
        realPrice: '$30-100',
        required: true,
        category: 'essentials',
        unlockPhase: 0
    },
    {
        id: 'returnPump',
        name: 'DC Return Pump',
        icon: '⬆️',
        price: 80,
        desc: 'Controllable return pump circulating water between sump and main tank.',
        realPrice: '$60-150',
        category: 'filtration',
        unlockPhase: 0
    },
    {
        id: 'proteinSkimmer',
        name: 'In-Sump Protein Skimmer',
        icon: '🫧',
        price: { nano: 80, medium: 150, large: 280 },
        desc: 'Removes dissolved organic compounds via micro-bubble foam fractionation.',
        realPrice: '$80-400',
        required: true,
        category: 'filtration',
        unlockPhase: 0
    },
    {
        id: 'lightBasic',
        name: 'Basic LED Light Bar',
        icon: '💡',
        price: { nano: 40, medium: 80, large: 150 },
        desc: 'Standard daylight LED fixture for fish-only setups.',
        realPrice: '$40-150',
        category: 'lighting',
        unlockPhase: 0
    },
    {
        id: 'lightReef',
        name: 'Full-Spectrum Reef LED',
        icon: '🔆',
        price: { nano: 150, medium: 300, large: 600 },
        desc: 'High-PAR LED fixture with ultraviolet & actinic spectrums for coral growth.',
        realPrice: '$150-800+',
        category: 'lighting',
        unlockPhase: 1
    },
    {
        id: 'testKit',
        name: 'Master Test Kit Box',
        icon: '🧪',
        price: 55,
        desc: 'Liquid reagent test kit measuring NH3, NO2, NO3, pH, Alkalinity, Calcium.',
        realPrice: '$30-60',
        required: true,
        category: 'testing',
        unlockPhase: 0
    },
    {
        id: 'refractometer',
        name: 'Optical Refractometer',
        icon: '🔬',
        price: 35,
        desc: 'Precision optical salinity tester with automatic temperature compensation.',
        realPrice: '$25-45',
        category: 'testing',
        unlockPhase: 0
    },
    {
        id: 'autoTopOff',
        name: 'Auto Top-Off (ATO) System',
        icon: '📏',
        price: 80,
        desc: 'Dual optical sensor system adding RO/DI fresh water as evaporation occurs.',
        realPrice: '$60-200',
        category: 'automation',
        unlockPhase: 1
    },
    {
        id: 'dosingPump',
        name: '4-Head Dosing Pump',
        icon: '💉',
        price: 120,
        desc: 'Programmable dosing pump for maintaining Alk, Ca, and Mg automatically.',
        realPrice: '$100-300',
        category: 'automation',
        unlockPhase: 2
    },
    {
        id: 'wavemaker',
        name: 'Smart Wavemaker',
        icon: '🌊',
        price: { nano: 60, medium: 100, large: 180 },
        desc: 'Pulsing directional wavemaker creating natural reef surge cycles.',
        realPrice: '$50-250',
        category: 'flow',
        unlockPhase: 1
    },
    {
        id: 'quarantineTank',
        name: '10g Quarantine Tank Setup',
        icon: '🏥',
        price: 80,
        desc: 'Isolated observation tank to isolate & treat new livestock before display.',
        realPrice: '$60-120',
        category: 'health',
        unlockPhase: 1
    },
    {
        id: 'uvSterilizer',
        name: 'Inline UV Sterilizer',
        icon: '☀️',
        price: 100,
        desc: 'High-intensity UV clarifier eliminating waterborne parasites & free algae.',
        realPrice: '$80-200',
        category: 'health',
        unlockPhase: 2
    },
    {
        id: 'mediaReactor',
        name: 'Fluidized Media Reactor',
        icon: '⚗️',
        price: 90,
        desc: 'Chamber running GFO or Activated Carbon for pristine water clarity.',
        realPrice: '$60-150',
        category: 'filtration',
        unlockPhase: 2
    },
    {
        id: 'sump',
        name: 'Acrylic Sump & Refugium',
        icon: '📦',
        price: { nano: 80, medium: 150, large: 250 },
        desc: 'Under-tank filtration reservoir housing equipment & macroalgae.',
        realPrice: '$80-300',
        category: 'filtration',
        unlockPhase: 0
    },
    {
        id: 'macroAlgae',
        name: 'Chaetomorpha Macroalgae',
        icon: '🌿',
        price: 20,
        desc: 'Nutrient-exporting plant cluster for refugium or display tank.',
        realPrice: '$15-30',
        category: 'filtration',
        unlockPhase: 0
    }
];

export const FISH_DATABASE = [
    {
        id: 'clownfish',
        name: 'Ocellaris Clownfish',
        icon: '🐟',
        price: 25,
        difficulty: 'easy',
        minTank: 20,
        desc: 'Hardy, iconic reef fish. Wiggles playfully, hosts in corals/anemones.',
        care: 'Temp: 76-82°F, pH 8.1-8.4. Feed 2x daily. Peaceful community inhabitant.',
        compat: ['tangs', 'gobies', 'blennies', 'cardinalfish', 'wrasses'],
        incompatible: ['other clownfish species', 'aggressive damsels'],
        maxPer: 2,
        size: 'small',
        realPrice: '$15-30',
        feedRate: 0.3,
        nitrateContrib: 0.5,
        o2Consume: 0.1
    },
    {
        id: 'royalGramma',
        name: 'Royal Gramma Basslet',
        icon: '🟣',
        price: 30,
        difficulty: 'easy',
        minTank: 30,
        desc: 'Stunning purple & yellow bicolor fish. Cave dweller that hovers upside-down near overhangs.',
        care: 'Needs rock caves for shelter. Very peaceful toward other species.',
        compat: ['clownfish', 'tangs', 'gobies', 'cardinalfish'],
        incompatible: ['other basslets', 'dottybacks'],
        maxPer: 1,
        size: 'small',
        realPrice: '$20-35',
        feedRate: 0.2,
        nitrateContrib: 0.4,
        o2Consume: 0.08
    },
    {
        id: 'firefishGoby',
        name: 'Firefish Goby',
        icon: '🔶',
        price: 20,
        difficulty: 'easy',
        minTank: 20,
        desc: 'Elegant gradient body with a long flicking dorsal fin. Hovers in water column & darts into burrows.',
        care: 'Requires covered tank — high jump risk. Very peaceful.',
        compat: ['clownfish', 'cardinalfish', 'blennies', 'tangs'],
        incompatible: ['aggressive fish', 'other firefish unless paired'],
        maxPer: 2,
        size: 'small',
        realPrice: '$15-25',
        feedRate: 0.15,
        nitrateContrib: 0.3,
        o2Consume: 0.06
    },
    {
        id: 'yellowTang',
        name: 'Yellow Tang',
        icon: '🟡',
        price: 80,
        difficulty: 'medium',
        minTank: 75,
        desc: 'Vibrant yellow disc-shaped grazer. Active open-water swimmer that constantly picks at rock algae.',
        care: 'Needs 75+ gal space & daily nori/seaweed feeding to prevent HLLE disease.',
        compat: ['clownfish', 'gobies', 'blennies', 'wrasses'],
        incompatible: ['other tangs in small tanks', 'aggressive triggers'],
        maxPer: 1,
        size: 'large',
        realPrice: '$60-150',
        feedRate: 0.5,
        nitrateContrib: 1.2,
        o2Consume: 0.2
    },
    {
        id: 'blueHippoTang',
        name: 'Blue Hippo Tang (Dory)',
        icon: '🔵',
        price: 100,
        difficulty: 'hard',
        minTank: 120,
        desc: 'Royal blue with black palette pattern & yellow tail. Rapid open swimmer that wedges into rock cracks.',
        care: 'Min 120 gallons. High ich vulnerability; quarantine mandatory.',
        compat: ['clownfish', 'gobies', 'wrasses'],
        incompatible: ['other hippo tangs', 'aggressive tankmates'],
        maxPer: 1,
        size: 'large',
        realPrice: '$80-200',
        feedRate: 0.6,
        nitrateContrib: 1.5,
        o2Consume: 0.25
    },
    {
        id: 'banggaiCardinal',
        name: 'Banggai Cardinalfish',
        icon: '⬜',
        price: 25,
        difficulty: 'easy',
        minTank: 20,
        desc: 'Striking silver body with black vertical bars & white spots. Dignified slow-hovering behavior.',
        care: 'Gentle feeder, peaceful tankmate. Mouthbrooder species.',
        compat: ['clownfish', 'gobies', 'blennies', 'wrasses'],
        incompatible: ['aggressive fast feeders'],
        maxPer: 3,
        size: 'small',
        realPrice: '$15-30',
        feedRate: 0.2,
        nitrateContrib: 0.3,
        o2Consume: 0.07
    },
    {
        id: 'tailspotBlenny',
        name: 'Tailspot Blenny',
        icon: '🟤',
        price: 20,
        difficulty: 'easy',
        minTank: 20,
        desc: 'Small perching fish with adorable eyes. Hops between rock ledges and watches around constantly.',
        care: 'Excellent microalgae consumer. Friendly personality.',
        compat: ['clownfish', 'cardinalfish', 'gobies', 'tangs'],
        incompatible: ['other blennies'],
        maxPer: 1,
        size: 'small',
        realPrice: '$15-25',
        feedRate: 0.15,
        nitrateContrib: 0.25,
        o2Consume: 0.05
    },
    {
        id: 'sixLineWrasse',
        name: 'Six Line Wrasse',
        icon: '🟠',
        price: 35,
        difficulty: 'medium',
        minTank: 30,
        desc: 'Hyperactive orange-and-blue striped wrasse. Rapidly weaves through rockwork hunting flatworms & pests.',
        care: 'Great biological pest controller. May bully docile fish in nano tanks.',
        compat: ['clownfish', 'tangs', 'larger fish'],
        incompatible: ['slow docile fish in small tanks', 'other wrasses'],
        maxPer: 1,
        size: 'small',
        realPrice: '$25-40',
        feedRate: 0.25,
        nitrateContrib: 0.4,
        o2Consume: 0.08
    },
    {
        id: 'mandarinGoby',
        name: 'Mandarin Dragonet',
        icon: '🌈',
        price: 45,
        difficulty: 'expert',
        minTank: 55,
        desc: 'Intricate psychedelic patterns & fan fins. Slow hover-crawling motion over rocks, picking micro-copepods.',
        care: 'EXPERT ONLY. Demands mature rockwork with abundant copepod population or will starve.',
        compat: ['everything peaceful'],
        incompatible: ['other mandarins', 'food competitors'],
        maxPer: 1,
        size: 'small',
        realPrice: '$30-50',
        feedRate: 0.1,
        nitrateContrib: 0.2,
        o2Consume: 0.04
    },
    {
        id: 'flameAngel',
        name: 'Flame Angelfish',
        icon: '🔴',
        price: 65,
        difficulty: 'medium',
        minTank: 55,
        desc: 'Vibrant fiery orange-red dwarf angel with black vertical stripes. Active swimmer around reef aquascapes.',
        care: 'Semi-reef safe (may occasionally nip LPS or clam mantles). Needs varied diet.',
        compat: ['clownfish', 'tangs', 'gobies'],
        incompatible: ['other dwarf angels'],
        maxPer: 1,
        size: 'medium',
        realPrice: '$50-80',
        feedRate: 0.35,
        nitrateContrib: 0.6,
        o2Consume: 0.12
    }
];

export const CORAL_DATABASE = [
    {
        id: 'zoanthids',
        name: 'Zoanthid Colony',
        icon: '🌺',
        price: 30,
        difficulty: 'easy',
        type: 'soft',
        desc: 'Colorful polyp mat that expands under light and closes in darkness.',
        care: 'Low-moderate light & flow. Fast growing.',
        lightNeed: 'low',
        flowNeed: 'low',
        realPrice: '$15-200+',
        alkConsume: 0.1,
        calcConsume: 0.5
    },
    {
        id: 'greenStarPolyps',
        name: 'Green Star Polyps (GSP)',
        icon: '🌿',
        price: 20,
        difficulty: 'easy',
        type: 'soft',
        desc: 'Neon-green grass-like mat coral with tentacles swaying gracefully in current.',
        care: 'Hardy mat coral. Place on isolated island rock to control spread.',
        lightNeed: 'low',
        flowNeed: 'moderate',
        realPrice: '$15-30',
        alkConsume: 0.05,
        calcConsume: 0.2
    },
    {
        id: 'mushrooms',
        name: 'Mushroom Corals',
        icon: '🍄',
        price: 25,
        difficulty: 'easy',
        type: 'soft',
        desc: 'Disk-shaped fleshy caps that expand/contract with light cycle.',
        care: 'Low light & gentle flow. Very forgiving for beginners.',
        lightNeed: 'low',
        flowNeed: 'low',
        realPrice: '$10-100+',
        alkConsume: 0.05,
        calcConsume: 0.2
    },
    {
        id: 'xeniaCorals',
        name: 'Pulsing Xenia',
        icon: '👋',
        price: 25,
        difficulty: 'easy',
        type: 'soft',
        desc: 'Rhythmically pulsing polyp fingers opening and closing like tiny hands!',
        care: 'Moderate light & current. Mesmerizing natural movement.',
        lightNeed: 'moderate',
        flowNeed: 'moderate',
        realPrice: '$15-25',
        alkConsume: 0.05,
        calcConsume: 0.1
    },
    {
        id: 'hammerCoral',
        name: 'Hammer Coral (Euphyllia)',
        icon: '🔨',
        price: 60,
        difficulty: 'medium',
        type: 'lps',
        desc: 'Flowing fleshy tentacles with hammer-shaped tips. Extends long sweeper tentacles.',
        care: 'Moderate flow & light. Keep 6" distance from neighbors.',
        lightNeed: 'moderate',
        flowNeed: 'moderate',
        realPrice: '$40-150+',
        alkConsume: 0.5,
        calcConsume: 2
    },
    {
        id: 'torchCoral',
        name: 'Torch Coral (Euphyllia)',
        icon: '🔥',
        price: 70,
        difficulty: 'medium',
        type: 'lps',
        desc: 'Long flowing tentacles with glowing tips swaying dramatically in surge flow.',
        care: 'Moderate light & flow. Aggressive sweepers at night.',
        lightNeed: 'moderate',
        flowNeed: 'moderate',
        realPrice: '$50-300+',
        alkConsume: 0.5,
        calcConsume: 2
    },
    {
        id: 'frogspawn',
        name: 'Frogspawn Coral',
        icon: '🐸',
        price: 55,
        difficulty: 'medium',
        type: 'lps',
        desc: 'Branching Euphyllia with vibrant multi-lobed bubble tips.',
        care: 'Moderate light and flow. Leave room for full extension and sweepers; do not assume neighboring Euphyllia are safe to touch.',
        lightNeed: 'moderate',
        flowNeed: 'moderate',
        realPrice: '$40-120',
        alkConsume: 0.5,
        calcConsume: 2
    },
    {
        id: 'acropora',
        name: 'Acropora (SPS)',
        icon: '🌲',
        price: 100,
        difficulty: 'expert',
        type: 'sps',
        desc: 'Demanding branching SPS coral with fine polyps & brilliant tip coloration.',
        care: 'HIGH light & flow. Demands pristine stable water chemistry.',
        lightNeed: 'high',
        flowNeed: 'high',
        realPrice: '$40-500+',
        alkConsume: 2,
        calcConsume: 8
    },
    {
        id: 'montipora',
        name: 'Montipora (SPS)',
        icon: '🍽',
        price: 60,
        difficulty: 'hard',
        type: 'sps',
        desc: 'Plating or encrusting SPS forming colorful tiered rock structures.',
        care: 'High light, moderate-high flow. Requires stable alkalinity.',
        lightNeed: 'high',
        flowNeed: 'moderate',
        realPrice: '$30-150',
        alkConsume: 1.5,
        calcConsume: 6
    },
    {
        id: 'birdsnest',
        name: 'Birdsnest Coral (Seriatopora)',
        icon: '🪺',
        price: 40,
        difficulty: 'hard',
        type: 'sps',
        desc: 'Thin needle-branching SPS coral growing in dense round clusters.',
        care: 'High light, moderate flow. Good entry-level SPS coral.',
        lightNeed: 'high',
        flowNeed: 'moderate',
        realPrice: '$25-60',
        alkConsume: 1,
        calcConsume: 4
    }
];

export const CLEANUP_DATABASE = [
    {
        id: 'hermitCrab',
        name: 'Blue Leg Hermit Crab',
        icon: '🦀',
        price: 3,
        count: 10,
        difficulty: 'easy',
        desc: 'Shell crab crawling on sand & rock, picking detritus & algae.',
        care: 'Provide spare shells and supplemental food when grazing is scarce. Hermits may attack snails for shells.',
        realPrice: '$1-3 each',
        algaeReduce: 0.5
    },
    {
        id: 'turboSnail',
        name: 'Turbo Snails',
        icon: '🐌',
        price: 4,
        count: 5,
        difficulty: 'easy',
        desc: 'Large snail gliding over glass and rock to graze algae.',
        care: 'Needs available algae. Secure coral frags: large snails can knock loose colonies over.',
        realPrice: '$3-5 each',
        algaeReduce: 1.0
    },
    {
        id: 'nassariusSnail',
        name: 'Nassarius Snails',
        icon: '🐚',
        price: 3,
        count: 5,
        difficulty: 'easy',
        desc: 'Sand-burrowing scavengers that emerge when food is added.',
        care: 'Provide a sand bed and suitable meaty food. Nassarius are scavengers, not algae grazers.',
        realPrice: '$2-4 each',
        algaeReduce: 0
    },
    {
        id: 'emeraldCrab',
        name: 'Emerald Crab',
        icon: '🦀',
        price: 8,
        count: 1,
        difficulty: 'easy',
        desc: 'Bright green crab foraging on rock for algae and leftover food.',
        care: 'Supplement food when algae is scarce and observe interactions with other animals.',
        realPrice: '$6-12',
        algaeReduce: 2.0
    },
    {
        id: 'cleanerShrimp',
        name: 'Skunk Cleaner Shrimp',
        icon: '🦐',
        price: 25,
        count: 1,
        difficulty: 'easy',
        desc: 'Red/white striped shrimp perching on rocks, waving long antennae at fish.',
        care: 'Provide sheltered rock and food; a cleaning station is not a substitute for quarantine or disease treatment.',
        realPrice: '$20-35',
        algaeReduce: 0
    },
    {
        id: 'peppermintShrimp',
        name: 'Peppermint Shrimp',
        icon: '🦐',
        price: 10,
        count: 1,
        difficulty: 'easy',
        desc: 'Translucent shrimp sheltering in crevices and foraging more actively in darkness.',
        care: 'Provide cover and suitable food. Aiptasia feeding varies by species and individual; it is not guaranteed.',
        realPrice: '$8-15',
        algaeReduce: 0
    }
];

export const KNOWLEDGE_BASE = {
    nitrogenCycle: {
        title: '🔄 The Nitrogen Cycle',
        content: `<h3>The Most Important Concept in Aquarium Keeping</h3>
        <p>Fish produce toxic Ammonia ($NH_3$). Benefical bacteria convert Ammonia $\\rightarrow$ Nitrite ($NO_2^-$) $\\rightarrow$ Nitrate ($NO_3^-$).</p>
        <p>Cycling takes 4-6 weeks before adding livestock.</p>`,
        quiz: {
            questions: [
                {
                    question:
                        'What is the first toxic compound produced by fish waste in the nitrogen cycle?',
                    options: ['Nitrate', 'Nitrite', 'Ammonia', 'Phosphate'],
                    correct: 2, // Index of correct answer
                    explanation:
                        'Fish waste produces ammonia (NH₃) first, which is highly toxic to aquatic life.'
                },
                {
                    question:
                        'Which bacteria convert ammonia to nitrite in the nitrogen cycle?',
                    options: [
                        'Nitrobacter',
                        'Pseudomonas',
                        'Nitrosomonas',
                        'Paracoccus'
                    ],
                    correct: 2,
                    explanation:
                        'Nitrosomonas bacteria are responsible for converting ammonia (NH₃) to nitrite (NO₂⁻).'
                },
                {
                    question:
                        'What is the final, relatively less toxic product of the nitrogen cycle?',
                    options: ['Ammonia', 'Nitrite', 'Nitrate', 'Nitrogen gas'],
                    correct: 2,
                    explanation:
                        'Nitrate (NO₃⁻) is the final product of the nitrogen cycle, which is relatively harmless at low levels.'
                }
            ]
        }
    },
    waterChemistry: {
        title: '⚗️ Water Chemistry',
        content: `<h3>Key Reef Parameters</h3>
        <p><strong>pH (8.1-8.4), Alkalinity (8-12 dKH), Calcium (380-450 ppm), Magnesium (1250-1450 ppm).</strong></p>
        <p>Stability is more critical than hitting single numeric targets.</p>`,
        quiz: {
            questions: [
                {
                    question:
                        'What is the ideal pH range for a saltwater aquarium?',
                    options: ['7.0-7.5', '7.5-8.0', '8.1-8.4', '8.5-9.0'],
                    correct: 2,
                    explanation:
                        'The ideal pH range for a saltwater aquarium is 8.1-8.4 to match natural seawater conditions.'
                },
                {
                    question:
                        'Which parameter acts as a pH buffer in reef aquariums?',
                    options: ['Calcium', 'Alkalinity', 'Magnesium', 'Nitrate'],
                    correct: 1,
                    explanation:
                        'Alkalinity (dKH) measures the buffering capacity of water and helps prevent pH swings.'
                },
                {
                    question:
                        'What is the ideal calcium level for a reef aquarium?',
                    options: [
                        '200-300 ppm',
                        '380-450 ppm',
                        '450-550 ppm',
                        '500-600 ppm'
                    ],
                    correct: 1,
                    explanation:
                        'The ideal calcium level for a reef aquarium is 380-450 ppm to support coral skeleton growth.'
                }
            ]
        }
    },
    salinity: {
        title: '🧂 Salinity Management',
        content: `<h3>Target: 35 ppt (1.025 SG)</h3>
        <p>When water evaporates, salt stays behind. Always top-off with pure RO/DI fresh water.</p>`,
        quiz: {
            questions: [
                {
                    question:
                        'What is the ideal salinity level for a saltwater aquarium in parts per thousand (ppt)?',
                    options: ['30 ppt', '35 ppt', '40 ppt', '45 ppt'],
                    correct: 1,
                    explanation:
                        'The ideal salinity for a saltwater aquarium is 35 ppt, which matches natural seawater.'
                },
                {
                    question:
                        'What happens to salinity when water evaporates from the aquarium?',
                    options: [
                        'It decreases',
                        'It stays the same',
                        'It increases',
                        'It fluctuates randomly'
                    ],
                    correct: 2,
                    explanation:
                        'When water evaporates, the salt is left behind, causing the salinity to increase.'
                },
                {
                    question:
                        'What type of water should be used to top off evaporation in a saltwater aquarium?',
                    options: [
                        'Tap water',
                        'Filtered water',
                        'RO/DI water',
                        'Distilled water'
                    ],
                    correct: 2,
                    explanation:
                        'RO/DI (Reverse Osmosis/Deionized) water should be used to top off evaporation to avoid adding minerals and contaminants.'
                }
            ]
        }
    },
    temperature: {
        title: '🌡 Temperature Control',
        content: `<h3>Target: 76-78°F</h3>
        <p>Temperature swings over 2°F per day stress fish and trigger Marine Ich outbreaks.</p>`,
        quiz: {
            questions: [
                {
                    question:
                        'What is the ideal temperature range for most saltwater aquariums?',
                    options: ['70-74°F', '76-78°F', '78-82°F', '82-86°F'],
                    correct: 1,
                    explanation:
                        'The ideal temperature range for most saltwater aquariums is 76-78°F to mimic natural reef environments.'
                },
                {
                    question:
                        'What can happen if the aquarium temperature fluctuates more than 2°F per day?',
                    options: [
                        'Nothing significant',
                        'Increased algae growth',
                        'Fish stress and disease susceptibility',
                        'Improved coral growth'
                    ],
                    correct: 2,
                    explanation:
                        'Temperature swings over 2°F per day stress fish and can trigger Marine Ich outbreaks.'
                },
                {
                    question:
                        'What equipment is primarily responsible for maintaining temperature in a saltwater aquarium?',
                    options: [
                        'Powerhead',
                        'Heater',
                        'Protein skimmer',
                        'Lighting'
                    ],
                    correct: 1,
                    explanation:
                        'The heater is primarily responsible for maintaining stable temperature in a saltwater aquarium.'
                }
            ]
        }
    },
    lighting: {
        title: '💡 Reef Lighting',
        content: `<h3>Photosynthesis & PAR</h3>
        <p>Corals contain zooxanthellae algae providing 90% of their energy under full-spectrum reef lights.</p>`,
        quiz: {
            questions: [
                {
                    question: 'What do zooxanthellae algae provide to corals?',
                    options: [
                        'Oxygen only',
                        '90% of their energy through photosynthesis',
                        'Physical protection',
                        'None of the above'
                    ],
                    correct: 1,
                    explanation:
                        "Zooxanthellae algae living within coral tissue provide up to 90% of the coral's energy needs through photosynthesis."
                },
                {
                    question: 'What does PAR stand for in reef lighting?',
                    options: [
                        'Photosynthetic Available Radiation',
                        'Photosynthetically Active Radiation',
                        'Photochemical Absorption Rate',
                        'None of the above'
                    ],
                    correct: 1,
                    explanation:
                        'PAR stands for Photosynthetically Active Radiation, which measures light usable by photosynthetic organisms.'
                },
                {
                    question:
                        'Which type of coral typically requires the highest light intensity?',
                    options: [
                        'Soft corals',
                        'LPS corals',
                        'SPS corals',
                        'All require the same'
                    ],
                    correct: 2,
                    explanation:
                        'SPS (Small Polyp Stony) corals typically require the highest light intensity and strongest water flow.'
                }
            ]
        }
    },
    filtration: {
        title: '🫧 Filtration Systems',
        content: `<h3>Biological, Mechanical & Chemical</h3>
        <p>Protein skimmers remove organic molecules before breakdown. Live rock provides surface area for bacteria.</p>`,
        quiz: {
            questions: [
                {
                    question:
                        'What is the primary function of a protein skimmer in a saltwater aquarium?',
                    options: [
                        'Add oxygen to the water',
                        'Remove organic waste before it breaks down',
                        'Increase water flow',
                        'Provide biological filtration'
                    ],
                    correct: 1,
                    explanation:
                        'Protein skimmers remove dissolved organic compounds from the water before they break down into harmful substances.'
                },
                {
                    question:
                        'What type of filtration does live rock primarily provide?',
                    options: [
                        'Mechanical only',
                        'Chemical only',
                        'Biological',
                        'All three types'
                    ],
                    correct: 2,
                    explanation:
                        'Live rock primarily provides biological filtration by hosting beneficial bacteria that process waste products.'
                },
                {
                    question: 'What does GFO stand for in aquarium filtration?',
                    options: [
                        'Granular Ferric Oxide',
                        'Glass Fiber Optical',
                        'Gravity Fed Overflow',
                        'None of the above'
                    ],
                    correct: 0,
                    explanation:
                        'GFO stands for Granular Ferric Oxide, which is used in media reactors to remove phosphates and silicates from aquarium water.'
                }
            ]
        }
    },
    liveRock: {
        title: '🪨 Live Rock Aquascaping',
        content: `<h3>Biological Heart of the Reef</h3>
        <p>1 to 1.5 lbs per gallon of porous rock provides bacterial surface area & hiding caves.</p>`,
        quiz: {
            questions: [
                {
                    question:
                        'How much live rock is generally recommended per gallon of aquarium volume?',
                    options: [
                        '0.5-1 lbs per gallon',
                        '1-1.5 lbs per gallon',
                        '2-3 lbs per gallon',
                        '3-4 lbs per gallon'
                    ],
                    correct: 1,
                    explanation:
                        'The general recommendation is 1 to 1.5 lbs of live rock per gallon of aquarium volume for adequate biological filtration.'
                },
                {
                    question:
                        'What are the main benefits of live rock in a saltwater aquarium?',
                    options: [
                        'Only provides hiding places',
                        'Only adds to aesthetics',
                        'Biological filtration and habitat structure',
                        'Only increases water flow'
                    ],
                    correct: 2,
                    explanation:
                        'Live rock provides both biological filtration (through beneficial bacteria) and structural habitat for aquarium inhabitants.'
                },
                {
                    question:
                        'What process does live rock primarily support in the aquarium?',
                    options: [
                        'Photosynthesis',
                        'Nitrification',
                        'Evaporation',
                        'Temperature regulation'
                    ],
                    correct: 1,
                    explanation:
                        'Live rock primarily supports the nitrification process by providing surface area for beneficial bacteria that convert ammonia to nitrite and then to nitrate.'
                }
            ]
        }
    },
    fishSelection: {
        title: '🐠 Livestock Selection',
        content: `<h3>Compatibility & Stocking</h3>
        <p>Match fish size, temperament, and minimum tank volume requirements.</p>`,
        quiz: {
            questions: [
                {
                    question:
                        'What is the most important factor to consider when selecting fish for your aquarium?',
                    options: [
                        'Color only',
                        'Size only',
                        'Compatibility with other tank inhabitants',
                        'Price only'
                    ],
                    correct: 2,
                    explanation:
                        'Compatibility with other tank inhabitants is the most important factor when selecting fish to prevent aggression and stress.'
                },
                {
                    question:
                        "What does the term 'reef safe' mean when referring to aquarium fish?",
                    options: [
                        'The fish is colorful',
                        "The fish won't harm corals or invertebrates",
                        'The fish is easy to care for',
                        'The fish is inexpensive'
                    ],
                    correct: 1,
                    explanation:
                        "'Reef safe' means the fish is unlikely to harm corals, clams, or other invertebrates in a reef aquarium."
                },
                {
                    question:
                        "Why is it important to match fish to your aquarium's size?",
                    options: [
                        'For aesthetic reasons only',
                        'To ensure adequate swimming space and prevent overcrowding',
                        'To match the tank color',
                        'None of the above'
                    ],
                    correct: 1,
                    explanation:
                        "Matching fish to your aquarium's size ensures they have adequate swimming space and prevents overcrowding, which can lead to poor water quality and stress."
                }
            ]
        }
    }
};

export class StoreService {
    static getItemPrice(item, tankSize) {
        if (typeof item.price === 'object') {
            return item.price[tankSize] || item.price.medium;
        }
        return item.price;
    }

    static canPurchaseEquipment(state, itemId) {
        const item = EQUIPMENT_STORE.find((i) => i.id === itemId);
        if (!item) return { canBuy: false, reason: 'Item not found' };

        const price = this.getItemPrice(item, state.tankSize);
        if (state.budget < price)
            return { canBuy: false, reason: 'Insufficient budget' };

        // Prevent purchasing duplicate non-stackable items
        if (
            !item.stackable &&
            itemId !== 'substrate' &&
            state.equipment[itemId]
        ) {
            return { canBuy: false, reason: 'Already owned' };
        }

        if (itemId === 'proteinSkimmer' && !state.equipment.tank)
            return { canBuy: false, reason: 'Need tank first' };
        if (itemId === 'lightReef' && !state.equipment.tank)
            return { canBuy: false, reason: 'Need tank first' };

        return { canBuy: true, price };
    }

    static canPurchaseFish(state, fishId) {
        const tmpl = FISH_DATABASE.find((f) => f.id === fishId);
        if (!tmpl) return { canBuy: false, reason: 'Fish not found' };

        if (!state.cycleComplete)
            return {
                canBuy: false,
                reason: 'Complete the nitrogen cycle first'
            };
        if (state.budget < tmpl.price)
            return { canBuy: false, reason: 'Insufficient budget' };
        if (state.tankGallons < tmpl.minTank)
            return {
                canBuy: false,
                reason: `Requires ${tmpl.minTank}+ gallon tank`
            };

        const currentCount = state.livestock.filter(
            (f) => f.templateId === fishId
        ).length;
        if (currentCount >= tmpl.maxPer)
            return {
                canBuy: false,
                reason: `Maximum of ${tmpl.maxPer} ${tmpl.name}(s) reached`
            };

        const config = TANK_CONFIGS[state.tankSize];
        if (state.livestock.length >= config.maxFish)
            return {
                canBuy: false,
                reason: 'Tank is at maximum fish capacity'
            };

        return { canBuy: true, template: tmpl };
    }

    static canPurchaseCoral(state, coralId) {
        const tmpl = CORAL_DATABASE.find((c) => c.id === coralId);
        if (!tmpl) return { canBuy: false, reason: 'Coral not found' };

        if (!state.cycleComplete)
            return {
                canBuy: false,
                reason: 'Complete the nitrogen cycle first'
            };
        if (state.budget < tmpl.price)
            return { canBuy: false, reason: 'Insufficient budget' };

        const hasLight =
            state.equipment.lightBasic || state.equipment.lightReef;
        if (!hasLight)
            return { canBuy: false, reason: 'Requires aquarium lighting' };

        if (tmpl.type === 'sps' && !state.equipment.lightReef)
            return {
                canBuy: false,
                reason: 'SPS corals require Reef LED lighting'
            };

        const config = TANK_CONFIGS[state.tankSize];
        if (state.corals.length >= config.maxCoral)
            return {
                canBuy: false,
                reason: 'Tank is at maximum coral capacity'
            };

        return { canBuy: true, template: tmpl };
    }

    static canPurchaseCleanup(state, crewId) {
        const tmpl = CLEANUP_DATABASE.find((c) => c.id === crewId);
        if (!tmpl) return { canBuy: false, reason: 'Cleanup crew not found' };

        if (!state.cycleComplete)
            return {
                canBuy: false,
                reason: 'Complete the nitrogen cycle first'
            };
        if (state.budget < tmpl.price)
            return { canBuy: false, reason: 'Insufficient budget' };

        return { canBuy: true, template: tmpl };
    }
}
