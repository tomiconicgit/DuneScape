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

    this.mesh.position.set(50, 0.9, 102); // world position
    scene.add(this.mesh);

    this.path = [];
    this.speed = 4.0;
    this.tileSize = 1.0;

    this.isMining = false;
    this.miningTarget = null;
    this.miningTimer = 0;
    this.miningDuration = 4.0;

    // Customisation defaults (used by DeveloperBar)
    this.idleBreathAmp = 0.02;

    // Marker & path visuals
    const xMarkerGeo = new THREE.BufferGeometry();
    const markerSize = 0.75;
    const xMarkerPoints = [
      new THREE.Vector3(-markerSize, 0, -markerSize), new THREE.Vector3(markerSize, 0,  markerSize),
      new THREE.Vector3( markerSize, 0, -markerSize), new THREE.Vector3(-markerSize, 0,  markerSize)
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

  // --- Build a Mixamo-like bone hierarchy and attach simple geometry to bones ---
  createCharacterRig() {
    const root = new THREE.Group();
    root.name = 'playerRoot';

    // shared material
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.8, metalness: 0.1 });
    this.bodyMaterial = bodyMaterial;

    const makeBone = (name, pos = new THREE.Vector3()) => {
      const b = new THREE.Bone();
      b.name = name;
      b.position.copy(pos);
      return b;
    };

    // HIPS (root of skeleton)
    const hips = makeBone('mixamorig1Hips', new THREE.Vector3(0, 0.75, 0));
    root.add(hips);
    this.rig.hips = hips;

    // SPINE chain
    const spine  = makeBone('mixamorig1Spine',  new THREE.Vector3(0, 0.25, 0));
    const spine1 = makeBone('mixamorig1Spine1', new THREE.Vector3(0, 0.25, 0));
    const spine2 = makeBone('mixamorig1Spine2', new THREE.Vector3(0, 0.22, 0)); // ✅ fixed
    const neck   = makeBone('mixamorig1Neck',   new THREE.Vector3(0, 0.18, 0));
    const head   = makeBone('mixamorig1Head',   new THREE.Vector3(0, 0.2,  0));

    hips.add(spine);
    spine.add(spine1);
    spine1.add(spine2);
    spine2.add(neck);
    neck.add(head);

    this.rig.spine = spine;
    this.rig.spine1 = spine1;
    this.rig.spine2 = spine2;
    this.rig.neck = neck;
    this.rig.head = head;

    // LEFT ARM chain
    const leftShoulder = makeBone('mixamorig1LeftShoulder', new THREE.Vector3( 0.35, 0.18, 0));
    const leftArm      = makeBone('mixamorig1LeftArm',      new THREE.Vector3( 0.00,-0.18, 0));
    const leftForeArm  = makeBone('mixamorig1LeftForeArm',  new THREE.Vector3( 0.00,-0.28, 0));
    const leftHand     = makeBone('mixamorig1LeftHand',     new THREE.Vector3( 0.00,-0.16, 0));

    spine2.add(leftShoulder);
    leftShoulder.add(leftArm);
    leftArm.add(leftForeArm);
    leftForeArm.add(leftHand);

    this.rig.leftShoulder = leftShoulder;
    this.rig.leftArm = leftArm;
    this.rig.leftForeArm = leftForeArm;
    this.rig.leftHand = leftHand;

    // RIGHT ARM chain
    const rightShoulder = makeBone('mixamorig1RightShoulder', new THREE.Vector3(-0.35, 0.18, 0));
    const rightArm      = makeBone('mixamorig1RightArm',      new THREE.Vector3( 0.00,-0.18, 0));
    const rightForeArm  = makeBone('mixamorig1RightForeArm',  new THREE.Vector3( 0.00,-0.28, 0));
    const rightHand     = makeBone('mixamorig1RightHand',     new THREE.Vector3( 0.00,-0.16, 0));

    spine2.add(rightShoulder);
    rightShoulder.add(rightArm);
    rightArm.add(rightForeArm);
    rightForeArm.add(rightHand);

    this.rig.rightShoulder = rightShoulder;
    this.rig.rightArm = rightArm;
    this.rig.rightForeArm = rightForeArm;
    this.rig.rightHand = rightHand;

    // LEFT LEG chain
    const leftUpLeg = makeBone('mixamorig1LeftUpLeg', new THREE.Vector3( 0.22,-0.4, 0));
    const leftLeg   = makeBone('mixamorig1LeftLeg',   new THREE.Vector3( 0.00,-0.36,0));
    const leftFoot  = makeBone('mixamorig1LeftFoot',  new THREE.Vector3( 0.00,-0.18,0));

    hips.add(leftUpLeg);
    leftUpLeg.add(leftLeg);
    leftLeg.add(leftFoot);

    this.rig.leftUpLeg = leftUpLeg;
    this.rig.leftLeg = leftLeg;
    this.rig.leftFoot = leftFoot;

    // RIGHT LEG chain
    const rightUpLeg = makeBone('mixamorig1RightUpLeg', new THREE.Vector3(-0.22,-0.4, 0));
    const rightLeg   = makeBone('mixamorig1RightLeg',   new THREE.Vector3( 0.00,-0.36,0));
    const rightFoot  = makeBone('mixamorig1RightFoot',  new THREE.Vector3( 0.00,-0.18,0));

    hips.add(rightUpLeg);
    rightUpLeg.add(rightLeg);
    rightLeg.add(rightFoot);

    this.rig.rightUpLeg = rightUpLeg;
    this.rig.rightLeg = rightLeg;
    this.rig.rightFoot = rightFoot;

    // Torso mesh
    const torsoGeo = new THREE.BoxGeometry(1, 1.5, 0.6);
    const torsoMesh = new THREE.Mesh(torsoGeo, bodyMaterial);
    torsoMesh.position.set(0, 0.75, 0);
    hips.add(torsoMesh);
    this.rig.torsoMesh = torsoMesh;

    // Head mesh
    const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const headMesh = new THREE.Mesh(headGeo, bodyMaterial);
    headMesh.position.set(0, 0.2, 0);
    head.add(headMesh);
    this.rig.headMesh = headMesh;

    // Limbs: cylinders
    const makeLimbMesh = (isArm = true) => {
      const radius = isArm ? 0.15 : 0.18;
      const length = isArm ? 0.55 : 0.65;
      const geo = new THREE.CylinderGeometry(radius, radius, length, 16);
      geo.translate(0, -length / 2, 0); // pivot at top
      return new THREE.Mesh(geo, bodyMaterial);
    };

    // attach to bones
    const LUpperArm = makeLimbMesh(true);  this.rig.leftArm.add(LUpperArm);
    const LLowerArm = makeLimbMesh(true);  this.rig.leftForeArm.add(LLowerArm);
    const RUpperArm = makeLimbMesh(true);  this.rig.rightArm.add(RUpperArm);
    const RLowerArm = makeLimbMesh(true);  this.rig.rightForeArm.add(RLowerArm);
    const LUpperLeg = makeLimbMesh(false); this.rig.leftUpLeg.add(LUpperLeg);
    const LLowerLeg = makeLimbMesh(false); this.rig.leftLeg.add(LLowerLeg);
    const RUpperLeg = makeLimbMesh(false); this.rig.rightUpLeg.add(RUpperLeg);
    const RLowerLeg = makeLimbMesh(false); this.rig.rightLeg.add(RLowerLeg);

    // Feet boxes
    const footGeo = new THREE.BoxGeometry(0.28, 0.08, 0.45);
    const footL = new THREE.Mesh(footGeo, bodyMaterial);
    footL.position.set(0, -0.18, 0.08);
    this.rig.leftFoot.add(footL);

    const footR = new THREE.Mesh(footGeo, bodyMaterial);
    footR.position.set(0, -0.18, 0.08);
    this.rig.rightFoot.add(footR);

    // Shadows + layer
    root.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.layers.set(1);
      }
    });

    return root;
  }

  cancelActions() {
    this.miningTarget = null;
    this.isMining = false;
    this.miningTimer = 0;
  }

  startMining(targetRock) {
    this.miningTarget = targetRock;
    const direction = this.mesh.position.clone().sub(targetRock.position).normalize();
    const destination = targetRock.position.clone().add(direction.multiplyScalar(2.5));
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
          const nx = currentNode.x + dx;
          const nz = currentNode.z + dz;

          if (nx < 0 || nx >= grid.length || nz < 0 || nz >= grid[0].length || grid[nx][nz] === 1) continue;
          if (closedSet.has(`${nx},${nz}`)) continue;

          const gCost = currentNode.g + (dx !== 0 && dz !== 0 ? 1.414 : 1);
          let neighbor = openSet.find(n => n.x === nx && n.z === nz);

          if (!neighbor || gCost < neighbor.g) {
            if (!neighbor) {
              neighbor = { x: nx, z: nz };
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
      case states.MINING:  this.updateMineAnimation(); this.updateMineTimer(deltaTime); break;
      default:             this.updateIdleAnimation(); break;
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

  // --- Animations ---
  updateIdleAnimation() {
    const t = this.animationTimer * 1.2;

    // Gentle breathing (slider-controlled)
    this.rig.hips.position.y = 0.75 + Math.sin(t * 0.7) * this.idleBreathAmp;
    this.rig.spine.rotation.x = Math.sin(t * 0.5) * 0.02;

    // Slight asymmetrical arm drift
    this.rig.leftShoulder.rotation.z  = Math.sin(t * 0.6)      * 0.06;
    this.rig.rightShoulder.rotation.z = Math.sin(t * 0.6 + 0.9) * 0.05;
    this.rig.leftArm.rotation.x       = Math.sin(t * 0.6 + 0.4) * 0.03;
    this.rig.rightArm.rotation.x      = Math.sin(t * 0.6 - 0.2) * 0.03;

    // head subtle look-around
    this.rig.neck.rotation.y = Math.sin(t * 0.35) * 0.08;
    this.rig.head.rotation.y = Math.sin(t * 0.25 - 0.3) * 0.06;

    // legs rest pose slight sway
    this.rig.leftUpLeg.rotation.x  = Math.sin(t * 0.5) * 0.02;
    this.rig.rightUpLeg.rotation.x = Math.sin(t * 0.5 + Math.PI) * 0.02;
  }

  updateWalkAnimation() {
    const speedFactor = 1.4; // cadence
    const t = this.animationTimer * 6 * speedFactor;

    const stepArc = 0.9;
    const stepLift = 0.18;
    const hipSway = 0.12;
    const torsoTwist = 0.18;

    const leftPhase = Math.sin(t);
    const rightPhase = Math.sin(t + Math.PI);

    this.rig.hips.position.y = 0.75 + Math.abs(Math.cos(t)) * -0.02; // slight bob
    this.rig.hips.position.x = Math.cos(t) * hipSway * 0.2;

    this.rig.leftUpLeg.rotation.x  = THREE.MathUtils.clamp(leftPhase  * stepArc, -1.2, 1.2);
    this.rig.rightUpLeg.rotation.x = THREE.MathUtils.clamp(rightPhase * stepArc, -1.2, 1.2);

    this.rig.leftLeg.rotation.x  = Math.max(0, -leftPhase)  * 0.9;
    this.rig.rightLeg.rotation.x = Math.max(0, -rightPhase) * 0.9;

    this.rig.leftFoot.position.y  = (Math.max(0, leftPhase)  * -stepLift) / 3;
    this.rig.rightFoot.position.y = (Math.max(0, rightPhase) * -stepLift) / 3;

    const armSwing = 0.9;
    this.rig.leftArm.rotation.x  = THREE.MathUtils.clamp(-leftPhase  * armSwing, -1.0, 1.0);
    this.rig.rightArm.rotation.x = THREE.MathUtils.clamp(-rightPhase * armSwing, -1.0, 1.0);

    this.rig.leftForeArm.rotation.x  = Math.max(0, -this.rig.leftArm.rotation.x)  * 0.6;
    this.rig.rightForeArm.rotation.x = Math.max(0, -this.rig.rightArm.rotation.x) * 0.6;

    this.rig.spine2.rotation.y = Math.sin(t) * -torsoTwist * 0.5;
    this.rig.spine.rotation.y  = Math.sin(t) * -torsoTwist * 0.25;

    const headStabilize = THREE.MathUtils.lerp(this.rig.neck.rotation.y, -this.rig.spine2.rotation.y * 0.6, 0.6);
    this.rig.neck.rotation.y += (headStabilize - this.rig.neck.rotation.y) * 0.25;
    this.rig.head.rotation.y = -this.rig.spine2.rotation.y * 0.2;
  }

  updateMineAnimation() {
    if (!this.miningTarget) return;

    const lookPos = this.miningTarget.position.clone();
    lookPos.y = this.mesh.position.y + 0.9;
    this.mesh.lookAt(lookPos);

    const swingSpeed = 2.4;
    const t = this.miningTimer * swingSpeed;

    const backSwing = Math.sin(t) * -0.8;  // negative for backswing
    const downSwing = Math.sin(t * 2.0) * 1.2; // quicker downswing

    const primary = THREE.MathUtils.clamp(backSwing + downSwing, -1.6, 1.6);
    this.rig.rightArm.rotation.x      = primary * 0.9;
    this.rig.rightForeArm.rotation.x  = Math.max(0, -primary) * 0.9;

    this.rig.leftArm.rotation.x       = primary * 0.6 - 0.2;
    this.rig.leftForeArm.rotation.x   = Math.max(0, -primary) * 0.5;

    this.rig.spine.rotation.y = THREE.MathUtils.clamp(primary * 0.2, -0.6, 0.6);
    this.rig.hips.position.y  = 0.75 - Math.max(0, -primary) * 0.12;

    this.rig.neck.rotation.y = -this.rig.spine.rotation.y * 0.6;
    this.rig.head.rotation.x = Math.max(0, -primary) * 0.12;
  }
}