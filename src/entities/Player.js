// File: src/entities/Player.js
import * as THREE from 'three';

const states = {
    IDLE: 'idle',
    WALKING: 'walking',
    MINING: 'mining',
};

export default class Player {
    constructor(scene, game) {
        // ... rest of constructor remains the same
    }

    createCharacterRig() {
        const playerGroup = new THREE.Group();
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.8, metalness: 0.1 });
        
        // Torso
        const torsoGeo = new THREE.BoxGeometry(1, 1.5, 0.6);
        const torso = new THREE.Mesh(torsoGeo, bodyMaterial);
        torso.position.y = 0.75;
        torso.castShadow = true;
        playerGroup.add(torso);
        this.rig.torso = torso;

        // Head
        const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const head = new THREE.Mesh(headGeo, bodyMaterial);
        head.position.y = 1.85;
        torso.add(head);
        this.rig.head = head;
        
        // Use standard geometries for limbs instead of CapsuleGeometry
        const createLimb = (length, isArm) => {
            const group = new THREE.Group();
            const radius = isArm ? 0.15 : 0.18;
            
            // Use CylinderGeometry instead of CapsuleGeometry
            const upperGeo = new THREE.CylinderGeometry(radius, radius, length, 16);
            const upper = new THREE.Mesh(upperGeo, bodyMaterial);
            upper.castShadow = true;
            upper.position.y = -length / 2;
            
            const lowerGeo = new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, length * 0.9, 16);
            const lower = new THREE.Mesh(lowerGeo, bodyMaterial);
            lower.castShadow = true;
            lower.position.y = -length * 0.9 / 2;

            const joint = new THREE.Group();
            joint.position.y = -length;
            
            group.add(upper);
            upper.add(joint);
            joint.add(lower);
            
            return { group, joint };
        };

        // ... rest of the method remains the same
    }

    // ... rest of the class remains the same
}