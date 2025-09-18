// File: src/entities/Player.js
import * as THREE from 'three';

// Define states for the player's animation state machine
const states = {
    IDLE: 'idle',
    WALKING: 'walking',
    MINING: 'mining',
};

export default class Player {
    constructor(scene) {
        // Animation and State
        this.state = states.IDLE;
        this.animationTimer = 0;

        // Create the character rig and store references to its joints
        this.rig = {};
        this.mesh = this.createCharacterRig(); // this.mesh is now the main group for the rig
        
        this.mesh.position.set(50, 1.0, 102); 
        scene.add(this.mesh);

        // Movement properties from before
        this.path = [];
        this.speed = 4.0;
        this.tileSize = 1.0;

        // Mining properties from before
        this.miningTarget = null;
        this.miningTimer = 0;
        this.miningDuration = 4.0;

        // Path visualization objects
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

    createCharacterRig() {
        const playerGroup = new THREE.Group();

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x666688,
            roughness: 0.8,
            metalness: 0.1,
        });
        const jointMaterial = new THREE.MeshStandardMaterial({
            color: 0x444455,
            roughness: 0.9
        });
        
        // Torso
        const torsoGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
        const torso = new THREE.Mesh(torsoGeo, bodyMaterial);
        torso.position.y = 0.75;
        torso.castShadow = true;
        playerGroup.add(torso);
        this.rig.torso = torso;

        // Head
        const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const head = new THREE.Mesh(headGeo, bodyMaterial);
        head.position.y = 1.8; // Relative to torso
        torso.add(head);
        this.rig.head = head;
        
        // Helper function to create a limb
        const createLimb = (isArm, isRight) => {
            const group = new THREE.Group();
            const upperGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
            const upper = new THREE.Mesh(upperGeo, bodyMaterial);
            upper.castShadow = true;
            
            const lowerGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
            const lower = new THREE.Mesh(lowerGeo, bodyMaterial);
            lower.castShadow = true;

            const jointGeo = new THREE.SphereGeometry(0.15, 8, 8);
            const joint = new THREE.Mesh(jointGeo, jointMaterial);

            if (isArm) {
                upper.position.y = -0.4;
                joint.position.y = -0.35;
                lower.position.y = -0.3;
            } else { // Leg
                upper.position.y = -0.45;
                joint.position.y = -0.4;
                lower.position.y = -0.3;
            }
            
            group.add(upper);
            upper.add(joint);
            joint.add(lower);

            return { group, upper, joint, lower };
        };

        // Arms
        const rightArm = createLimb(true, true);
        rightArm.group.position.set(-0.65, 0.6, 0);
        torso.add(rightArm.group);
        this.rig.rightArm = { group: rightArm.group, joint: rightArm.joint };
        
        const leftArm = createLimb(true, false);
        leftArm.group.position.set(0.65, 0.6, 0);
        torso.add(leftArm.group);
        this.rig.leftArm = { group: leftArm.group, joint: leftArm.joint };

        // Legs
        const rightLeg = createLimb(false, true);
        rightLeg.group.position.set(-0.25, -0.75, 0);
        torso.add(rightLeg.group);
        this.rig.rightLeg = { group: rightLeg.group, joint: rightLeg.joint };
        
        const leftLeg = createLimb(false, false);
        leftLeg.group.position.set(0.25, -0.75, 0);
        torso.add(leftLeg.group);
        this.rig.leftLeg = { group: leftLeg.group, joint: leftLeg.joint };

        return playerGroup;
    }
    
    startMining(targetRock) {
        if (this.state !== states.IDLE) return;
        this.miningTarget = targetRock;
        const direction = this.mesh.position.clone().sub(targetRock.position).normalize();
        const destination = targetRock.position.clone().add(direction.multiplyScalar(2.0)); // Stand a bit further
        this.moveTo(destination);
    }

    moveTo(targetPosition) {
        this.miningTarget = this.isMining ? this.miningTarget : null;
        this.isMining = false;
        
        const targetGridX = Math.round(targetPosition.x / this.tileSize);
        const targetGridZ = Math.round(targetPosition.z / this.tileSize);
        const startGridX = Math.round(this.mesh.position.x / this.tileSize);
        const startGridZ = Math.round(this.mesh.position.z / this.tileSize);

        this.marker.position.set(targetGridX, targetPosition.y + 0.1, targetGridZ);
        this.marker.visible = true;

        this.path = this.calculatePath(startGridX, startGridZ, targetGridX, targetGridZ);
        
        if (this.path.length > 0) {
            this.state = states.WALKING;
            this.pathLine.visible = true;
            this.updatePathLine();
        } else {
            this.state = states.IDLE;
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
        // ... (this function remains the same)
    }

    update(deltaTime) {
        this.animationTimer += deltaTime;

        // --- STATE TRANSITIONS ---
        if (this.state === states.WALKING && this.path.length === 0) {
            this.state = this.miningTarget ? states.MINING : states.IDLE;
            this.miningTimer = 0; // Reset timer when mining starts
            this.marker.visible = false;
            this.pathLine.visible = false;
        }

        // --- ACTIONS BASED ON STATE ---
        if (this.state === states.WALKING) {
            this.updateMovement(deltaTime);
        }
        
        // --- ANIMATIONS BASED ON STATE ---
        switch (this.state) {
            case states.WALKING:
                this.updateWalkAnimation();
                break;
            case states.MINING:
                this.updateMineAnimation();
                this.updateMineTimer(deltaTime);
                break;
            default:
                this.updateIdleAnimation();
                break;
        }
    }
    
    updateMovement(deltaTime) {
        if (this.path.length === 0) return;

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
    }
    
    updateMineTimer(deltaTime) {
        this.miningTimer += deltaTime;
        if (this.miningTimer >= this.miningDuration) {
            if (this.miningTarget.userData.onMined) {
                this.miningTarget.userData.onMined();
            }
            this.miningTarget = null;
            this.state = states.IDLE; // Return to idle when done
        }
    }

    // --- Animation Implementations ---

    updateIdleAnimation() {
        const time = this.animationTimer * 2;
        this.rig.torso.position.y = 0.75 + Math.sin(time) * 0.03;
        this.rig.leftArm.group.rotation.x = Math.sin(time * 0.7) * 0.1;
        this.rig.rightArm.group.rotation.x = Math.sin(time * 0.7 + Math.PI) * 0.1;
        this.rig.head.rotation.y = Math.sin(time * 0.5) * 0.15;
    }

    updateWalkAnimation() {
        const time = this.animationTimer * 8; // Faster cycle for walking
        const swing = Math.sin(time) * 0.5;
        const kneeBend = Math.max(0, Math.sin(time + Math.PI / 2)) * 0.4;

        this.rig.leftLeg.group.rotation.x = swing;
        this.rig.rightLeg.group.rotation.x = -swing;
        this.rig.leftLeg.joint.rotation.x = -kneeBend;
        this.rig.rightLeg.joint.rotation.x = -kneeBend;

        this.rig.leftArm.group.rotation.x = -swing * 0.5;
        this.rig.rightArm.group.rotation.x = swing * 0.5;
        
        this.rig.torso.position.y = 0.75 + Math.sin(time * 2) * 0.05;
    }

    updateMineAnimation() {
        if (!this.miningTarget) return;
        this.mesh.lookAt(this.miningTarget.position);

        const time = this.miningTimer * 4; // Speed of the swing
        const swing = Math.sin(time);

        // A simple up-and-down "pickaxe" motion
        const swingAngle = -1.5 + (Math.sin(time) * 1.5);
        this.rig.rightArm.group.rotation.x = swingAngle;
        this.rig.leftArm.group.rotation.x = swingAngle * 0.8; // Left arm follows
        
        // Bend elbows on the up-swing
        const elbowBend = Math.max(0, Math.cos(time)) * -1.2;
        this.rig.rightArm.joint.rotation.x = elbowBend;
        this.rig.leftArm.joint.rotation.x = elbowBend;
        
        // Body leans into it
        this.rig.torso.rotation.y = 0.2 + Math.sin(time) * -0.4;
    }
}
