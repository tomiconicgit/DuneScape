import * as THREE from 'three';

export default class Movement {
    constructor(characterMesh) {
        this.character = characterMesh;
        this.path = [];
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.moveSpeed = 5; // Slightly increased speed for travel
        this.marker = null;
        this.raycaster = new THREE.Raycaster();
    }
    
    // Joystick movement
    moveCharacter(direction, delta) { /* ... unchanged ... */ }

    // Click-to-move
    calculatePathOnTerrain(targetWorldPos, terrainMesh) { /* ... unchanged ... */ }

    /**
     * Sets the character to follow a pre-defined trail.
     * @param {THREE.Vector3[]} trailPoints - An array of points defining the path.
     * @param {THREE.Mesh} terrainMesh - The terrain to get correct Y-values from.
     */
    followTrail(trailPoints, terrainMesh) {
        this.path = [];
        const down = new THREE.Vector3(0, -1, 0);
        const characterHeight = this.character.geometry.parameters.height;

        for (const point of trailPoints) {
            this.raycaster.set(new THREE.Vector3(point.x, 50, point.z), down);
            const intersects = this.raycaster.intersectObject(terrainMesh);
            if (intersects.length > 0) {
                // Add the point with the correct terrain height
                this.path.push(intersects[0].point.clone().add(new THREE.Vector3(0, characterHeight / 2, 0)));
            }
        }
        
        if (this.path.length > 0) {
            this.currentPathIndex = 0;
            this.isMoving = true;
            if (this.marker && this.marker.parent) this.marker.parent.remove(this.marker);
        }
    }

    update(delta) { /* ... unchanged ... */ }

    _placeMarker(x, y, z) { /* ... unchanged ... */ }

    _findPath(start, goal) { /* ... unchanged ... */ }
}
