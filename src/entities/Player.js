// File: src/entities/Player.js
import * as THREE from 'three';

export default class Player {
    constructor(scene, landscape) { // ✨ ADDED: landscape parameter
        this.landscape = landscape; // ✨ ADDED: Store reference to landscape
        this.raycaster = new THREE.Raycaster(); // ✨ ADDED: Raycaster for terrain following

        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 12);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // ✨ CHANGED: Player now starts on the quarry floor. Y is -9 (-10 depth + 1 player height).
        this.mesh.position.set(50, -9.0, 50); 
        
        this.mesh.castShadow = true;
        scene.add(this.mesh);

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

        // ✨ CHANGED: Place marker at the correct height (Y) of the clicked terrain point.
        this.marker.position.set(targetGridX * this.tileSize, targetPosition.y + 0.1, targetGridZ * this.tileSize);
        this.marker.visible = true;

        this.path = this.calculatePath(startGridX, startGridZ, targetGridX, targetGridZ);
        
        if (this.path.length > 0) {
            this.pathLine.visible = true;
            this.updatePathLine();
        }
    }

    calculatePath(startX, startZ, endX, endZ) {
        // ... (this function remains the same)
    }

    updatePathLine() {
        const positions = this.pathLine.geometry.attributes.position.array;
        // The path line should sit on the ground, so we subtract the player's height offset (1.0)
        positions[0] = this.mesh.position.x;
        positions[1] = this.mesh.position.y - 1.0 + 0.1; 
        positions[2] = this.mesh.position.z;
        positions[3] = this.marker.position.x;
        positions[4] = this.marker.position.y;
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
            this.mesh.position.y, // We'll update Y separately using a raycast
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
        
        // ✨ ADDED: Raycast down to stick the player to the ground
        const down = new THREE.Vector3(0, -1, 0);
        this.raycaster.set(this.mesh.position, down);
        const intersects = this.raycaster.intersectObject(this.landscape.mesh);
        if (intersects.length > 0) {
            // Set player Y position to the ground height + 1.0 (for player height)
            this.mesh.position.y = intersects[0].point.y + 1.0;
        }
        
        this.updatePathLine();
    }
}
