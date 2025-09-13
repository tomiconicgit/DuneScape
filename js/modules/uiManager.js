// js/modules/uiManager.js
import { gameState } from './gameState.js';
// ✅ FIX: Import the function to set the target position from sceneSetup
import { setTargetPosition } from './sceneSetup.js';

function updateHealthBar() {
    const healthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = healthPercent + '%';
    document.getElementById('health-amount').textContent = `${gameState.player.health}/${gameState.player.maxHealth}`;
}

function updateGoldDisplay() {
    document.getElementById('gold-amount').textContent = gameState.player.gold;
}

function showNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    document.getElementById('ui-container').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const isVisible = panel.style.display === 'block';
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    panel.style.display = isVisible ? 'none' : 'block';
}

function completeMission() {
    if (!gameState.currentMission) return;
    const reward = 100 + Math.floor(Math.random() * 150);
    gameState.player.gold += reward;
    updateGoldDisplay();
    showNotification(`Mission complete! Received ${reward} gold.`);
    gameState.currentMission = null;
    // No need to set velocity here, the animate loop handles stopping.
}

function startMission(missionTitle) {
    gameState.currentMission = missionTitle;
    document.getElementById('missions-panel').style.display = 'none';
    showNotification(`Mission started: ${missionTitle}`);
    
    // ✅ FIX: Instead of setting velocity directly, set a target destination.
    // This makes the mission "autoplay" use the same logic as click-to-move.
    if (gameState.player.body) {
        const currentPos = gameState.player.body.position;
        // Set a target 20 units away in a random-ish direction
        const missionTarget = new THREE.Vector3(currentPos.x + 20, 0, currentPos.z + 5);
        setTargetPosition(missionTarget);
    }
    setTimeout(completeMission, 5000); // Mission completes after 5 seconds
}

function startGame() {
    document.getElementById('welcome-modal').style.display = 'none';
    gameState.initialized = true;
    showNotification('Welcome to DuneScape! Begin your adventure.');
}

function respawn() {
    document.getElementById('death-modal').style.display = 'none';
    gameState.player.health = gameState.player.maxHealth;
    updateHealthBar();
    if (gameState.player.body) {
        gameState.player.body.position.set(0, 1, 0);
        gameState.player.body.velocity.set(0, 0, 0);
    }
    showNotification('You have been resurrected!');
}

export function initUI() {
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('respawn-btn').addEventListener('click', respawn);

    document.getElementById('inventory-btn').addEventListener('click', () => togglePanel('inventory-panel'));
    document.getElementById('skills-btn').addEventListener('click', () => togglePanel('skills-panel'));
    document.getElementById('missions-btn').addEventListener('click', () => togglePanel('missions-panel'));

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.panel').style.display = 'none';
        });
    });

    document.querySelectorAll('.start-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const missionTitle = this.closest('.mission-item').querySelector('.mission-title span').textContent;
            startMission(missionTitle);
        });
    });
    
    updateHealthBar();
    updateGoldDisplay();
}

export function simulateGameProgress() {
    setInterval(() => {
        if (gameState.player.health > 0 && Math.random() > 0.8) {
            gameState.player.health = Math.max(0, gameState.player.health - 5);
            updateHealthBar();
            showNotification('You took 5 damage!');
            if (gameState.player.health <= 0) {
                document.getElementById('death-modal').style.display = 'block';
            }
        }
    }, 5000);

    setInterval(() => {
        if (Math.random() > 0.7) {
            const events = [
                'A sandstorm is approaching!',
                'Merchant arrived at the oasis.',
                'Goblins are gathering near the canyon.',
                'You found a rare mushroom!'
            ];
            showNotification(events[Math.floor(Math.random() * events.length)]);
        }
    }, 10000);
}
