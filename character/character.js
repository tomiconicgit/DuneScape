import * as THREE from 'three';

/**
 * Creates a simple character mesh, adds it to the scene, and returns it.
 * @param {THREE.Scene} scene The scene to add the character to.
 * @returns {THREE.Mesh} The created character mesh.
 */
export function createCharacter(scene) {
    // Define the character's dimensions to fit inside a 1x1 tile
    const characterWidth = 0.4;
    const characterHeight = 1.2;
    const characterDepth = 0.4;

    // Create the geometry (the shape)
    const geometry = new THREE.BoxGeometry(characterWidth, characterHeight, characterDepth);
    
    // Create the material (the appearance)
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White color
    
    // Combine geometry and material into a mesh
    const character = new THREE.Mesh(geometry, material);
    
    // The grid is on the XZ plane at y=0.
    // To make the character "stand" on the grid, we set its y position
    // to half of its height.
    character.position.set(0, characterHeight / 2, 0);
    
    // Add the character to the scene
    scene.add(character);
    
    // Return the character object so other parts of the engine can use it
    return character;
}