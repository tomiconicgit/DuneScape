import * as THREE from 'three';
import MapTexture from '../environment/map/maptexture.js'; // Added import

/**
 * Handles grid-based movement for the character, including pathfinding and marker placement.
 */
const Movement = {
    character: null,
    scene: null,
    path: [],
    currentPathIndex: 0,
    moveSpeed: 2, // Units per second
    marker: null,
    raycaster: new THREE.Raycaster(),
    plane: null,
    isMoving: false,
    cameraSystem: null,
    buildMode: null, // Added for build mode

    /**
     * Initializes the movement system.
     * @param {THREE.Mesh} character - The character mesh.
     * @param {THREE.Scene} scene - The scene.
     * @param {Object} camera - The camera object with setOnTap.
     * @param {THREE.Mesh} plane - The invisible plane for raycasting.
     */
    init(character, scene, camera, plane) {
        this.character = character;
        this.scene = scene;
        this.cameraSystem = camera;
        this.plane = plane;
        this.cameraSystem.setOnTap((touch) => this.handleTap(touch));
    },

    setBuildMode(type) { // Added
        this.buildMode = type;
    },

    /**
     * Handles tap events to determine target position.
     * @param {Touch} touch - The touch event data.
     */
    handleTap(touch) {
        const mouse = new THREE.Vector2();
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(mouse, this.cameraSystem.camera);

        const intersects = this.raycaster.intersectObject(this.plane);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const targetGrid = this.getGridPos(point);
            if (this.buildMode) {
                MapTexture.apply(this.buildMode, targetGrid); // Added build mode logic
            } else {
                const targetPos = { x: targetGrid.x + 0.5, z: targetGrid.z + 0.5 };
                this.placeMarker(targetPos.x, 0.1, targetPos.z);
                this.calculatePath(targetGrid);
            }
        }
    },

    // ... (rest unchanged: placeMarker, calculatePath, update, getGridPos, findPath)
};

export default Movement;