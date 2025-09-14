import * as THREE from 'three';

/**
 * Creates a see-through 100x100 grid with blue outlines.
 * @param {THREE.Scene} scene The scene to add the grid to.
 */
export function createEnvironmentGrid(scene) {
    const size = 100; // The total width and length of the grid
    const divisions = 100; // The number of tiles along each axis
    const gridColor = 0x0000ff; // A hex color for blue

    // GridHelper creates a grid of lines on the XZ plane.
    // We pass the same color twice to make all lines, including the center axes, blue.
    const gridHelper = new THREE.GridHelper(size, divisions, gridColor, gridColor);

    // Add the newly created grid object to our scene
    scene.add(gridHelper);
}
