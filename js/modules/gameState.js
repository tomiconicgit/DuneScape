// js/modules/gameState.js
import * as THREE from 'three';

export const gameState = {
    initialized: false,
    player: {
        health: 80,
        maxHealth: 100,
        gold: 1250,
        mesh: null,
        body: null,
        animationManager: null // ✅ MODIFIED: Will hold the new animation manager
    },
    // ...
    minimapRenderer: null,
    enemies: [],
    resources: [], // ✅ NEW: To hold instanced meshes like trees/rocks
    clock: new THREE.Clock()
};
