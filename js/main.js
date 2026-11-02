// =========================================
// MAIN ES6 ENTRY POINT
// =========================================

import { GameEngine } from './engine/GameEngine.js';
import { GameState, PARAM_LABELS, WATER_IDEAL } from './engine/GameState.js';
const escapeHTML = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (c) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[c]
    );

window.addEventListener('DOMContentLoaded', () => {
    const engine = new GameEngine();
    window.gameEngine = engine;

    window.showProfileModal = () => {
        console.log('showProfileModal called');
        const profiles = GameState.getSavedProfiles();
        const active = localStorage.getItem('reefSimActiveProfile') || 'Guest';
        const names = Object.keys(profiles);
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalActions = document.getElementById('modalActions');

        if (modalTitle) modalTitle.textContent = 'Profiles';
        if (modalBody) {
            const items =
                names.length > 0
                    ? names
                          .map(
                              (name) =>
                                  `<button class="maint-btn" style="width:100%;margin-bottom:8px;" data-profile="${escapeHTML(name)}">${escapeHTML(name)}${name === active ? ' (active)' : ''}</button>`
                          )
                          .join('')
                    : '<div style="color:var(--text-secondary)">No saved profiles yet.</div>';

            const newProfileHtml = `
                <div style="display:flex;gap:8px;margin-top:16px;">
                    <input type="text" id="newProfileName" class="form-input" style="flex:1; padding:8px; border-radius:4px; border:1px solid #ccc; background:#111; color:#fff;" placeholder="New Profile Name...">
                    <button class="action-btn primary" id="createNewProfileBtn">Create</button>
                </div>
            `;

            modalBody.innerHTML = `<div style="display:grid;gap:8px;">${items}</div>${newProfileHtml}`;
        }
        if (modalActions) {
            modalActions.innerHTML = `<button class="action-btn primary" onclick="closeModal()">Close</button>`;
        }

        if (modalBody) {
            modalBody.querySelectorAll('[data-profile]').forEach((button) => {
                button.onclick = () => {
                    if (engine.state.started) engine.save();
                    localStorage.setItem(
                        'reefSimActiveProfile',
                        button.dataset.profile
                    );
                    const saved = profiles[button.dataset.profile];
                    if (saved && window.gameEngine) {
                        window.gameEngine.gameState.loadFromSnapshot(saved);
                        window.gameEngine.state.started = !!saved.started;
                        window.gameEngine.render();
                    }
                    window.closeModal();
                    location.reload(); // Reload to refresh start screen UI properly
                };
            });

            const createBtn = document.getElementById('createNewProfileBtn');
            if (createBtn) {
                createBtn.onclick = () => {
                    const newName = document
                        .getElementById('newProfileName')
                        .value.trim();
                    if (newName) {
                        if (engine.state.started) engine.save();
                        engine.state.started = false;
                        document.getElementById('welcomeScreen').style.display =
                            'flex';
                        document.getElementById('mainLayout').style.display =
                            'none';
                        document.getElementById('topNav').style.display =
                            'none';
                        document.getElementById('resumeButton').style.display =
                            'none';
                        localStorage.setItem('reefSimActiveProfile', newName);
                        // Save a blank profile so it shows up in list immediately
                        const currentProfiles = GameState.getSavedProfiles();
                        if (!currentProfiles[newName]) {
                            currentProfiles[newName] = {
                                started: false,
                                profileName: newName
                            };
                            localStorage.setItem(
                                'reefSimProfiles',
                                JSON.stringify(currentProfiles)
                            );
                        }
                        window.showProfileModal(); // Refresh modal
                        // Update UI info
                        const profileInfo =
                            document.getElementById('welcomeProfileInfo');
                        if (profileInfo)
                            profileInfo.textContent = `Current profile: ${newName}`;
                    }
                };
            }
        }

        const modalOverlayEl = document.getElementById('modalOverlay');
        modalOverlayEl.style.display = 'flex';
        modalOverlayEl.classList.add('show');
    };

    window.resumeActiveProfile = () => {
        console.log('resumeActiveProfile called');
        const profiles = GameState.getSavedProfiles();
        const active = localStorage.getItem('reefSimActiveProfile') || 'Guest';
        const snapshot = profiles[active];

        if (snapshot && window.gameEngine) {
            window.gameEngine.gameState.loadFromSnapshot(snapshot);
            window.gameEngine.state.started = true;
            window.gameEngine.startLoop();
            window.setSpeed(window.gameEngine.state.speed);
            document.getElementById('pauseBtn').textContent = window.gameEngine
                .state.paused
                ? '▶'
                : '⏸';
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('topNav').style.display = 'flex';
            document.getElementById('mainLayout').style.display = 'grid';
            window.closeModal();
            window.gameEngine.render();
            return;
        }

        window.showProfileModal();
    };

    window.showTestKitModal = () => {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalActions = document.getElementById('modalActions');

        if (modalTitle) modalTitle.textContent = 'Test Water';
        if (modalBody) {
            modalBody.innerHTML = engine.state.equipment.testKit
                ? '<p>Current water measurements</p>' +
                  Object.entries(engine.state.water)
                      .map(
                          ([key, value]) =>
                              `<p><strong>${PARAM_LABELS[key] || key}</strong>: ${Number(value).toFixed(2)} ${WATER_IDEAL[key]?.unit || ''}</p>`
                      )
                      .join('')
                : '<p>Purchase a Test Kit from the equipment store to measure your water.</p>';
        }
        if (modalActions) {
            modalActions.innerHTML = `<button class="action-btn primary" onclick="closeModal()">Close</button>`;
        }
        const testKitOverlayEl = document.getElementById('modalOverlay');
        testKitOverlayEl.style.display = 'flex';
        testKitOverlayEl.classList.add('show');
    };

    window.closeModal = () => {
        engine.currentQuiz = null;
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.remove('show');
        }
    };

    window.clearSavedData = () => {
        engine.state.started = false;
        localStorage.removeItem('reefSimProfiles');
        localStorage.removeItem('reefSimActiveProfile');
        console.log('Saved data cleared');
        location.reload();
    };

    window.dismissAlert = () => {
        const banner = document.getElementById('alertBanner');
        if (banner) banner.style.display = 'none';
    };

    engine.init();
    console.log('Engine initialized, started:', engine.state.started);
    document
        .getElementById('profileBtn')
        ?.addEventListener('click', window.showProfileModal);
    document
        .getElementById('resetBtn')
        ?.addEventListener('click', window.clearSavedData);
});
