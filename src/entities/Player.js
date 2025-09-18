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
        const jointMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9 });
        
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

        return playerGroup;
    }
    
    startMining(targetRock) {
        if (this.state !== states.IDLE) return;
        this.miningTarget = targetRock;
        const direction = this.mesh.position.clone().sub(targetRock.position).normalize();
        const destination = targetRock.position.clone().add(direction.multiplyScalar(2.0));
        this.moveTo(destination);
    }

    moveTo(targetPosition) {
        this.miningTarget = this.isMining ? this.miningTarget : null;
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
                    const neighborX = currentNode.x + dx;
                    const neighborZ = currentNode.z + dz;

                    if (neighborX < 0 || neighborX >= grid.length || neighborZ < 0 || neighborZ >= grid[0].length || grid[neighborX][neighborZ] === 1) {
                        continue;
                    }

                    if (closedSet.has(`${neighborX},${neighborZ}`)) continue;
                    
                    const gCost = currentNode.g + 1;
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
        const positions = this.pathLine.geometry.attributes.position.array;
        positions[0] = this.mesh.position.x;
        positions[1] = 0.1;
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
            if (this.miningTarget.userData.onMined) {
                this.miningTarget.userData.onMined();
            }
            this.miningTarget = null;
            this.state = states.IDLE;
        }
    }

    updateIdleAnimation() {
        const time = this.animationTimer * 2;
        this.rig.torso.position.y = 0.75 + Math.sin(time) * 0.03;
        this.rig.leftArm.group.rotation.x = Math.sin(time * 0.7) * 0.1;
        this.rig.rightArm.group.rotation.x = Math.sin(time * 0.7 + Math.PI) * 0.1;
        this.rig.head.rotation.y = Math.sin(time * 0.5) * 0.15;
    }

    updateWalkAnimation() {
        const time = this.animationTimer * 8;
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

        const time = this.miningTimer * 4;
        const swingAngle = -1.5 + (Math.sin(time) * 1.5);
        this.rig.rightArm.group.rotation.x = swingAngle;
        this.rig.leftArm.group.rotation.x = swingAngle * 0.8;
        
        const elbowBend = Math.max(0, Math.cos(time)) * -1.2;
        this.rig.rightArm.joint.rotation.x = elbowBend;
        this.rig.leftArm.joint.rotation.x = elbowBend;
        
        this.rig.torso.rotation.y = 0.2 + Math.sin(time) * -0.4;
    }
}
