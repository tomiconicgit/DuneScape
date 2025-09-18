// File: src/entities/Player.js
import * as THREE from 'three';

export default class Player {
    constructor(scene) {
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 12);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.mesh.position.set(50, 1.0, 102); 
        
        this.mesh.castShadow = true;
        scene.add(this.mesh);

        // ✨ FIX: Restored to original, stable state
        this.path = [];
        this.speed = 4.0;
        this.tileSize = 1.0;

        const xMarkerGeo = new THREE.BufferGeometry();
        const markerSize = 0.75;
        const xMarkerPoints = [
            new THREE.Vector3(-markerSize, 0, -markerSize), new THREE.Vector3(markerSize, 0, markerSize),
            new THREE.Vector3(markerSize, 0, -markerSize), new THREE.Vector3(-markerSize, 0, markerSize)
        ];
        xMarkerGeo.setFromPoints(xMarkerPoints);
        const xMarkerMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
        this.marker = new THREE.LineSegments(xMarkerGeo, xMarkerMat);
        this.marker.visible = false;
        scene.add(this.marker);
        
        const pathLineGeo = new THREE.BufferGeometry();
        pathLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
        const pathLineMat = new THREE.LineDashedMaterial({ color: 0xff0000, dashSize: 0.2, gapSize: 0.1 });
        this.pathLine = new THREE.Line(pathLineGeo, pathLineMat);
        this.pathLine.visible = false;
        scene.add(this.pathLine);
    }

    moveTo(targetPosition) {
        const targetGridX = Math.round(targetPosition.x / this.tileSize);
        const targetGridZ = Math.round(targetPosition.z / this.tileSize);
        
        const startGridX = Math.round(this.mesh.position.x / this.tileSize);
        const startGridZ = Math.round(this.mesh.position.z / this.tileSize);

        // Place marker at the Y-level of the terrain that was clicked
        this.marker.position.set(targetGridX * this.tileSize, targetPosition.y + 0.1, targetGridZ * this.tileSize);
        this.marker.visible = true;

        this.path = this.calculatePath(startGridX, startGridZ, targetGridX, targetGridZ);
        
        if (this.path.length > 0) {
            this.pathLine.visible = true;
            this.updatePathLine();
        }
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

    updatePathLine() {
        const positions = this.pathLine.geometry.attributes.position.array;
        positions[0] = this.mesh.position.x;
        positions[1] = this.mesh.position.y - 1.0 + 0.1; // Place line at player's feet
        positions[2] = this.mesh.position.z;
        positions[3] = this.marker.position.x;
        positions[4] = this.marker.position.y; // Draw line to marker's height
        positions[5] = this.marker.position.z;

        this.pathLine.geometry.attributes.position.needsUpdate = true;
        this.pathLine.computeLineDistances();
    }

    update(deltaTime) {
        if (this.path.length === 0) {
            if (this.marker.visible) {
                this.marker.visible = false;
                this.pathLine.visible = false;
            }
            return;
        }

        const nextTile = this.path[0];
        const targetPosition = new THREE.Vector3(
            nextTile.x * this.tileSize,
            this.mesh.position.y, // Keep Y constant for simple flat-ground movement
            nextTile.y * this.tileSize
        );

        const distance = this.mesh.position.clone().setY(0).distanceTo(targetPosition.clone().setY(0));
        
        if (distance < 0.1) {
            this.mesh.position.x = targetPosition.x;
            this.mesh.position.z = targetPosition.z;
            this.path.shift();
        } else {
             const direction = targetPosition.clone().sub(this.mesh.position).normalize();
             this.mesh.position.add(direction.multiplyScalar(this.speed * deltaTime));
             this.mesh.lookAt(new THREE.Vector3(targetPosition.x, this.mesh.position.y, targetPosition.z));
        }
        
        this.updatePathLine();
    }
}
