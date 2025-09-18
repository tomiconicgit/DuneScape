// File: src/entities/Player.js
import * as THREE from 'three';

export default class Player {
    constructor(scene) {
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 12);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0.5, 0); // Start on the ground plane
        this.mesh.castShadow = true;
        scene.add(this.mesh);

        // Movement State
        this.path = [];
        this.speed = 4.0; // Units (tiles) per second
        this.tileSize = 1.0; // Each tile is 1x1 world units

        // Destination Marker
        const markerGeo = new THREE.RingGeometry(0.3, 0.4, 32);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        this.marker = new THREE.Mesh(markerGeo, markerMat);
        this.marker.rotation.x = -Math.PI / 2;
        this.marker.visible = false;
        scene.add(this.marker);
    }

    /**
     * Calculates a path and starts movement towards a world position.
     * @param {THREE.Vector3} targetPosition - The 3D point to move to.
     */
    moveTo(targetPosition) {
        const targetGridX = Math.round(targetPosition.x / this.tileSize);
        const targetGridZ = Math.round(targetPosition.z / this.tileSize);
        
        const startGridX = Math.round(this.mesh.position.x / this.tileSize);
        const startGridZ = Math.round(this.mesh.position.z / this.tileSize);

        // Place marker at the center of the target tile
        this.marker.position.set(targetGridX * this.tileSize, 0.1, targetGridZ * this.tileSize);
        this.marker.visible = true;

        // Simple pathfinding (A* would be needed for obstacles)
        this.path = this.calculatePath(startGridX, startGridZ, targetGridX, targetGridZ);
    }

    calculatePath(startX, startZ, endX, endZ) {
        const path = [];
        let currentX = startX;
        let currentZ = startZ;

        while (currentX !== endX || currentZ !== endZ) {
            const dx = Math.sign(endX - currentX);
            const dz = Math.sign(endZ - currentZ);

            currentX += dx;
            currentZ += dz;
            path.push(new THREE.Vector2(currentX, currentZ));
        }
        return path;
    }

    /**
     * This method is called every frame from the main game loop.
     * @param {number} deltaTime - The time since the last frame.
     */
    update(deltaTime) {
        if (this.path.length === 0) {
            // Hide marker when destination is reached
            if (this.marker.visible) this.marker.visible = false;
            return;
        }

        const nextTile = this.path[0];
        const targetPosition = new THREE.Vector3(
            nextTile.x * this.tileSize,
            this.mesh.position.y,
            nextTile.y * this.tileSize
        );

        const distance = this.mesh.position.distanceTo(targetPosition);
        
        // If close enough, snap to the tile and move to the next one in the path
        if (distance < 0.1) {
            this.mesh.position.copy(targetPosition);
            this.path.shift(); // Remove the completed tile from the path
            return;
        }

        // Move towards the next tile
        const direction = targetPosition.clone().sub(this.mesh.position).normalize();
        this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime));
        
        // Make the character face the direction it's moving
        this.mesh.lookAt(targetPosition.x, this.mesh.position.y, targetPosition.z);
    }
}
