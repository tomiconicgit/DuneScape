import * as THREE from 'three';

export default class Movement {
    constructor(characterMesh) {
        this.character = characterMesh;
        this.path = [];
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.moveSpeed = 2;
        this.marker = null;
        this.raycaster = new THREE.Raycaster();
    }

    /**
     * Calculates a path on a 3D terrain mesh.
     * @param {THREE.Vector3} targetWorldPos - The 3D point clicked on the terrain.
     * @param {THREE.Mesh} terrainMesh - The terrain to pathfind on.
     */
    calculatePathOnTerrain(targetWorldPos, terrainMesh) {
        // Pathfinding in 2D (x, z) remains the same
        const startPos = { x: this.character.position.x, z: this.character.position.z };
        const endPos = { x: targetWorldPos.x, z: targetWorldPos.z };
        const flatPath = this._findPath(startPos, endPos);

        if (flatPath.length === 0) return;

        // Now, find the correct Y for each point in the path
        const finalPath = [];
        const down = new THREE.Vector3(0, -1, 0);

        for (const point of flatPath) {
            this.raycaster.set(new THREE.Vector3(point.x, 50, point.z), down); // Raycast from high up
            const intersects = this.raycaster.intersectObject(terrainMesh);
            if (intersects.length > 0) {
                // Add the 3D point with the correct height
                finalPath.push(intersects[0].point);
            }
        }

        // Adjust character height for path
        this.path = finalPath.map(p => new THREE.Vector3(p.x, p.y + this.character.geometry.parameters.height / 2, p.z));
        this.currentPathIndex = 0;
        this.isMoving = true;
        this._placeMarker(targetWorldPos.x, targetWorldPos.y + 0.05, targetWorldPos.z);
    }

    update(delta) {
        if (!this.isMoving) return;

        const target = this.path[this.currentPathIndex];
        const direction = new THREE.Vector3().subVectors(target, this.character.position);
        
        // Only consider horizontal distance for path progression
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
    
    // A* Pathfinding (simplified for non-grid)
    _findPath(start, goal) {
        // For a non-grid world, A* is very complex. We'll use a simple straight line path.
        // You could later implement a more advanced pathfinder using a navigation mesh.
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
