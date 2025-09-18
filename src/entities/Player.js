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

        this.path = [];
        this.speed = 4.0;
        this.tileSize = 1.0;

        // ✨ ADDED: State management for the mining action
        this.isMining = false;
        this.miningTarget = null;
        this.miningTimer = 0;
        this.miningDuration = 4.0; // 4 seconds

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
    
    // ✨ ADDED: New method to initiate the mining action
    startMining(targetRock) {
        // Can't start a new action if already busy
        if (this.path.length > 0 || this.isMining) return;
        
        this.miningTarget = targetRock;
        
        // Find a spot 1.5 units away from the rock to stand on
        const direction = this.mesh.position.clone().sub(targetRock.position).normalize();
        const destination = targetRock.position.clone().add(direction.multiplyScalar(1.5));
        
        this.moveTo(destination);
    }

    moveTo(targetPosition) {
        // Reset mining state if we start walking
        this.isMining = false;
        this.miningTarget = null;
        this.miningTimer = 0;

        const targetGridX = Math.round(targetPosition.x / this.tileSize);
        const targetGridZ = Math.round(targetPosition.z / this.tileSize);
        const startGridX = Math.round(this.mesh.position.x / this.tileSize);
        const startGridZ = Math.round(this.mesh.position.z / this.tileSize);

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
        // ... (this function remains the same)
    }

    update(deltaTime) {
        // ✨ CHANGED: The update loop is now a state machine
        
        // State 1: Mining
        if (this.isMining) {
            // Face the rock
            this.mesh.lookAt(this.miningTarget.position);
            
            this.miningTimer += deltaTime;
            if (this.miningTimer >= this.miningDuration) {
                // Mining is complete, call the rock's callback
                if (this.miningTarget.userData.onMined) {
                    this.miningTarget.userData.onMined();
                }
                
                // Reset state to idle
                this.isMining = false;
                this.miningTarget = null;
                this.miningTimer = 0;
            }
            return; // Don't do anything else while mining
        }
        
        // State 2: Walking
        if (this.path.length > 0) {
            const nextTile = this.path[0];
            const targetPosition = new THREE.Vector3(nextTile.x, this.mesh.position.y, nextTile.y);
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
            
            // If the path is now empty, check if we arrived at a mining target
            if (this.path.length === 0 && this.miningTarget) {
                this.isMining = true;
                this.marker.visible = false;
                this.pathLine.visible = false;
            }
            return;
        }

        // State 3: Idle
        if (this.marker.visible) {
            this.marker.visible = false;
            this.pathLine.visible = false;
        }
    }
}
