// =========================================
// UI CONTROLLER & DOM RENDERER
// =========================================

import { SparklineManager } from './SparklineManager.js';
import {
    EQUIPMENT_STORE,
    FISH_DATABASE,
    CORAL_DATABASE,
    CLEANUP_DATABASE,
    KNOWLEDGE_BASE,
    StoreService
} from '../model/StoreService.js';
import { EquipmentManager } from '../model/EquipmentManager.js';

export class UIController {
    static _listenersInitialized = false;
    static _tickCounter = 0;
    static _lastStoreSig = '';
    static _lastLivestockSig = '';

    /**
     * Helper to update innerHTML of an element only if the content has changed.
     * Prevents browser DOM thrashing, reflows, and layout repaints.
     */
    static updateHTML(id, html) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.innerHTML === html) return;
        el.innerHTML = html;
    }

    /**
     * Initialize persistent event listeners on parent containers once using Event Delegation.
     */
    static initListeners(callbacks) {
        if (this._listenersInitialized) return;
        this._listenersInitialized = true;

        // 1. Equipment Panel Toggles
        const equipPanel = document.getElementById('equipmentPanel');
        if (equipPanel) {
            equipPanel.addEventListener('click', (e) => {
                const toggle = e.target.closest('[data-action="toggle-equip"]');
                if (toggle && callbacks.onToggleEquipment) {
                    callbacks.onToggleEquipment(toggle.dataset.key);
                }
            });
        }

        // 2. Maintenance Action Buttons
        const maintPanel = document.getElementById('maintenancePanel');
        if (maintPanel) {
            maintPanel.addEventListener('click', (e) => {
                const btn = e.target.closest('.maint-btn');
                if (!btn) return;
                const id = btn.id;
                if (id === 'btnWaterChange' && callbacks.onWaterChange)
                    callbacks.onWaterChange();
                if (id === 'btnCleanGlass' && callbacks.onCleanGlass)
                    callbacks.onCleanGlass();
                if (id === 'btnTopOff' && callbacks.onTopOff)
                    callbacks.onTopOff();
                if (id === 'btnFeedFish' && callbacks.onFeedFish)
                    callbacks.onFeedFish();
                if (id === 'btnGhostFeed' && callbacks.onGhostFeed)
                    callbacks.onGhostFeed();
            });
        }

        // 3. Store Purchases
        const storeTab = document.getElementById('tab-store');
        if (storeTab) {
            storeTab.addEventListener('click', (e) => {
                const item = e.target.closest('[data-action="buy-equip"]');
                if (item && callbacks.onBuyEquipment) {
                    callbacks.onBuyEquipment(item.dataset.id);
                }
            });
        }

        // 4. Livestock Purchases & Coral
        const livestockTab = document.getElementById('tab-livestock');
        if (livestockTab) {
            livestockTab.addEventListener('click', (e) => {
                const crewItem = e.target.closest(
                    '[data-action="buy-cleanup"]'
                );
                if (crewItem && callbacks.onBuyCleanup)
                    callbacks.onBuyCleanup(crewItem.dataset.id);
                const fishItem = e.target.closest('[data-action="buy-fish"]');
                if (fishItem && callbacks.onBuyFish) {
                    callbacks.onBuyFish(fishItem.dataset.id);
                }
                const coralItem = e.target.closest('[data-action="buy-coral"]');
                if (coralItem && callbacks.onBuyCoral) {
                    callbacks.onBuyCoral(coralItem.dataset.id);
                }
            });
        }

        // 5. Knowledge Base (enhanced)
        const kbTab = document.getElementById('tab-knowledge');
        if (kbTab) {
            kbTab.addEventListener('click', (e) => {
                // Quiz buttons are nested inside topic cards; handle them first.
                const quizItem = e.target.closest('[data-action="take-quiz"]');
                if (quizItem && callbacks.onTakeQuiz) {
                    callbacks.onTakeQuiz(quizItem.dataset.key);
                    return;
                }

                // Handle read knowledge
                const readItem = e.target.closest('[data-action="read-kb"]');
                if (readItem && callbacks.onReadKnowledge)
                    callbacks.onReadKnowledge(readItem.dataset.key);
            });
        }
    }

    static renderAll(state, engineCallbacks) {
        // Initialize event delegation listeners once
        this.initListeners(engineCallbacks);

        this.renderWaterParams(state);
        this.renderEquipment(state, engineCallbacks);
        this.renderMaintenance(state, engineCallbacks);
        this.renderRealCosts(state);
        this.renderStore(state, engineCallbacks);
        this.renderLivestock(state, engineCallbacks);
        this.renderJournal(state);
        this.renderKnowledge(state, engineCallbacks);
        this.renderHUD(state);
        this.renderPhase(state);
        this.updateTimeDisplay(state);
        this.updateBudgetDisplay(state);
        this.updateProfileDisplay(state);

        this._tickCounter = (this._tickCounter + 1) % 1000;
    }

    static renderWaterParams(state) {
        const w = state.water;

        SparklineManager.addReading('temperature', w.temperature);
        SparklineManager.addReading('salinity', w.salinity);
        SparklineManager.addReading('pH', w.pH);
        SparklineManager.addReading('ammonia', w.ammonia);
        SparklineManager.addReading('nitrite', w.nitrite);
        SparklineManager.addReading('nitrate', w.nitrate);
        SparklineManager.addReading('alkalinity', w.alkalinity);

        const getStatus = (val, idealMin, idealMax, dangerMin, dangerMax) => {
            if (val >= idealMin && val <= idealMax) return 'good';
            if (val < dangerMin || val > dangerMax) return 'danger';
            return 'warning';
        };

        const getTrendIcon = (t) =>
            t === 'up' ? '↑' : t === 'down' ? '↓' : '→';
        const getTrendClass = (t) =>
            t === 'up'
                ? 'trend-up'
                : t === 'down'
                  ? 'trend-down'
                  : 'trend-flat';

        const pTemp = getStatus(w.temperature, 76, 82, 74, 84);
        const pSal = getStatus(w.salinity, 34, 36, 30, 38);
        const pPh = getStatus(w.pH, 8.1, 8.4, 7.8, 8.6);
        const pAmm = getStatus(w.ammonia, 0, 0, 0.25, Number.MAX_VALUE);
        const pNitri = getStatus(w.nitrite, 0, 0, 0.25, Number.MAX_VALUE);
        const pNitra = getStatus(w.nitrate, 0, 20, 0, 50);
        const pAlk = getStatus(w.alkalinity, 8, 12, 7, 13);

        const formatRow = (
            label,
            key,
            val,
            unit,
            status,
            min,
            max,
            tooltip
        ) => {
            const trend = SparklineManager.getTrend(key);
            const colorMap = {
                good: '#39ff14',
                warning: '#ff9f00',
                danger: '#ff2d55'
            };
            const color = colorMap[status];
            const pct = Math.max(
                0,
                Math.min(100, ((val - min) / (max - min)) * 100)
            );

            return `
            <div class="param-row">
                <div class="param-label tooltip-trigger">
                    ${label}
                    <div class="tooltip-text">${tooltip}</div>
                </div>
                <div class="param-value-container">
                    <canvas id="spark_${key}" class="param-sparkline" width="60" height="16"></canvas>
                    <div class="param-trend ${getTrendClass(trend)}">${getTrendIcon(trend)}</div>
                    <div class="param-value ${status}">${val.toFixed(2)} ${unit}</div>
                </div>
            </div>
            <div class="param-bar"><div class="param-bar-fill" style="width:${pct}%; background:${color}"></div></div>
            `;
        };

        const html = `
            <div class="param-group">
                <div class="param-group-title">Physical</div>
                ${formatRow('🌡️ Temp', 'temperature', w.temperature, '°F', pTemp, 70, 90, 'Optimal: 76-82°F. Fluctuations stress fish.')}
                ${formatRow('🧂 Salinity', 'salinity', w.salinity, 'ppt', pSal, 25, 45, 'Optimal: 34-36 ppt. Evaporation increases salinity.')}
            </div>
            <div class="param-group">
                <div class="param-group-title">Toxins (Cycle)</div>
                ${formatRow('☠️ Ammonia', 'ammonia', w.ammonia, 'ppm', pAmm, 0, 2, 'Highly toxic. Should be 0 in a cycled tank.')}
                ${formatRow('🧪 Nitrite', 'nitrite', w.nitrite, 'ppm', pNitri, 0, 2, 'Toxic intermediate step in the cycle.')}
                ${formatRow('🌿 Nitrate', 'nitrate', w.nitrate, 'ppm', pNitra, 0, 100, 'End product. High levels fuel algae.')}
            </div>
            <div class="param-group">
                <div class="param-group-title">Chemistry</div>
                ${formatRow('⚖️ pH', 'pH', w.pH, '', pPh, 7.5, 9.0, 'Optimal: 8.1-8.4.')}
                ${formatRow('💎 Alkalinity', 'alkalinity', w.alkalinity, 'dKH', pAlk, 5, 15, 'Crucial for coral skeleton growth & pH buffer.')}
            </div>
        `;

        this.updateHTML('waterParamsPanel', html);

        // Throttle sparkline redraws — every 3rd tick is enough for smooth trend viz
        if (this._tickCounter % 3 === 0) {
            setTimeout(() => {
                [
                    'temperature',
                    'salinity',
                    'pH',
                    'ammonia',
                    'nitrite',
                    'nitrate',
                    'alkalinity'
                ].forEach((key) => {
                    SparklineManager.drawSparkline(
                        key,
                        'spark_' + key,
                        'rgba(0, 255, 225, 0.8)'
                    );
                });
            }, 0);
        }
    }

    static renderEquipment(state, _callbacks) {
        let html = '';
        const addToggle = (id, label, icon, stateKey) => {
            if (!state.equipment[id]) {
                html += `
                    <div class="equipment-item">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="equip-icon" style="opacity:0.2">${icon}</div>
                            <div>
                                <div class="equip-name" style="color:var(--text-secondary)">${label}</div>
                                <div class="equip-status">Not Installed</div>
                            </div>
                        </div>
                    </div>`;
                return;
            }

            const isOn = state.equipment[stateKey];
            html += `
                <div class="equipment-item tooltip-trigger">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="equip-icon" style="${isOn ? 'background:rgba(0,255,225,0.2); border-color:var(--accent-cyan); box-shadow:0 0 10px rgba(0,255,225,0.3);' : ''}">${icon}</div>
                        <div>
                            <div class="equip-name" style="${isOn ? 'color:var(--accent-cyan); text-shadow:0 0 5px var(--accent-cyan)' : ''}">${label}</div>
                            <div class="equip-status" style="${isOn ? 'color:var(--success)' : ''}">${isOn ? 'Running Online' : 'Powered Off'}</div>
                        </div>
                    </div>
                    <div class="toggle-switch ${isOn ? 'on' : ''}" data-action="toggle-equip" data-key="${stateKey}"></div>
                    <div class="tooltip-text">${EquipmentManager.getEquipmentTip(id)}</div>
                </div>`;
        };

        addToggle('heater', 'Titanium Heater', '🌡️', 'heaterOn');
        addToggle('powerhead', 'Circulation Pump', '🌊', 'powerheadOn');
        addToggle(
            'proteinSkimmer',
            'Protein Skimmer',
            '🌪️',
            'proteinSkimmerOn'
        );

        const hasLight =
            state.equipment.lightBasic || state.equipment.lightReef;
        if (hasLight) {
            const isReef = state.equipment.lightReef;
            const isOn = state.equipment.lightOn;
            html += `
                <div class="equipment-item tooltip-trigger">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="equip-icon" style="${isOn ? 'background:rgba(255,110,247,0.2); border-color:var(--accent-magenta); box-shadow:0 0 10px rgba(255,110,247,0.3);' : ''}">☀️</div>
                        <div>
                            <div class="equip-name" style="${isOn ? 'color:var(--accent-magenta); text-shadow:0 0 5px var(--accent-magenta)' : ''}">${isReef ? 'Reef LED Array' : 'Basic LED Light'}</div>
                            <div class="equip-status" style="${isOn ? 'color:var(--success)' : ''}">${isOn ? 'Running Online' : 'Powered Off'}</div>
                        </div>
                    </div>
                    <div class="toggle-switch ${isOn ? 'on' : ''}" style="${isOn ? 'background:rgba(255,110,247,0.2); border-color:var(--accent-magenta)' : ''}" data-action="toggle-equip" data-key="lightOn"></div>
                    <div class="tooltip-text">${EquipmentManager.getEquipmentTip(isReef ? 'lightReef' : 'lightBasic')}</div>
                </div>`;
        } else {
            html += `
                <div class="equipment-item">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="equip-icon" style="opacity:0.2">☀️</div>
                        <div>
                            <div class="equip-name" style="color:var(--text-secondary)">Lighting</div>
                            <div class="equip-status">Not Installed</div>
                        </div>
                    </div>
                </div>`;
        }

        this.updateHTML('equipmentPanel', html);
    }

    static renderMaintenance(state, _callbacks) {
        const daysSinceWC = state.day - state.lastWaterChange;
        let html = `
            <button class="maint-btn" id="btnWaterChange" ${state.water.salinity < 30 ? 'disabled' : ''}>
                🔄 Water Change (15%)
                <span class="maint-cooldown">Last: ${state.lastWaterChange > 0 ? daysSinceWC + 'd ago' : 'Never'}</span>
            </button>
            <button class="maint-btn" id="btnCleanGlass">
                🧹 Clean Glass
                <span class="maint-cooldown">Algae: ${Math.round(state.algaeLevel)}%</span>
            </button>
            <button class="maint-btn" id="btnTopOff" ${!state.equipment.rodiUnit ? 'disabled' : ''}>
                💧 Top Off (RO/DI)
                <span class="maint-cooldown">Salinity: ${state.water.salinity.toFixed(1)} ppt</span>
            </button>
            <button class="maint-btn" id="btnFeedFish">
                🍽 Feed Fish
                <span class="maint-cooldown">Today: ${state.feedingsToday}× ${state.lastFed === state.day ? '✅' : ''}</span>
            </button>
        `;

        if (
            !state.cycleComplete &&
            (state.cycleDay > 0 ||
                (state.equipment.tank &&
                    state.water.salinity >= 34 &&
                    state.equipment.liveRock > 0))
        ) {
            html += `
                <div style="margin-top:10px;padding:10px;background:rgba(255,165,2,0.1);border-radius:6px;">
                    <div style="font-size:0.75rem;color:var(--warning);font-weight:700;">${state.cycleDay > 0 ? '🔄 CYCLING — Day ' + Math.floor(state.cycleDay) : '👻 Ready to Ghost Feed'}</div>
                    <button class="maint-btn" id="btnGhostFeed" style="margin-top:6px;">👻 Ghost Feed</button>
                </div>
            `;
        }

        this.updateHTML('maintenancePanel', html);
    }

    static renderRealCosts(state) {
        const html = `
            <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.6;">
                <p><strong>Tank:</strong> ${state.tankGallons} Gallons</p>
                <p><strong>Total Spent:</strong> $${state.totalSpent}</p>
                <p><strong>Remaining Budget:</strong> $${state.budget}</p>
            </div>
        `;
        this.updateHTML('realCostsPanel', html);
    }

    static renderStore(state, _callbacks) {
        // Only rebuild store HTML when ownership or budget changes
        const storeSig =
            state.budget +
            '|' +
            Object.keys(state.equipment)
                .map((k) => k + ':' + (state.equipment[k] ? 1 : 0))
                .join(',');
        if (storeSig === this._lastStoreSig) return;
        this._lastStoreSig = storeSig;

        let html = '<div class="store-category">⚙️ Equipment Store</div>';
        EQUIPMENT_STORE.forEach((item) => {
            const isOwned =
                state.equipment[item.id] ||
                (item.id === 'saltMix' && state.equipment.saltMix > 100);
            const price = StoreService.getItemPrice(item, state.tankSize);
            const displayPrice = isOwned
                ? '<span style="color:var(--text-secondary)">OWNED</span>'
                : '$' + price;

            html += `
            <div class="store-item ${isOwned ? 'locked' : ''}" data-action="buy-equip" data-id="${item.id}">
                <div class="store-item-top">
                    <div class="store-item-name">${item.icon} ${item.name}</div>
                    <div class="store-item-price">${displayPrice}</div>
                </div>
                <div class="store-item-desc">${item.desc}</div>
            </div>`;
        });

        this.updateHTML('tab-store', html);
    }

    static renderLivestock(state, _callbacks) {
        // Only rebuild livestock HTML when arrays change size or IDs shift
        const livesSig =
            state.livestock.length +
            '|' +
            state.corals.length +
            '|' +
            state.livestock.map((f) => f.id + ':' + f.alive).join(',') +
            '|' +
            state.corals
                .map((c) => c.id + ':' + Math.round(c.health))
                .join(',') +
            '|' +
            state.livestock.map((f) => Math.round(f.health)).join(',') +
            '|' +
            (state.cleanupCrew || [])
                .map((c) => c.id + ':' + c.count)
                .join(',');
        if (livesSig === this._lastLivestockSig) return;
        this._lastLivestockSig = livesSig;

        let html = '<div class="store-category">🐠 Fish Store</div>';
        FISH_DATABASE.forEach((fish) => {
            html += `
            <div class="store-item" data-action="buy-fish" data-id="${fish.id}">
                <div class="store-item-top">
                    <div class="store-item-name">${fish.icon} ${fish.name}</div>
                    <div class="store-item-price">$${fish.price}</div>
                </div>
                <div class="store-item-desc">${fish.desc}</div>
            </div>`;
        });

        if (state.livestock.length > 0) {
            html += '<div class="store-category">🐟 Your Tank Fish</div>';
            state.livestock.forEach((fish) => {
                const color =
                    fish.health > 70
                        ? 'var(--success)'
                        : fish.health > 40
                          ? 'var(--warning)'
                          : 'var(--danger)';
                html += `
                <div class="livestock-item">
                    <div class="livestock-header">
                        <span class="livestock-name">${fish.icon} ${fish.name}</span>
                        <span class="livestock-health" style="color:${color}">${Math.round(fish.health)}%</span>
                    </div>
                </div>`;
            });
        }

        html +=
            '<div class="store-category" style="margin-top:20px;">🪸 Corals (Requires Cycled Tank + Light)</div>';
        CORAL_DATABASE.forEach((coral) => {
            html += `
            <div class="store-item" data-action="buy-coral" data-id="${coral.id}">
                <div class="store-item-top">
                    <div class="store-item-name">${coral.icon} ${coral.name}</div>
                    <div class="store-item-price">$${coral.price}</div>
                </div>
                <div class="store-item-desc">${coral.desc}</div>
            </div>`;
        });

        if (state.corals.length > 0) {
            html += '<div class="store-category">🪸 Your Corals</div>';
            state.corals.forEach((coral) => {
                const color =
                    coral.health > 70
                        ? 'var(--success)'
                        : coral.health > 40
                          ? 'var(--warning)'
                          : 'var(--danger)';
                html += `
                <div class="livestock-item">
                    <div class="livestock-header">
                        <span class="livestock-name">${coral.icon} ${coral.name}</span>
                        <span class="livestock-health" style="color:${color}">${Math.round(coral.health)}%</span>
                    </div>
                </div>`;
            });
        }

        html += '<div class="store-category">🦐 Cleanup Crew</div>';
        for (const crew of CLEANUP_DATABASE) {
            const owned =
                (state.cleanupCrew || []).find((c) => c.templateId === crew.id)
                    ?.count || 0;
            html += `<div class="store-item" data-action="buy-cleanup" data-id="${crew.id}">
                <div class="store-item-top"><div class="store-item-name">${crew.icon} ${crew.name}</div>
                <div class="store-item-price">$${crew.price}</div></div>
                <div class="store-item-desc">${crew.desc}</div>
                <div class="store-item-desc">Pack: ${crew.count} · In tank: ${owned}</div></div>`;
        }
        this.updateHTML('tab-livestock', html);
    }

    static renderJournal(state) {
        let html = '';
        [...state.journal]
            .reverse()
            .slice(0, 40)
            .forEach((entry) => {
                html += `
            <div class="journal-entry">
                <div class="journal-time">${entry.time}</div>
                <div class="journal-text">${entry.text}</div>
                ${entry.tip ? `<div class="journal-tip">💡 ${entry.tip}</div>` : ''}
            </div>`;
            });
        this.updateHTML(
            'tab-journal',
            html ||
                '<div style="padding:20px;text-align:center;color:var(--text-secondary);">Journal empty.</div>'
        );
    }

    static renderKnowledge(state, _callbacks) {
        let html = '';
        Object.keys(KNOWLEDGE_BASE).forEach((key) => {
            const kb = KNOWLEDGE_BASE[key];
            const pct = state.knowledge[key] || 0;
            let content = `
                <div class="topic-title">${kb.title}</div>
                <div class="topic-progress">
                    <div class="topic-bar"><div class="topic-bar-fill" style="width:${pct}%"></div></div>
                    <span class="topic-pct">${pct}%</span>
                </div>`;

            // Add quiz button if knowledge >= 40% and quiz available
            if (pct >= 40 && kb.quiz) {
                content += `<button class="quiz-btn" data-action="take-quiz" data-key="${key}">Take Quiz</button>`;
            }

            html += `
            <div class="knowledge-topic" data-action="read-kb" data-key="${key}">
                ${content}
            </div>`;
        });
        this.updateHTML('tab-knowledge', html);
    }

    static renderHUD(state) {
        const tempStatus =
            state.water.temperature >= 76 && state.water.temperature <= 82
                ? 'var(--success)'
                : 'var(--danger)';
        const salStatus =
            state.water.salinity >= 34 && state.water.salinity <= 36
                ? 'var(--success)'
                : 'var(--warning)';

        const html = `
            <div class="hud-badge"><span class="hud-dot" style="background:${tempStatus}"></span>${state.water.temperature.toFixed(1)}°F</div>
            <div class="hud-badge"><span class="hud-dot" style="background:${salStatus}"></span>${state.water.salinity.toFixed(1)} ppt</div>
            <div class="hud-badge">${state.cycleComplete ? 'Cycled ✓' : 'Cycling...'}</div>
            ${state.livestock.length > 0 ? `<div class="hud-badge">🐠 ${state.livestock.length}</div>` : ''}
        `;
        this.updateHTML('tankHud', html);
    }

    static renderPhase(state) {
        const phases = [
            'Tank Setup',
            'Nitrogen Cycle',
            'First Livestock',
            'Growing Reef',
            'Advanced Reef'
        ];
        let html = '';
        phases.forEach((title, i) => {
            const active =
                i === state.phase ? 'active' : i < state.phase ? 'done' : '';
            html += `
            <div class="timeline-item ${active}">
                <div class="timeline-dot"></div>
                <div class="timeline-title">${title}</div>
            </div>`;
        });
        this.updateHTML('phaseTimeline', html);
    }

    static updateTimeDisplay(state) {
        const el = document.getElementById('timeDisplay');
        if (!el) return;
        const text = `Day ${state.day} - ${state.hour}:00`;
        if (el.textContent !== text) el.textContent = text;
    }

    static updateBudgetDisplay(state) {
        const el = document.getElementById('budgetDisplay');
        if (!el) return;
        const text = `$${state.budget.toLocaleString()}`;
        if (el.textContent !== text) el.textContent = text;
    }

    static updateProfileDisplay(state) {
        const el = document.getElementById('profileDisplay');
        if (!el) return;
        const text = `Profile: ${state.profileName}`;
        if (el.textContent !== text) el.textContent = text;
    }

    static showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
    }
}
