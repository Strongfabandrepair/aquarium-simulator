// =========================================
// MAIN ES6 ENTRY POINT
// =========================================

import { GameEngine } from './engine/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
    const engine = new GameEngine();
    window.gameEngine = engine;

    window.showProfileModal = () => {
        console.log('showProfileModal called');
        const profiles = JSON.parse(
            localStorage.getItem('reefSimProfiles') || '{}'
        );
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
                                  `<button class="maint-btn" style="width:100%;margin-bottom:8px;" data-profile="${name}">${name}${name === active ? ' (active)' : ''}</button>`
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
                        localStorage.setItem('reefSimActiveProfile', newName);
                        // Save a blank profile so it shows up in list immediately
                        const currentProfiles = JSON.parse(
                            localStorage.getItem('reefSimProfiles') || '{}'
                        );
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
        const profiles = JSON.parse(
            localStorage.getItem('reefSimProfiles') || '{}'
        );
        const active = localStorage.getItem('reefSimActiveProfile') || 'Guest';
        const snapshot = profiles[active];

        if (snapshot && window.gameEngine) {
            window.gameEngine.gameState.loadFromSnapshot(snapshot);
            window.gameEngine.state.started = true;
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
            modalBody.innerHTML =
                '<p style="color:var(--text-secondary);line-height:1.6;">Use the test kit panel to read ammonia, nitrite, nitrate, pH, alkalinity, calcium, and magnesium. In a cycled tank, ammonia and nitrite should stay at 0.</p>';
        }
        if (modalActions) {
            modalActions.innerHTML = `<button class="action-btn primary" onclick="closeModal()">Close</button>`;
        }
        const testKitOverlayEl = document.getElementById('modalOverlay');
        testKitOverlayEl.style.display = 'flex';
        testKitOverlayEl.classList.add('show');
    };

    window.closeModal = () => {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.remove('show');
        }
    };

    window.clearSavedData = () => {
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
