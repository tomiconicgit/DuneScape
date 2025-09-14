import * as THREE from 'three';

/**
 * Creates a see-through 100x100 grid with blue outlines and an invisible plane for raycasting.
 * @param {THREE.Scene} scene The scene to add the grid and plane to.
 * @returns {THREE.Mesh} The invisible plane.
 */
export function createEnvironmentGrid(scene) {
    const size = 100; // The total width and length of the grid
    const divisions = 100; // The number of tiles along each axis
    const gridColor = 0x0000ff; // A hex color for blue

    // GridHelper creates a grid of lines on the XZ plane.
    const gridHelper = new THREE.GridHelper(size, divisions, gridColor, gridColor);

    // Add the newly created grid object to our scene
    scene.add(gridHelper);

    // Invisible plane for raycasting
    const planeGeometry = new THREE.PlaneGeometry(size, size);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2; // Lay flat on XZ plane
    scene.add(plane);

    return plane;
}