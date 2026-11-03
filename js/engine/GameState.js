import { schedulePersistence } from '../persistence/ProfilePersistence.js';
// =========================================
// GAME STATE MANAGEMENT & DATA DEFINITIONS
// =========================================

export const PROFILES_STORAGE_KEY = 'reefSimProfiles';
export const ACTIVE_PROFILE_KEY = 'reefSimActiveProfile';
export const DEFAULT_THEME = 'ocean';
export const DEFAULT_AUTOSAVE_SECONDS = 30;
export const AUTOSAVE_OPTIONS = [15, 30, 60, 0];
export const THEME_OPTIONS = ['ocean', 'galaxy', 'sunset'];

export const TANK_CONFIGS = {
    nano: {
        gallons: 20,
        budget: 1500,
        label: '20 Gallon Nano',
        maxFish: 4,
        maxCoral: 8,
        width: 0.61,
        height: 0.42,
        depth: 0.305
    },
    medium: {
        gallons: 55,
        budget: 5000,
        label: '55 Gallon Reef',
        maxFish: 10,
        maxCoral: 20,
        width: 1.22,
        height: 0.53,
        depth: 0.33
    },
    large: {
        gallons: 120,
        budget: 8000,
        label: '120 Gallon Reef',
        maxFish: 20,
        maxCoral: 40,
        width: 1.22,
        height: 0.61,
        depth: 0.61
    }
};

export const WATER_IDEAL = {
    temperature: { min: 76, max: 82, ideal: 78, unit: '°F' },
    salinity: { min: 34, max: 36, ideal: 35, unit: 'ppt' },
    pH: { min: 8.1, max: 8.4, ideal: 8.2, unit: '' },
    ammonia: { min: 0, max: 0, ideal: 0, unit: 'ppm', dangerAbove: 0.25 },
    nitrite: { min: 0, max: 0, ideal: 0, unit: 'ppm', dangerAbove: 0.25 },
    nitrate: { min: 0, max: 20, ideal: 5, unit: 'ppm', dangerAbove: 40 },
    alkalinity: { min: 8, max: 12, ideal: 9, unit: 'dKH' },
    calcium: { min: 380, max: 450, ideal: 420, unit: 'ppm' },
    magnesium: { min: 1250, max: 1450, ideal: 1350, unit: 'ppm' },
    phosphate: {
        min: 0,
        max: 0.03,
        ideal: 0.01,
        unit: 'ppm',
        dangerAbove: 0.1
    },
    dissolvedOxygen: { min: 6, max: 8, ideal: 7, unit: 'mg/L' }
};

export const PARAM_LABELS = {
    temperature: '🌡 Temperature',
    salinity: '🧂 Salinity',
    pH: '📊 pH',
    ammonia: '⚠️ Ammonia (NH3)',
    nitrite: '⚠️ Nitrite (NO2)',
    nitrate: '📈 Nitrate (NO3)',
    alkalinity: '🧪 Alkalinity',
    calcium: '🦴 Calcium',
    magnesium: '✨ Magnesium',
    phosphate: '🟢 Phosphate',
    dissolvedOxygen: '💨 Dissolved O₂'
};

export const DEFAULT_GAME_STATE = {
    started: false,
    paused: false,
    speed: 1,
    tankSize: 'medium',
    tankGallons: 55,
    tankSpec: null,
    placedItems: [],
    foodType: 'mixed',
    feedingEvent: null,
    budget: 5000,
    totalSpent: 0,
    day: 1,
    hour: 8,
    minute: 0,
    tickInterval: null,
    autoSaveInterval: null,
    autosaveSeconds: 30,
    tickRate: 100, // ms per tick

    // Cycle & phases
    phase: 0, // 0=setup, 1=cycling, 2=firstLivestock, 3=growingReef, 4=advanced
    cycleDay: 0,
    cycleComplete: false,
    ghostFedForCycle: false,

    // Water parameters
    water: {
        temperature: 78, // °F
        salinity: 0, // ppt
        pH: 8.2, // pH
        ammonia: 0, // ppm
        nitrite: 0, // ppm
        nitrate: 0, // ppm
        alkalinity: 8, // dKH
        calcium: 420, // ppm
        magnesium: 1350, // ppm
        phosphate: 0, // ppm
        dissolvedOxygen: 7 // mg/L
    },

    // Equipment owned & status
    equipment: {
        tank: false,
        stand: false,
        liveRock: 0, // lbs
        substrate: 0, // lbs
        saltMix: 0, // gallons worth
        rodiUnit: false,
        heater: false,
        heaterOn: true,
        thermometer: false,
        powerhead: false,
        powerheadOn: true,
        returnPump: false,
        returnPumpOn: true,
        proteinSkimmer: false,
        proteinSkimmerOn: true,
        lightBasic: false,
        lightReef: false,
        lightOn: true,
        testKit: false,
        refractometer: false,
        autoTopOff: false,
        dosingPump: false,
        wavemaker: false,
        wavemakerOn: true,
        mediaReactor: false,
        quarantineTank: false,
        uvSterilizer: false,
        sump: false,
        macroAlgae: false
    },

    // Livestock arrays
    livestock: [],
    nextLivestockId: 1,
    corals: [],
    nextCoralId: 1,
    cleanupCrew: [],
    nextCleanupId: 1,

    // Maintenance tracking
    lastWaterChange: 0,
    lastGlassCleaned: 0,
    lastFilterCleaned: 0,
    lastFed: 0,
    feedingsToday: 0,
    algaeLevel: 0, // 0-100

    // Journal & knowledge
    journal: [],
    knowledge: {
        nitrogenCycle: 0,
        waterChemistry: 0,
        salinity: 0,
        temperature: 0,
        lighting: 0,
        filtration: 0,
        liveRock: 0,
        fishSelection: 0,
        coralCare: 0,
        feeding: 0,
        diseaseId: 0,
        quarantine: 0,
        waterChanges: 0,
        equipment: 0,
        compatibility: 0,
        acclimation: 0
    },

    activeAlerts: [],
    pendingEvents: [],
    profileName: 'Guest',
    theme: 'ocean',
    lastSaved: null
};

export class GameState {
    constructor() {
        this.data = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
    }

    get state() {
        return this.data;
    }

    reset(tankSize = 'medium', profileName = 'Guest') {
        const config = TANK_CONFIGS[tankSize] || TANK_CONFIGS.medium;
        this.data = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
        this.data.profileName = profileName;
        this.data.tankSize = tankSize;
        this.data.tankGallons = config.gallons;
        this.data.budget = config.budget;
        return this.data;
    }

    loadFromSnapshot(snapshot) {
        if (!snapshot) return;
        const base = JSON.parse(JSON.stringify(DEFAULT_GAME_STATE));
        this.data = Object.assign({}, base, snapshot);
        // Ensure sub-objects exist
        this.data.water = Object.assign(base.water, snapshot.water || {});
        this.data.equipment = Object.assign(
            base.equipment,
            snapshot.equipment || {}
        );
        // Malformed or old placement lists must not break the editor.
        this.data.placedItems = Array.isArray(snapshot.placedItems)
            ? snapshot.placedItems.filter(
                  (item) =>
                      item &&
                      ['rock', 'coral'].includes(item.kind) &&
                      item.position &&
                      ['x', 'y', 'z'].every((axis) =>
                          Number.isFinite(item.position[axis])
                      )
              )
            : [];
        this.data.knowledge = Object.assign(
            base.knowledge,
            snapshot.knowledge || {}
        );
    }

    static getSavedProfiles() {
        try {
            const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
            const profiles = raw ? JSON.parse(raw) : {};
            return profiles &&
                typeof profiles === 'object' &&
                !Array.isArray(profiles)
                ? profiles
                : {};
        } catch (err) {
            console.warn('Unable to read saved profiles:', err);
            return {};
        }
    }

    static saveProfiles(profiles) {
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
        schedulePersistence();
    }

    static getActiveProfileName() {
        return localStorage.getItem(ACTIVE_PROFILE_KEY) || 'Guest';
    }

    static setActiveProfileName(name) {
        localStorage.setItem(ACTIVE_PROFILE_KEY, name);
        schedulePersistence();
    }
}
