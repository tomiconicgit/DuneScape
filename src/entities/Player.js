// File: src/entities/Player.js
import * as THREE from 'three';

const states = {
    IDLE: 'idle',
    WALKING: 'walking',
    MINING: 'mining',
};

export default class Player {
    constructor(scene, game) {
        this.game = game;
        this.state = states.IDLE;
        this.animationTimer = 0;

        this.rig = {};
        this.mesh = this.createCharacterRig();
        
        this.mesh.position.set(50, 1.0, 102); 
        scene.add(this.mesh);

        this.path = [];
        this.speed = 4.0;
        this.tileSize = 1.0;

        this.isMining = false;
        this.miningTarget = null;
        this.miningTimer = 0;
        this.miningDuration = 4.0;

        // ... (rest of constructor is unchanged)
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
        
        const torsoGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
        const torso = new THREE.Mesh(torsoGeo, bodyMaterial);
        torso.position.y = 0.75;
        torso.castShadow = true;
        playerGroup.add(torso);
        this.rig.torso = torso;

        const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const head = new THREE.Mesh(headGeo, bodyMaterial);
        head.position.y = 1.8;
        torso.add(head);
        this.rig.head = head;
        
        const createLimb = (isArm) => {
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
            } else {
                upper.position.y = -0.45;
                joint.position.y = -0.4;
                lower.position.y = -0.3;
            }
            
            group.add(upper);
            upper.add(joint);
            joint.add(lower);
            return { group, joint };
        };

        const rightArm = createLimb(true);
        rightArm.group.position.set(-0.65, 0.6, 0);
        torso.add(rightArm.group);
        this.rig.rightArm = { group: rightArm.group, joint: rightArm.joint };
        
        const leftArm = createLimb(true);
        leftArm.group.position.set(0.65, 0.6, 0);
        torso.add(leftArm.group);
        this.rig.leftArm = { group: leftArm.group, joint: leftArm.joint };

        const rightLeg = createLimb(false);
        rightLeg.group.position.set(-0.25, -0.75, 0);
        torso.add(rightLeg.group);
        this.rig.rightLeg = { group: rightLeg.group, joint: rightLeg.joint };
        
        const leftLeg = createLimb(false);
        leftLeg.group.position.set(0.25, -0.75, 0);
        torso.add(leftLeg.group);
        this.rig.leftLeg = { group: leftLeg.group, joint: leftLeg.joint };

        // ✨ FIX: Recursively set all parts of the player model to Layer 1.
        playerGroup.traverse((child) => {
            if (child.isMesh) {
                child.layers.set(1);
            }
        });

        return playerGroup;
    }
    
    startMining(targetRock) {
        // ... (this function is unchanged)
    }

    moveTo(targetPosition) {
        // ... (this function is unchanged)
    }

    calculatePath(startX, startZ, endX, endZ) {
        // ... (this function is unchanged)
    }

    updatePathLine() {
        // ... (this function is unchanged)
    }

    update(deltaTime) {
        // ... (this function is unchanged)
    }
    
    updateMovement(deltaTime) {
        // ... (this function is unchanged)
    }
    
    updateMineTimer(deltaTime) {
        // ... (this function is unchanged)
    }

    updateIdleAnimation() {
        // ... (this function is unchanged)
    }

    updateWalkAnimation() {
        // ... (this function is unchanged)
    }

    updateMineAnimation() {
        // ... (this function is unchanged)
    }
}
