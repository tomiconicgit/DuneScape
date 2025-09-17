import * as THREE from 'three';

export default class Movement {
    constructor(characterMesh) {
        this.character = characterMesh;
        this.path = [];
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.moveSpeed = 3; // Speed for both pathfinding and joystick
        this.marker = null;
        this.raycaster = new THREE.Raycaster();
    }
    
    /**
     * Handles direct, continuous movement from a joystick.
     * @param {THREE.Vector3} direction - The normalized direction of movement.
     * @param {number} delta - The time since the last frame.
     */
    moveCharacter(direction, delta) {
        // Stop any click-based pathfinding if the joystick is moved
        if (this.isMoving) {
            this.isMoving = false;
            this.path = [];
            if (this.marker && this.marker.parent) this.marker.parent.remove(this.marker);
        }
        
        const moveDistance = this.moveSpeed * delta;
        this.character.position.addScaledVector(direction, moveDistance);
    }

    /**
     * Calculates a path on a 3D terrain mesh for click-to-move.
     * @param {THREE.Vector3} targetWorldPos - The 3D point clicked on the terrain.
     * @param {THREE.Mesh} terrainMesh - The terrain to pathfind on.
     */
    calculatePathOnTerrain(targetWorldPos, terrainMesh) {
        const startPos = { x: this.character.position.x, z: this.character.position.z };
        const endPos = { x: targetWorldPos.x, z: targetWorldPos.z };
        const flatPath = this._findPath(startPos, endPos);

        if (flatPath.length === 0) return;

        const finalPath = [];
        const down = new THREE.Vector3(0, -1, 0);

        for (const point of flatPath) {
            this.raycaster.set(new THREE.Vector3(point.x, 50, point.z), down);
            const intersects = this.raycaster.intersectObject(terrainMesh);
            if (intersects.length > 0) {
                finalPath.push(intersects[0].point);
            }
        }

        this.path = finalPath.map(p => new THREE.Vector3(p.x, p.y + this.character.geometry.parameters.height / 2, p.z));
        this.currentPathIndex = 0;
        this.isMoving = true;
        this._placeMarker(targetWorldPos.x, targetWorldPos.y + 0.05, targetWorldPos.z);
    }

    /**
     * Main update loop, only handles click-based path movement.
     * @param {number} delta - The time since the last frame.
     */
    update(delta) {
        if (!this.isMoving) return;

        const target = this.path[this.currentPathIndex];
        const direction = new THREE.Vector3().subVectors(target, this.character.position);
        
        const flatDistance = new THREE.Vector2(direction.x, direction.z).length();

        if (flatDistance < 0.1) {
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.path.length) {
                this.isMoving = false;
                this.path = [];
                if (this.marker && this.marker.parent) this.marker.parent.remove(this.marker);
            }
            return;
        }

        direction.normalize();
        const moveDist = Math.min(this.moveSpeed * delta, flatDistance);
        this.character.position.add(direction.multiplyScalar(moveDist));
    }

    _placeMarker(x, y, z) {
        if (!this.marker) {
            const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.marker = new THREE.Mesh(geometry, material);
        }
        this.marker.position.set(x, y, z);
        this.character.parent.add(this.marker);
    }
    
    // Simple straight-line path generator
    _findPath(start, goal) {
        const path = [];
        const distance = Math.hypot(goal.x - start.x, goal.z - start.z);
        const segments = Math.ceil(distance / 0.5); // Waypoint every 0.5 units

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            path.push({
                x: (1 - t) * start.x + t * goal.x,
                z: (1 - t) * start.z + t * goal.z
            });
        }
        return path;
    }
}
