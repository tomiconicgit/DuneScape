// js/modules/gameState.js
import * as THREE from 'three';

export const gameState = {
    initialized: false,
    player: {
        health: 80,
        maxHealth: 100,
        gold: 1250,
        mesh: null,
        body: null
    },
    skills: {
        combat: { level: 5, xp: 45 },
        woodcutting: { level: 3, xp: 70 },
        mining: { level: 2, xp: 30 },
        fishing: { level: 4, xp: 20 }
    },
    inventory: ['wood', 'ore', 'shield', 'ring', 'hat', 'rune', 'fish', 'potion'],
    currentMission: null,
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    controls: null,
    physicsWorld: null,
    minimapCamera: null,
    minimapRenderer: null,
    enemies: [],
    clock: new THREE.Clock()
};
