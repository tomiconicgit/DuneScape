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
        
        this.mesh.position.set(50, 0.9, 102); // Adjusted starting y-position for new rig
        scene.add(this.mesh);

        this.path = [];
        this.speed = 4.0;
        this.tileSize = 1.0;

        this.isMining = false;
        this.miningTarget = null;
        this.miningTimer = 0;
        this.miningDuration = 4.0;

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
        head.position.y = 1.85; // Raised slightly
        torso.add(head);
        this.rig.head = head;
        
        // Use CylinderGeometry for limbs instead of CapsuleGeometry
        const createLimb = (length, isArm) => {
            const group = new THREE.Group();
            const radius = isArm ? 0.15 : 0.18;
            
            // Upper limb using CylinderGeometry
            const upperGeo = new THREE.CylinderGeometry(radius, radius, length, 16);
            const upper = new THREE.Mesh(upperGeo, bodyMaterial);
            upper.castShadow = true;
            upper.position.y = -length / 2;
            
            // Lower limb using CylinderGeometry
            const lowerGeo = new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, length * 0.9, 16);
            const lower = new THREE.Mesh(lowerGeo, bodyMaterial);
            lower.castShadow = true;
            lower.position.y = -length * 0.9 / 2;

            // The joint is now the pivot point of the lower limb group
            const joint = new THREE.Group();
            joint.position.y = -length;
            
            group.add(upper);
            upper.add(joint);
            joint.add(lower);
            
            return { group, joint };
        };

        // Create and position limbs
        const armLength = 0.55;
        const legLength = 0.65;

        const rightArm = createLimb(armLength, true);
        rightArm.group.position.set(-0.65, 0.5, 0); // Positioned at shoulder
        torso.add(rightArm.group);
        this.rig.rightArm = { group: rightArm.group, joint: rightArm.joint };
        
        const leftArm = createLimb(armLength, true);
        leftArm.group.position.set(0.65, 0.5, 0);
        torso.add(leftArm.group);
        this.rig.leftArm = { group: leftArm.group, joint: leftArm.joint };

        const rightLeg = createLimb(legLength, false);
        rightLeg.group.position.set(-0.25, -0.75, 0); // Positioned at hip
        torso.add(rightLeg.group);
        this.rig.rightLeg = { group: rightLeg.group, joint: rightLeg.joint };
        
        const leftLeg = createLimb(legLength, false);
        leftLeg.group.position.set(0.25, -0.75, 0);
        torso.add(leftLeg.group);
        this.rig.leftLeg = { group: leftLeg.group, joint: leftLeg.joint };

        // Ensure all parts are on the correct layer for rendering
        playerGroup.traverse((child) => {
            if (child.isMesh) {
                child.layers.set(1);
            }
        });

        return playerGroup;
    }

    cancelActions() {
        this.miningTarget = null;
        this.isMining = false;
        this.miningTimer = 0;
    }
    
    startMining(targetRock) {
        this.miningTarget = targetRock;
        const direction = this.mesh.position.clone().sub(targetRock.position).normalize();
        const destination = targetRock.position.clone().add(direction.multiplyScalar(2.5)); // Increased distance slightly
        this.moveTo(destination);
    }

    moveTo(targetPosition) {
        this.isMining = false;
        
        const targetGridX = Math.round(targetPosition.x);
        const targetGridZ = Math.round(targetPosition.z);
        const startGridX = Math.round(this.mesh.position.x);
        const startGridZ = Math.round(this.mesh.position.z);

        this.marker.position.set(targetGridX, targetPosition.y + 0.1, targetGridZ);
        this.marker.visible = true;

        this.path = this.calculatePath(startGridX, startGridZ, targetGridX, targetGridZ);
        
        if (this.path.length > 0) {
            this.state = states.WALKING;
            this.pathLine.visible = true;
            this.updatePathLine();
        } else {
            this.state = states.IDLE;
            this.marker.visible = false;
        }
    }

    calculatePath(startX, startZ, endX, endZ) {
        const grid = this.game.grid;
        if (!grid) return [];

        const openSet = [];
        const closedSet = new Set();
        const startNode = { x: startX, z: startZ, g: 0, h: 0, f: 0, parent: null };
        const endNode = { x: endX, z: endZ };

        openSet.push(startNode);
        const getHeuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();

            if (currentNode.x === endNode.x && currentNode.z === endNode.z) {
                const path = [];
                let temp = currentNode;
                while (temp) {
                    path.push(new THREE.Vector2(temp.x, temp.z));
                    temp = temp.parent;
                }
                return path.reverse();
            }

            closedSet.add(`${currentNode.x},${currentNode.z}`);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dz === 0) continue;
                    // Allow diagonal movement
                    const neighborX = currentNode.x + dx;
                    const neighborZ = currentNode.z + dz;

                    if (neighborX < 0 || neighborX >= grid.length || neighborZ < 0 || neighborZ >= grid[0].length || grid[neighborX][neighborZ] === 1) {
                        continue;
                    }

                    if (closedSet.has(`${neighborX},${neighborZ}`)) continue;
                    
                    const gCost = currentNode.g + (dx !== 0 && dz !== 0 ? 1.414 : 1); // Diagonal cost
                    let neighbor = openSet.find(n => n.x === neighborX && n.z === neighborZ);

                    if (!neighbor || gCost < neighbor.g) {
                        if (!neighbor) {
                            neighbor = { x: neighborX, z: neighborZ };
                            openSet.push(neighbor);
                        }
                        neighbor.g = gCost;
                        neighbor.h = getHeuristic(neighbor, endNode);
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.parent = currentNode;
                    }
                }
            }
        }
        return [];
    }

    updatePathLine() {
        if (!this.marker.visible) return;
        const positions = this.pathLine.geometry.attributes.position.array;
        positions[0] = this.mesh.position.x;
        positions[1] = 0.1; // Draw from ground level
        positions[2] = this.mesh.position.z;
        positions[3] = this.marker.position.x;
        positions[4] = this.marker.position.y;
        positions[5] = this.marker.position.z;
        this.pathLine.geometry.attributes.position.needsUpdate = true;
        this.pathLine.computeLineDistances();
    }

    update(deltaTime) {
        this.animationTimer += deltaTime;

        if (this.state === states.WALKING && this.path.length === 0) {
            this.state = this.miningTarget ? states.MINING : states.IDLE;
            this.miningTimer = 0;
            this.marker.visible = false;
            this.pathLine.visible = false;
        }

        if (this.state === states.WALKING) {
            this.updateMovement(deltaTime);
        }
        
        switch (this.state) {
            case states.WALKING: this.updateWalkAnimation(); break;
            case states.MINING: this.updateMineAnimation(); this.updateMineTimer(deltaTime); break;
            default: this.updateIdleAnimation(); break;
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
            if (this.miningTarget && this.miningTarget.userData.onMined) {
                this.miningTarget.userData.onMined();
            }
            this.miningTarget = null;
            this.state = states.IDLE;
        }
    }

    // --- REALISTIC ANIMATIONS ---

    updateIdleAnimation() {
        const time = this.animationTimer * 1.5;
        // Gentle breathing bob
        this.rig.torso.position.y = 0.75 + Math.sin(time) * 0.02;
        
        // Asymmetrical arm drift
        this.rig.leftArm.group.rotation.x = Math.sin(time * 0.7) * 0.05;
        this.rig.rightArm.group.rotation.x = Math.sin(time * 0.7 + 0.5) * 0.05;
        
        // Subtle torso and head sway
        this.rig.torso.rotation.y = Math.sin(time * 0.5) * 0.05;
        this.rig.head.rotation.y = Math.sin(time * 0.4 - 0.3) * 0.1;

        // Reset any other rotations
        this.rig.leftLeg.group.rotation.x = 0;
        this.rig.rightLeg.group.rotation.x = 0;
        this.rig.torso.position.x = 0;
    }

    updateWalkAnimation() {
        const time = this.animationTimer * 8;
        const swingIntensity = 0.6;
        const stepHeight = 0.1;
        const torsoTwist = 0.2;
        const hipSway = 0.1;

        // Leg and arm swing
        const legSwing = Math.sin(time) * swingIntensity;
        this.rig.leftLeg.group.rotation.x = legSwing;
        this.rig.rightLeg.group.rotation.x = -legSwing;
        this.rig.leftArm.group.rotation.x = -legSwing * 0.8;
        this.rig.rightArm.group.rotation.x = legSwing * 0.8;
        
        // Knee bend
        const kneeBend = Math.max(0, Math.cos(time)) * -0.8;
        this.rig.leftLeg.joint.rotation.x = legSwing < 0 ? 0 : kneeBend;
        this.rig.rightLeg.joint.rotation.x = -legSwing < 0 ? 0 : kneeBend;

        // Body bob and sway
        this.rig.torso.position.y = 0.75 + (Math.cos(time * 2) * stepHeight) - stepHeight;
        this.rig.torso.position.x = Math.cos(time) * hipSway; // Weight shift
        
        // Counter-twist torso for balance
        this.rig.torso.rotation.y = Math.sin(time) * -torsoTwist;

        // Head stabilization
        this.rig.head.rotation.y = Math.sin(time) * torsoTwist;
    }

    updateMineAnimation() {
        if (!this.miningTarget) return;
        this.mesh.lookAt(this.miningTarget.position);

        const swingSpeed = 2.5;
        const time = this.miningTimer * swingSpeed;
        
        // Create a custom swing curve: slow backswing, fast downswing
        const swingProgress = Math.sin(time);
        // Use Math.pow to make the downswing faster (more negative values)
        const powerCurve = Math.sign(swingProgress) * Math.pow(Math.abs(swingProgress), 2.5);

        // Arm swing based on the power curve
        const armSwingAngle = 1.0 - powerCurve * 2.5;
        this.rig.rightArm.group.rotation.x = armSwingAngle;
        this.rig.leftArm.group.rotation.x = armSwingAngle * 0.9;
        
        // Elbow bend during backswing
        const elbowBend = Math.max(0, swingProgress) * -1.5;
        this.rig.rightArm.joint.rotation.x = elbowBend;
        this.rig.leftArm.joint.rotation.x = elbowBend;
        
        // Full body motion: torso twist and crouch
        const torsoTwist = 0.2 + swingProgress * -0.8;
        this.rig.torso.rotation.y = torsoTwist;
        this.rig.torso.position.y = 0.75 - Math.max(0, swingProgress) * 0.2; // Crouch on backswing
    }
}