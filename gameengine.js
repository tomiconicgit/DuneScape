import { createEnvironmentGrid } from './environment/gridmap.js'; // <-- PATH UPDATED
import { createCharacter } from './character/character.js';

/**
 * The main game engine director.
 * It initializes all game objects and sets up the world.
 * @param {THREE.Scene} scene The main scene object.
 */
export function startGameEngine(scene) {
    // This is the central point to build your game world.
    // As you add more features (enemies, items, UI),
    // you will call their creation functions from here.

    console.log("Game Engine: Initializing game world...");

    createEnvironmentGrid(scene);
    createCharacter(scene);

    console.log("Game Engine: World setup complete.");
}
