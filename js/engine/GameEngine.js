// =========================================
// GAME ENGINE: ORCHESTRATOR & MAIN LOOP
// =========================================

import { GameState } from './GameState.js';
import { ObservableStore } from './ObservableStore.js';
import { WaterChemistry } from '../model/WaterChemistry.js';
import { EquipmentManager } from '../model/EquipmentManager.js';
import {
    StoreService,
    EQUIPMENT_STORE,
    KNOWLEDGE_BASE
} from '../model/StoreService.js';
import { LivestockEngine } from '../model/LivestockEngine.js';
import { ThreeRenderer } from '../graphics/ThreeRenderer.js';
import { UIController } from '../ui/UIController.js';

export class GameEngine {
    constructor() {
        this.gameState = new GameState();
        this.store = new ObservableStore(this.gameState.state);
        this.renderer = new ThreeRenderer('tank3D');
        this.tickTimer = null;
        this._uiDirty = true;
        this.store.subscribe('*', () => {
            this._uiDirty = true;
        });

        // Automatically synchronize the store when gameState is reset or loaded
        const originalLoad = this.gameState.loadFromSnapshot.bind(
            this.gameState
        );
        this.gameState.loadFromSnapshot = (snapshot) => {
            originalLoad(snapshot);
            this.store.load(this.gameState.state);
        };

        const originalReset = this.gameState.reset.bind(this.gameState);
        this.gameState.reset = (size, name) => {
            const newState = originalReset(size, name);
            this.store.load(newState);
            return newState;
        };
    }

    get state() {
        return this.store.state;
    }

    init() {
        // We only prepare the UI state, but wait for user to start or resume.
        const activeName = GameState.getActiveProfileName();
        const profiles = GameState.getSavedProfiles();

        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) welcomeScreen.style.display = 'flex';

        const resumeBtn = document.getElementById('resumeButton');
        const resetBtn = document.getElementById('resetBtn');
        const profileInfo = document.getElementById('welcomeProfileInfo');

        if (profileInfo)
            profileInfo.textContent = `Current profile: ${activeName}`;

        if (profiles[activeName] && profiles[activeName].started) {
            if (resumeBtn) resumeBtn.style.display = 'inline-block';
            if (resetBtn) resetBtn.style.display = 'inline-block';
        }

        // Initialize 3D renderer
        this.renderer.init();

        // Register window global functions for index.html onclick handlers
        this.registerGlobalHandlers();

        // Start simulation tick loop (logic only)
        this.startLoop();
        // Start independent render loop at display refresh rate
        this._startRenderLoop();

        // Initial render
        this.render();

        window.requestAnimationFrame(() => {
            this.renderer.onResize();
        });
    }

    _startRenderLoop() {
        if (this._renderLoopRunning) return;
        this._renderLoopRunning = true;
        const loop = () => {
            if (!document.hidden && this.state.started) this.render(false);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    startLoop() {
        if (this.tickTimer) clearInterval(this.tickTimer);
        this.tickTimer = setInterval(
            () => {
                if (this.state.started && !this.state.paused) {
                    this.tick();
                }
            },
            1000 / (this.state.speed || 1)
        );
    }

    tick() {
        // Advance time
        this.state.minute += 15;
        if (this.state.minute >= 60) {
            this.state.minute = 0;
            this.state.hour += 1;
            if (this.state.hour >= 24) {
                this.state.hour = 0;
                this.state.day += 1;
                this.state.feedingsToday = 0;
            }
        }

        // Run biological & chemical physics (rendering is handled by the RAF loop)
        WaterChemistry.tick(this.state, 0.25);
        LivestockEngine.tick(this.state, 0.25);
    }

    render(forceUI = true) {
        if (forceUI || this._uiDirty) {
            this._uiDirty = false;
            UIController.renderAll(this.state, {
                onToggleEquipment: (key) => this.toggleEquipment(key),
                onWaterChange: () => this.doWaterChange(),
                onCleanGlass: () => this.cleanGlass(),
                onTopOff: () => this.doTopOff(),
                onFeedFish: () => this.feedFish(),
                onGhostFeed: () => this.ghostFeed(),
                onBuyEquipment: (id) => this.buyEquipment(id),
                onBuyFish: (id) => this.buyFish(id),
                onBuyCoral: (id) => this.buyCoral(id),
                onReadKnowledge: (key) => this.readKnowledge(key, true),
                onTakeQuiz: (key) => this.takeQuiz(key)
            });
        }

        this.renderer.render(this.state);
    }

    toggleEquipment(stateKey) {
        const newState = EquipmentManager.toggleEquipment(this.state, stateKey);
        UIController.showToast(
            `Equipment ${newState ? 'ONLINE' : 'OFFLINE'}`,
            newState ? 'success' : 'warning'
        );
        this.save();
        this.render();
    }

    buyEquipment(itemId) {
        const check = StoreService.canPurchaseEquipment(this.state, itemId);
        if (!check.canBuy) {
            UIController.showToast(`Cannot buy: ${check.reason}`, 'warning');
            return;
        }

        const item = EQUIPMENT_STORE.find((i) => i.id === itemId);

        // Prevent buying duplicate non-stackable items
        if (
            !item.stackable &&
            itemId !== 'substrate' &&
            this.state.equipment[itemId]
        ) {
            UIController.showToast('You already own this!', 'warning');
            return;
        }

        this.state.budget -= check.price;
        this.state.totalSpent += check.price;

        let journalText = `📦 Purchased ${item.name}`;
        let journalTip = item.desc;

        if (itemId === 'liveRock') {
            this.state.equipment.liveRock =
                (this.state.equipment.liveRock || 0) + 10;
            journalText = `🪨 Added 10 lbs of live rock. Total: ${this.state.equipment.liveRock} lbs. (Recommended: ${Math.round(this.state.tankGallons * 1.25)} lbs)`;
            journalTip = `Live rock acts as your biological filter. The pores host nitrifying bacteria that process ammonia.`;
            this.readKnowledge('liveRock');
        } else if (itemId === 'substrate') {
            this.state.equipment.substrate =
                (this.state.equipment.substrate || 0) + 40;
            journalText = `⏳ Added 40 lbs of live sand. Aim for 1-2 inches depth.`;
            journalTip = `Aragonite sand buffers pH and provides surface area for biological colonization.`;
        } else if (itemId === 'saltMix') {
            this.state.equipment.saltMix =
                (this.state.equipment.saltMix || 0) + 160;
            if (this.state.equipment.tank && this.state.water.salinity < 34) {
                this.state.water.salinity = 10; // Start mixing salinity
                journalText = `🧂 Added salt mix and began mixing! Salinity will gradually reach 35 ppt.`;
                journalTip = `In real life, mix salt in a separate container for 24 hours. NEVER add dry salt directly to a tank with livestock.`;
                this.readKnowledge('salinity');
            } else {
                journalText = `🧂 Purchased salt mix for water changes and top-ups.`;
            }
        } else {
            this.state.equipment[itemId] = true;
            journalText = `⚙️ Installed: ${item.name}. ${item.desc}`;
            journalTip = `Real-world cost: ${typeof item.realPrice === 'object' ? item.realPrice[this.state.tankSize] || item.realPrice.medium : item.realPrice}. ${EquipmentManager.getEquipmentTip(itemId)}`;
        }

        if (itemId === 'tank') {
            this.state.phase = Math.max(this.state.phase, 1);
        }

        this.state.journal.push({
            time: `Day ${this.state.day} ${this.state.hour}:00`,
            text: journalText,
            tip: journalTip
        });

        if (item.category === 'filtration') this.readKnowledge('filtration');
        if (item.category === 'lighting') this.readKnowledge('lighting');
        if (itemId === 'heater') this.readKnowledge('temperature');
        if (itemId === 'testKit') this.readKnowledge('waterChemistry');
        if (itemId === 'refractometer' || itemId === 'autoTopOff')
            this.readKnowledge('salinity');
        if (itemId === 'quarantineTank') this.readKnowledge('quarantine');
        if (itemId === 'sump') this.readKnowledge('filtration');

        UIController.showToast(`Purchased ${item.name}!`, 'success');
        this.save();
        this.render();
    }

    buyFish(fishId) {
        const check = StoreService.canPurchaseFish(this.state, fishId);
        if (!check.canBuy) {
            UIController.showToast(
                `Cannot buy fish: ${check.reason}`,
                'warning'
            );
            return;
        }

        this.state.budget -= check.template.price;
        this.state.totalSpent += check.template.price;
        LivestockEngine.addFish(this.state, fishId);

        if (this.state.phase < 3) {
            this.state.phase = 3;
        }

        this.state.journal.push({
            time: `Day ${this.state.day} ${this.state.hour}:00`,
            text: `🐟 Added ${check.template.name}`,
            tip: check.template.desc
        });

        this.readKnowledge('fishSelection');

        UIController.showToast(
            `Added ${check.template.name} to tank!`,
            'success'
        );
        this.save();
        this.render();
    }

    buyCoral(coralId) {
        const check = StoreService.canPurchaseCoral(this.state, coralId);
        if (!check.canBuy) {
            UIController.showToast(
                `Cannot buy coral: ${check.reason}`,
                'warning'
            );
            return;
        }

        this.state.budget -= check.template.price;
        this.state.totalSpent += check.template.price;
        LivestockEngine.addCoral(this.state, coralId);

        if (this.state.phase < 3) {
            this.state.phase = 3;
        }

        this.state.journal.push({
            time: `Day ${this.state.day} ${this.state.hour}:00`,
            text: `🪸 Added ${check.template.name}`,
            tip: check.template.desc
        });

        UIController.showToast(
            `Added ${check.template.name} to tank!`,
            'success'
        );
        this.save();
        this.render();
    }

    doWaterChange() {
        if (!this.state.equipment.tank || this.state.water.salinity < 30) {
            UIController.showToast('No water in tank to change!', 'warning');
            return;
        }
        const changePercent = 15;
        const saltRequired = Math.ceil(
            (this.state.tankGallons * changePercent) / 100
        );
        if ((this.state.equipment.saltMix || 0) < saltRequired) {
            UIController.showToast(
                'Need salt mix for water changes!',
                'warning'
            );
            return;
        }

        this.state.water.nitrate = Math.max(
            0,
            this.state.water.nitrate * (1 - changePercent / 100)
        );
        this.state.water.phosphate = Math.max(
            0,
            this.state.water.phosphate * (1 - changePercent / 100)
        );
        this.state.water.ammonia = Math.max(
            0,
            this.state.water.ammonia * (1 - changePercent / 100)
        );
        this.state.water.nitrite = Math.max(
            0,
            this.state.water.nitrite * (1 - changePercent / 100)
        );

        // Replenish trace elements
        this.state.water.alkalinity +=
            ((9 - this.state.water.alkalinity) * changePercent) / 100;
        this.state.water.calcium +=
            ((420 - this.state.water.calcium) * changePercent) / 100;
        this.state.water.magnesium +=
            ((1350 - this.state.water.magnesium) * changePercent) / 100;

        this.state.lastWaterChange = this.state.day;
        this.state.equipment.saltMix = Math.max(
            0,
            this.state.equipment.saltMix - saltRequired
        );

        this.state.journal.push({
            time: `Day ${this.state.day} ${this.state.hour}:00`,
            text: `🔄 Performed ${changePercent}% water change (${Math.round((this.state.tankGallons * changePercent) / 100)} gallons).`,
            tip: `Nitrate: ${this.state.water.nitrate.toFixed(1)} ppm. Mix new saltwater 24 hours ahead, match temp and salinity, then swap.`
        });

        this.readKnowledge('waterChanges');

        UIController.showToast(
            `✅ ${changePercent}% water change complete!`,
            'success'
        );
        this.save();
        this.render();
    }

    cleanGlass() {
        this.state.algaeLevel = Math.max(0, this.state.algaeLevel - 20);
        this.state.lastGlassCleaned = this.state.day;
        this.state.journal.push({
            time: `Day ${this.state.day} ${this.state.hour}:00`,
            text: `🧹 Cleaned aquarium glass.`,
            tip: `In real life, use a magnetic algae scraper or pad. Never use soap near the tank.`
        });
        UIController.showToast('🧹 Glass cleaned!', 'success');
        this.render();
    }

    doTopOff() {
        if (!this.state.equipment.rodiUnit) {
            UIController.showToast(
                'Need RO/DI unit to make pure water!',
                'warning'
            );
            return;
        }
        if (this.state.water.salinity <= 35) {
            UIController.showToast('Salinity is fine!', 'info');
            return;
        }
        this.state.water.salinity = Math.max(
            35,
            this.state.water.salinity - 0.5
        );
        this.state.journal.push({
            time: `Day ${this.state.day} ${this.state.hour}:00`,
            text: `💧 Added fresh RO/DI water to top off evaporation. Salinity adjusted.`,
            tip: `Only add fresh water to replace evaporation. When water evaporates, salt stays behind, increasing salinity.`
        });
        this.readKnowledge('salinity');
        UIController.showToast('💧 Top-off RO/DI water added', 'success');
        this.render();
    }

    feedFish() {
        if (this.state.livestock.length === 0) {
            if (!this.state.cycleComplete && this.state.cycleDay > 0) {
                // Ghost feeding for cycle
                this.state.water.ammonia += 0.3;
                this.state.ghostFedForCycle = true;
                this.state.journal.push({
                    time: `Day ${this.state.day} ${this.state.hour}:00`,
                    text: `🍽 "Ghost fed" the tank — added fish food to fuel the nitrogen cycle.`,
                    tip: `Adding a pinch of fish food every few days during cycling provides ammonia for the bacteria.`
                });
                UIController.showToast(
                    'Ghost feeding — ammonia source for cycle',
                    'info'
                );
            } else {
                UIController.showToast('No fish to feed!', 'warning');
            }
            this.render();
            return;
        }

        this.state.feedingsToday += 1;
        this.state.lastFed = this.state.day;

        if (this.state.feedingsToday > 3) {
            this.state.water.ammonia += 0.1;
            this.state.water.phosphate += 0.01;
            this.state.journal.push({
                time: `Day ${this.state.day} ${this.state.hour}:00`,
                text: `⚠️ Overfeeding! Excess food is decomposing and producing toxic ammonia.`,
                tip: `Overfeeding is the #1 cause of water quality problems. Feed only what fish consume in 2-3 minutes.`
            });
            UIController.showToast(
                '⚠️ Overfeeding! Excess food is decomposing.',
                'warning'
            );
            this.readKnowledge('feeding');
        } else {
            // Heal fish slightly from feeding
            this.state.livestock.forEach((f) => {
                f.health = Math.min(100, f.health + 0.5);
            });
            this.state.journal.push({
                time: `Day ${this.state.day} ${this.state.hour}:00`,
                text: `🍽 Fed the fish. They seem happy!`,
                tip: `In real reefkeeping, feed 1-2 times daily with a variety of frozen and dry foods.`
            });
            UIController.showToast('🍽 Fish fed!', 'success');
            this.readKnowledge('feeding');
        }
        this.render();
    }

    ghostFeed() {
        if (this.state.cycleDay === 0) {
            this.state.cycleDay = 1;
        }
        this.state.water.ammonia += 0.4;
        this.state.ghostFedForCycle = true;
        this.state.journal.push({
            time: `Day ${this.state.day} ${this.state.hour}:00`,
            text: `👻 Ghost fed the tank during setup phase.`,
            tip: `Ghost feeding starts decomposition, releasing ammonia to spark beneficial bacterial growth.`
        });
        UIController.showToast(
            '👻 Ghost feed added ammonia for cycling.',
            'info'
        );
        this.render();
    }

    readKnowledge(key, showLesson = false) {
        const topic = KNOWLEDGE_BASE[key];
        if (!topic) return;
        this.state.knowledge[key] = Math.min(
            100,
            (this.state.knowledge[key] || 0) + 20
        );
        if (showLesson) this.showModal(topic.title, topic.content);
        this.save();
        this.render();
    }

    // Quiz system methods
    takeQuiz(key) {
        const topic = KNOWLEDGE_BASE[key];
        if (!topic || !topic.quiz) {
            UIController.showToast(
                'Quiz not available for this topic',
                'warning'
            );
            return;
        }

        // Store current quiz state
        this.currentQuiz = {
            key: key,
            questions: topic.quiz.questions,
            currentQuestionIndex: 0,
            score: 0,
            answers: []
        };

        this.showQuizQuestion();
    }

    showQuizQuestion() {
        if (!this.currentQuiz) return;

        const { currentQuestionIndex, questions } = this.currentQuiz;
        if (currentQuestionIndex >= questions.length) {
            this.finishQuiz();
            return;
        }

        const question = questions[currentQuestionIndex];
        const html = `
            <div class="quiz-modal-content">
                <h3>Question ${currentQuestionIndex + 1} of ${questions.length}</h3>
                <p class="quiz-question">${question.question}</p>
                <div class="quiz-options">
                    ${question.options
                        .map(
                            (option, index) => `
                        <button class="quiz-option-btn" data-index="${index}">
                            ${option}
                        </button>
                    `
                        )
                        .join('')}
                </div>
                <div class="quiz-progress">
                    Progress: ${currentQuestionIndex}/${questions.length}
                </div>
            </div>
        `;

        this.showModal('Quiz', html, () => {
            // Handle option clicks
            document.querySelectorAll('.quiz-option-btn').forEach((btn) => {
                btn.onclick = (e) => {
                    const selectedIndex = parseInt(e.target.dataset.index);
                    this.submitQuizAnswer(selectedIndex);
                };
            });
        });
    }

    submitQuizAnswer(selectedIndex) {
        if (!this.currentQuiz || this.currentQuiz.answerPending) return;

        const { currentQuestionIndex, questions } = this.currentQuiz;
        const question = questions[currentQuestionIndex];
        if (
            !question ||
            !Number.isInteger(selectedIndex) ||
            selectedIndex < 0 ||
            selectedIndex >= question.options.length
        )
            return;
        this.currentQuiz.answerPending = true;
        const quiz = this.currentQuiz;
        document.querySelectorAll('.quiz-option-btn').forEach((button) => {
            button.disabled = true;
        });
        const isCorrect = selectedIndex === question.correct;

        // Record answer
        this.currentQuiz.answers.push({
            questionIndex: currentQuestionIndex,
            selectedIndex: selectedIndex,
            correctIndex: question.correct,
            isCorrect: isCorrect
        });

        if (isCorrect) {
            this.currentQuiz.score++;
            UIController.showToast(
                'Correct! ' + question.explanation,
                'success'
            );
        } else {
            UIController.showToast(
                `Incorrect. ${question.explanation}`,
                'warning'
            );
        }

        // Move to next question
        this.currentQuiz.currentQuestionIndex++;

        // Small delay before showing next question
        setTimeout(() => {
            if (this.currentQuiz !== quiz) return;
            quiz.answerPending = false;
            this.showQuizQuestion();
        }, 1500);
    }

    finishQuiz() {
        const { key, questions, score } = this.currentQuiz;
        const percentage = Math.round((score / questions.length) * 100);

        // Calculate knowledge points to award
        let knowledgeGain = 0;
        if (percentage >= 80) {
            knowledgeGain = 25; // Excellent
        } else if (percentage >= 60) {
            knowledgeGain = 15; // Good
        } else if (percentage >= 40) {
            knowledgeGain = 10; // Pass
        } else {
            knowledgeGain = 5; // Attempt
        }

        // Apply knowledge gain (capped at 100)
        const currentKnowledge = this.state.knowledge[key] || 0;
        const newKnowledge = Math.min(100, currentKnowledge + knowledgeGain);
        this.state.knowledge[key] = newKnowledge;

        // Show results
        const resultHtml = `
            <div class="quiz-results">
                <h3>Quiz Complete!</h3>
                <p>Your score: ${score}/${questions.length} (${percentage}%)</p>
                <p>Knowledge gained: +${knowledgeGain}%</p>
                <p>${percentage >= 60 ? 'Great job!' : 'Keep studying to improve your score.'}</p>
                <button class="action-btn primary" onclick="closeModal()">
                    Close
                </button>
            </div>
        `;

        this.showModal('Quiz Results', resultHtml);
        this.currentQuiz = null;
        this.save();
        this.render();
    }

    showModal(title, content, onShowCallback = null) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        if (onShowCallback) onShowCallback();
        const overlay = document.getElementById('modalOverlay');
        overlay.style.display = 'flex';
        overlay.classList.add('show');
    }

    save() {
        const profiles = GameState.getSavedProfiles();
        profiles[this.state.profileName] = this.state;
        GameState.saveProfiles(profiles);
        GameState.setActiveProfileName(this.state.profileName);
    }

    registerGlobalHandlers() {
        window.startGame = (size) => {
            const activeProfile = GameState.getActiveProfileName();
            const profileName =
                activeProfile === 'Guest' ? 'Default' : activeProfile;
            this.gameState.reset(size, profileName);
            this.state.started = true;
            this.startLoop();
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('topNav').style.display = 'flex';
            document.getElementById('mainLayout').style.display = 'grid';
            this.render();
        };

        window.resumeGame = () => {
            const activeName = GameState.getActiveProfileName();
            const profiles = GameState.getSavedProfiles();
            if (profiles[activeName]) {
                this.gameState.loadFromSnapshot(profiles[activeName]);
                this.state.started = true;
                this.startLoop();
                document.getElementById('welcomeScreen').style.display = 'none';
                document.getElementById('topNav').style.display = 'flex';
                document.getElementById('mainLayout').style.display = 'grid';
                this.render();
            }
        };

        window.setSpeed = (s) => {
            this.state.speed = s;
            this.startLoop();
            document
                .querySelectorAll('.speed-btn')
                .forEach((b) => b.classList.remove('active'));
            const activeBtn = document.getElementById('speed' + s);
            if (activeBtn) activeBtn.classList.add('active');
        };

        window.togglePause = () => {
            this.state.paused = !this.state.paused;
            const pauseBtn = document.getElementById('pauseBtn');
            if (pauseBtn) pauseBtn.textContent = this.state.paused ? '▶' : '⏸';
        };

        window.switchRightTab = (tabName) => {
            document
                .querySelectorAll('.right-tab')
                .forEach((t) => t.classList.remove('active'));
            document
                .querySelectorAll('.tab-panel')
                .forEach((p) => p.classList.remove('active'));

            document.querySelectorAll('.right-tab').forEach((t) => {
                if (
                    t.getAttribute('onclick') &&
                    t.getAttribute('onclick').includes(tabName)
                ) {
                    t.classList.add('active');
                }
            });
            const panel = document.getElementById('tab-' + tabName);
            if (panel) panel.classList.add('active');
        };

        window.toggleSection = (header) => {
            const content = header.nextElementSibling;
            if (!content) return;
            content.style.display =
                content.style.display === 'none' ? '' : 'none';
        };

        window.takeQuiz = (key) => {
            this.takeQuiz(key);
        };
    }
}
