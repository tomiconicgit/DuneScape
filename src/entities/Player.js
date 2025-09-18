// File: src/entities/Player.js
import * as THREE from 'three';

const states = { IDLE: 'idle', WALKING: 'walking', MINING: 'mining' };

export default class Player {
  constructor(scene, game) {
    this.game = game;
    this.state = states.IDLE;
    this.animationTimer = 0;
    this.animationBlend = 1.0; // blend factor for smoothing between states
    this.blendSpeed = 6.0;

    this.rig = {};
    this.mesh = this.createCharacterRig();
    this.mesh.position.set(50, 1.0, 102);
    scene.add(this.mesh);

    this.path = [];
    this.speed = 3.6;
    this.tileSize = 1.0;

    this.isMining = false;
    this.miningTarget = null;
    this.miningTimer = 0;
    this.miningDuration = 4.0;

    this.marker = this._createMarker();
    scene.add(this.marker);

    this.pathLine = this._createPathLine();
    scene.add(this.pathLine);
  }

  // ---------- helpers ----------
  _createMarker() {
    const geo = new THREE.BufferGeometry();
    const markerSize = 0.75;
    const pts = [
      new THREE.Vector3(-markerSize, 0, -markerSize),
      new THREE.Vector3(markerSize, 0, markerSize),
      new THREE.Vector3(markerSize, 0, -markerSize),
      new THREE.Vector3(-markerSize, 0, markerSize),
    ];
    geo.setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const line = new THREE.LineSegments(geo, mat);
    line.visible = false;
    return line;
  }

  _createPathLine() {
    const pathLineGeo = new THREE.BufferGeometry();
    pathLineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 3), 3));
    const pathLineMat = new THREE.LineDashedMaterial({ color: 0xff0000, dashSize: 0.2, gapSize: 0.1 });
    const line = new THREE.Line(pathLineGeo, pathLineMat);
    line.visible = false;
    return line;
  }

  // smooth rotate toward target Euler in world space on a group
  _slerpToEuler(node, targetEuler, speed, deltaTime) {
    // create target quaternion from Euler
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(targetEuler.x, targetEuler.y, targetEuler.z));
    node.quaternion.slerp(q, Math.min(1, speed * deltaTime));
  }

  // small utility to set immediate rotation (local)
  _setEuler(node, e) {
    node.rotation.set(e.x, e.y, e.z);
  }

  // ---------- rig & mesh ----------
  createCharacterRig() {
    const group = new THREE.Group();

    // materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x8f7a6b, roughness: 0.9, metalness: 0.05 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.8 });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.95 });

    // Pelvis (root)
    const pelvis = new THREE.Group();
    pelvis.position.y = 0;
    group.add(pelvis);
    this.rig.pelvis = pelvis;

    // pelvis mesh
    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.35), clothMat);
    pelvisMesh.position.y = 0.15;
    pelvis.add(pelvisMesh);

    // spine segments (pelvis->lowerSpine->upperSpine->chest)
    const lowerSpine = new THREE.Group(); lowerSpine.position.y = 0.25; pelvis.add(lowerSpine); this.rig.lowerSpine = lowerSpine;
    const lowerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.34), clothMat); lowerMesh.position.y = 0.14; lowerSpine.add(lowerMesh);

    const upperSpine = new THREE.Group(); upperSpine.position.y = 0.28; lowerSpine.add(upperSpine); this.rig.upperSpine = upperSpine;
    const upperMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.36), clothMat); upperMesh.position.y = 0.16; upperSpine.add(upperMesh);

    const chest = new THREE.Group(); chest.position.y = 0.32; upperSpine.add(chest); this.rig.chest = chest;
    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.36, 0.38), clothMat); chestMesh.position.y = 0.18; chest.add(chestMesh);

    // neck and head
    const neck = new THREE.Group(); neck.position.y = 0.36; chest.add(neck); this.rig.neck = neck;
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 6), skinMat);
    neckMesh.rotation.x = Math.PI / 2;
    neck.add(neckMesh);

    const head = new THREE.Group(); head.position.y = 0.25; neck.add(head); this.rig.head = head;
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), skinMat);
    headMesh.position.y = 0.18;
    head.add(headMesh);

    // simple facial feature: eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.8 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat); leftEye.position.set(0.12, 0.22, 0.28); head.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat); rightEye.position.set(-0.12, 0.22, 0.28); head.add(rightEye);

    // clavicles
    const leftClav = new THREE.Group(); leftClav.position.set(0.32, 0.12, 0.0); chest.add(leftClav); this.rig.leftClav = leftClav;
    const rightClav = new THREE.Group(); rightClav.position.set(-0.32, 0.12, 0.0); chest.add(rightClav); this.rig.rightClav = rightClav;

    // arms (clavicle -> shoulder -> upper -> elbow -> fore -> wrist -> hand -> fingers)
    const makeArm = (isLeft = true) => {
      const sign = isLeft ? 1 : -1;
      const clav = isLeft ? leftClav : rightClav;

      const shoulder = new THREE.Group(); shoulder.position.set(sign * 0.14, 0, 0); clav.add(shoulder);
      const shoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), jointMat); shoulder.add(shoulderMesh);

      const upper = new THREE.Group(); upper.position.set(sign * 0.18, -0.08, 0); shoulder.add(upper);
      const upperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.42, 8), skinMat); upperMesh.rotation.z = 0; upper.add(upperMesh);
      upperMesh.position.y = -0.2;

      const elbow = new THREE.Group(); elbow.position.set(0, -0.36, 0); upper.add(elbow);
      const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), jointMat); elbow.add(elbowMesh);

      const fore = new THREE.Group(); fore.position.set(0, -0.06, 0); elbow.add(fore);
      const foreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.36, 8), skinMat); foreMesh.position.y = -0.18; fore.add(foreMesh);

      const wrist = new THREE.Group(); wrist.position.set(0, -0.36, 0); fore.add(wrist);
      const wristMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), jointMat); wrist.add(wristMesh);

      const hand = new THREE.Group(); hand.position.set(0, -0.06, 0); wrist.add(hand);
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.18), skinMat); palm.position.y = -0.03; hand.add(palm);

      // simple fingers (3 each) — quick boxes parented to the hand
      const fingers = [];
      const fingerOffsets = [0.065, 0, -0.065];
      for (let i = 0; i < 3; i++) {
        const f = new THREE.Group(); f.position.set((i - 1) * 0.05, -0.06, 0.08);
        const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.03), skinMat); f1.position.y = -0.025;
        f.add(f1);
        const f2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.025), skinMat); f2.position.y = -0.055;
        f.add(f2);
        hand.add(f);
        fingers.push(f);
      }

      return { shoulder, upper, elbow, fore, wrist, hand, fingers };
    };

    const left = makeArm(true);
    const right = makeArm(false);
    this.rig.leftArm = left;
    this.rig.rightArm = right;

    // legs: pelvis -> upper -> knee -> lower -> ankle -> foot -> toe
    const makeLeg = (isLeft = true) => {
      const sign = isLeft ? 1 : -1;
      const hip = new THREE.Group(); hip.position.set(sign * 0.18, -0.02, 0); this.rig.pelvis.add(hip);
      const hipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), jointMat); hip.add(hipMesh);

      const upper = new THREE.Group(); upper.position.set(0, -0.12, 0); hip.add(upper);
      const upperMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.48, 8), clothMat); upperMesh.position.y = -0.24; upper.add(upperMesh);

      const knee = new THREE.Group(); knee.position.set(0, -0.48, 0); upper.add(knee);
      const kneeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), jointMat); knee.add(kneeMesh);

      const lower = new THREE.Group(); lower.position.set(0, -0.06, 0); knee.add(lower);
      const lowerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.5, 8), clothMat); lowerMesh.position.y = -0.25; lower.add(lowerMesh);

      const ankle = new THREE.Group(); ankle.position.set(0, -0.5, 0); lower.add(ankle);
      const ankleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), jointMat); ankle.add(ankleMesh);

      const foot = new THREE.Group(); foot.position.set(0, -0.06, 0); ankle.add(foot);
      const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.14), clothMat); footMesh.position.set(0.06, -0.03, 0.06); foot.add(footMesh);

      const toe = new THREE.Group(); toe.position.set(0.14, -0.02, 0); foot.add(toe);
      const toeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.08), clothMat); toeMesh.position.set(0.06, -0.02, 0); toe.add(toeMesh);

      return { hip, upper, knee, lower, ankle, foot, toe };
    };

    const leftLeg = makeLeg(true);
    const rightLeg = makeLeg(false);
    this.rig.leftLeg = leftLeg;
    this.rig.rightLeg = rightLeg;

    // small cast/shadow settings
    group.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    return group;
  }

  // ---------- actions ----------
  cancelActions() {
    this.miningTarget = null;
    this.isMining = false;
    this.miningTimer = 0;
  }

  startMining(targetRock) {
    if (!targetRock) return;
    this.miningTarget = targetRock;
    const direction = this.mesh.position.clone().sub(targetRock.position).normalize();
    const destination = targetRock.position.clone().add(direction.multiplyScalar(1.8));
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

    while (openSet.length) {
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();
      if (current.x === endNode.x && current.z === endNode.z) {
        const path = [];
        let t = current;
        while (t) {
          path.push(new THREE.Vector2(t.x, t.z));
          t = t.parent;
        }
        return path.reverse();
      }
      closedSet.add(`${current.x},${current.z}`);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dz === 0) continue;
          const nx = current.x + dx;
          const nz = current.z + dz;
          if (nx < 0 || nx >= grid.length || nz < 0 || nz >= grid[0].length || grid[nx][nz] === 1) continue;
          if (closedSet.has(`${nx},${nz}`)) continue;
          const gCost = current.g + 1;
          let neighbor = openSet.find(n => n.x === nx && n.z === nz);
          if (!neighbor || gCost < neighbor.g) {
            if (!neighbor) { neighbor = { x: nx, z: nz }; openSet.push(neighbor); }
            neighbor.g = gCost;
            neighbor.h = getHeuristic(neighbor, endNode);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.parent = current;
          }
        }
      }
    }
    return [];
  }

  updatePathLine() {
    const positions = this.pathLine.geometry.attributes.position.array;
    positions[0] = this.mesh.position.x;
    positions[1] = this.mesh.position.y - 1.0;
    positions[2] = this.mesh.position.z;
    positions[3] = this.marker.position.x;
    positions[4] = this.marker.position.y;
    positions[5] = this.marker.position.z;
    this.pathLine.geometry.attributes.position.needsUpdate = true;
    this.pathLine.computeLineDistances();
  }

  // ---------- update / movement ----------
  update(deltaTime) {
    this.animationTimer += deltaTime;

    // handle transitions
    if (this.state === states.WALKING && this.path.length === 0) {
      this.state = this.miningTarget ? states.MINING : states.IDLE;
      this.miningTimer = 0;
      this.marker.visible = false;
      this.pathLine.visible = false;
    }

    if (this.state === states.WALKING) this.updateMovement(deltaTime);

    // blending factor to smooth between previous pose and new pose
    this.animationBlend = THREE.MathUtils.lerp(this.animationBlend, 1.0, Math.min(1, deltaTime * this.blendSpeed));

    // choose animation
    switch (this.state) {
      case states.WALKING:
        this._applyWalk(deltaTime);
        break;
      case states.MINING:
        this._applyMine(deltaTime);
        this.updateMineTimer(deltaTime);
        break;
      default:
        this._applyIdle(deltaTime);
        break;
    }
  }

  updateMovement(deltaTime) {
    if (this.path.length === 0) return;
    const nextTile = this.path[0];
    const targetPosition = new THREE.Vector3(nextTile.x, this.mesh.position.y, nextTile.y);
    const distance = this.mesh.position.clone().setY(0).distanceTo(targetPosition.clone().setY(0));
    if (distance < 0.12) {
      this.mesh.position.x = targetPosition.x;
      this.mesh.position.z = targetPosition.z;
      this.path.shift();
      return;
    } else {
      const dir = targetPosition.clone().sub(this.mesh.position).normalize();
      this.mesh.position.add(dir.multiplyScalar(this.speed * deltaTime));
      // smooth lookAt
      const lookPos = new THREE.Vector3(targetPosition.x, this.mesh.position.y + 0.4, targetPosition.z);
      this.mesh.lookAt(lookPos);
    }
    this.updatePathLine();
  }

  updateMineTimer(deltaTime) {
    this.miningTimer += deltaTime;
    if (this.miningTimer >= this.miningDuration) {
      if (this.miningTarget && this.miningTarget.userData && this.miningTarget.userData.onMined) {
        this.miningTarget.userData.onMined();
      }
      this.miningTarget = null;
      this.state = states.IDLE;
      this.miningTimer = 0;
    }
  }

  // ---------- animations ----------
  _applyIdle(deltaTime) {
    // slow breathing and subtle head movement
    const t = this.animationTimer * 1.2;
    const breathe = Math.sin(t) * 0.02;
    // pelvis bob
    this.rig.pelvis.position.y = THREE.MathUtils.lerp(this.rig.pelvis.position.y, breathe * 0.5, deltaTime * 4);

    // subtle spine sway
    const spineYaw = Math.sin(t * 0.4) * 0.06;
    this._slerpToEuler(this.rig.chest, new THREE.Euler(0.02, spineYaw, 0), 4.0, deltaTime);

    // arms hang relaxed, slight swing
    this._slerpToEuler(this.rig.leftArm.upper, new THREE.Euler(-0.25, 0.12, 0.06), 6.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.upper, new THREE.Euler(-0.25, -0.12, -0.06), 6.0, deltaTime);

    // forearms slightly bent
    this._slerpToEuler(this.rig.leftArm.fore, new THREE.Euler(-0.15, 0, 0), 6.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.fore, new THREE.Euler(-0.15, 0, 0), 6.0, deltaTime);

    // head look-around
    const headYaw = Math.sin(t * 0.6) * 0.12;
    this._slerpToEuler(this.rig.head, new THREE.Euler(0, headYaw, 0), 4.0, deltaTime);

    // legs standing, small weight shift
    const legShift = Math.sin(t * 0.6) * 0.04;
    this._slerpToEuler(this.rig.leftLeg.upper, new THREE.Euler(-0.04 + legShift, 0, 0), 6.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.upper, new THREE.Euler(-0.04 - legShift, 0, 0), 6.0, deltaTime);
    this._slerpToEuler(this.rig.leftLeg.lower, new THREE.Euler(0.02, 0, 0), 6.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.lower, new THREE.Euler(0.02, 0, 0), 6.0, deltaTime);
  }

  _applyWalk(deltaTime) {
    // rhythmic cycles
    const speedFactor = THREE.MathUtils.clamp(this.speed / 4.0, 0.6, 1.4);
    const t = this.animationTimer * 6.0 * speedFactor;
    const walkCycle = (t % (Math.PI * 2));
    // leg swing
    const swing = Math.sin(walkCycle) * 0.9;
    const swingOpp = Math.sin(walkCycle + Math.PI) * 0.9;
    const kneeBend = Math.max(0, Math.sin(walkCycle + Math.PI / 2)) * 0.7;
    const kneeBendOpp = Math.max(0, Math.sin(walkCycle + Math.PI / 2 + Math.PI)) * 0.7;

    // apply to legs with smoothing
    this._slerpToEuler(this.rig.leftLeg.upper, new THREE.Euler( -0.25 + swing * 0.35, 0, 0), 12.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.upper, new THREE.Euler( -0.25 + swingOpp * 0.35, 0, 0), 12.0, deltaTime);

    this._slerpToEuler(this.rig.leftLeg.lower, new THREE.Euler( 0.15 - kneeBend * 0.6, 0, 0), 12.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.lower, new THREE.Euler( 0.15 - kneeBendOpp * 0.6, 0, 0), 12.0, deltaTime);

    // foot planting: rotate foot to match ground contact
    const footPitch = Math.sin(walkCycle) * 0.18;
    const footPitchOpp = Math.sin(walkCycle + Math.PI) * 0.18;
    this._slerpToEuler(this.rig.leftLeg.foot, new THREE.Euler(footPitch * 0.8, 0, 0), 12.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.foot, new THREE.Euler(footPitchOpp * 0.8, 0, 0), 12.0, deltaTime);

    // arms swing contralaterally (opposite to legs), add torso twist
    const armSwing = Math.sin(walkCycle + Math.PI) * 0.6;
    this._slerpToEuler(this.rig.leftArm.upper, new THREE.Euler(-0.2 + armSwing * 0.35, 0.08, 0.02), 12.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.upper, new THREE.Euler(-0.2 - armSwing * 0.35, -0.08, -0.02), 12.0, deltaTime);

    this._slerpToEuler(this.rig.leftArm.fore, new THREE.Euler(-0.05, 0, 0), 8.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.fore, new THREE.Euler(-0.05, 0, 0), 8.0, deltaTime);

    // torso bob and twist
    const bob = Math.sin(walkCycle * 2) * 0.04;
    const twist = Math.sin(walkCycle) * 0.06;
    this.rig.pelvis.position.y = THREE.MathUtils.lerp(this.rig.pelvis.position.y, bob, deltaTime * 8);
    this._slerpToEuler(this.rig.chest, new THREE.Euler(0.02, twist * 0.6, 0), 8.0, deltaTime);

    // head stabilization
    this._slerpToEuler(this.rig.head, new THREE.Euler(0, -twist * 0.6, 0), 6.0, deltaTime);
  }

  _applyMine(deltaTime) {
    if (!this.miningTarget) {
      // default preparatory mining pose
      this._slerpToEuler(this.rig.chest, new THREE.Euler(0.15, 0.12, 0), 8.0, deltaTime);
      this._slerpToEuler(this.rig.leftArm.upper, new THREE.Euler(-0.5, 0.18, 0.1), 8.0, deltaTime);
      this._slerpToEuler(this.rig.rightArm.upper, new THREE.Euler(-0.5, -0.18, -0.1), 8.0, deltaTime);
      this._slerpToEuler(this.rig.leftArm.fore, new THREE.Euler(-0.8, 0, 0), 8.0, deltaTime);
      this._slerpToEuler(this.rig.rightArm.fore, new THREE.Euler(-0.8, 0, 0), 8.0, deltaTime);
      return;
    }

    // face the target
    const targetPos = this.miningTarget.position.clone();
    const myPos = this.mesh.position.clone();
    const lookTarget = new THREE.Vector3(targetPos.x, myPos.y + 0.8, targetPos.z);
    // immediate lookAt (smoother rotate of chest/head below)
    this.mesh.lookAt(lookTarget);

    // mining timing breakdown: windup (0->0.25), strike (0.25->0.6), follow-through (0.6->1.0)
    const progress = THREE.MathUtils.clamp(this.miningTimer / Math.max(this.miningDuration, 0.0001), 0, 1);
    const wind = Math.min(1, progress / 0.25);
    const strike = THREE.MathUtils.clamp((progress - 0.25) / 0.35, 0, 1);
    const recover = THREE.MathUtils.clamp((progress - 0.6) / 0.4, 0, 1);

    // wind-up: torso leans back, arms raise
    const windT = Math.sin(wind * Math.PI) * 0.9;
    const strikeT = Math.sin(strike * Math.PI) * 1.0;
    const recT = Math.sin(recover * Math.PI) * 0.6;

    // compute target rotations for right-handed miner (right does majority of hitting)
    const rightUpperTarget = new THREE.Euler(-0.6 - windT * 0.6 - strikeT * 0.8, -0.1, 0.05);
    const rightForeTarget  = new THREE.Euler(-0.9 - strikeT * 0.8, 0, 0);
    const leftUpperTarget  = new THREE.Euler(-0.4 - windT * 0.3 - strikeT * 0.4, 0.15, 0.06);
    const leftForeTarget   = new THREE.Euler(-0.6 - strikeT * 0.4, 0, 0);

    // torso and head adjustments
    const chestTilt = -0.12 - strikeT * 0.18 + recT * 0.08;
    const chestYaw = Math.sin(this.animationTimer * 6) * 0.04 * (1 - progress);

    this._slerpToEuler(this.rig.chest, new THREE.Euler(chestTilt, chestYaw, 0), 12.0, deltaTime);

    // apply arm poses with smoothing, faster on strike
    const armSpeed = 14.0;
    this._slerpToEuler(this.rig.rightArm.upper, rightUpperTarget, armSpeed, deltaTime);
    this._slerpToEuler(this.rig.rightArm.fore, rightForeTarget, armSpeed, deltaTime);
    this._slerpToEuler(this.rig.leftArm.upper, leftUpperTarget, armSpeed * 0.9, deltaTime);
    this._slerpToEuler(this.rig.leftArm.fore, leftForeTarget, armSpeed * 0.9, deltaTime);

    // legs brace: minor bend and wide stance
    this._slerpToEuler(this.rig.leftLeg.upper, new THREE.Euler(-0.28, 0.08, 0), 8.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.upper, new THREE.Euler(-0.28, -0.08, 0), 8.0, deltaTime);
    this._slerpToEuler(this.rig.leftLeg.lower, new THREE.Euler(0.28, 0, 0), 8.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.lower, new THREE.Euler(0.28, 0, 0), 8.0, deltaTime);

    // small shake when strike happens (use progress spike)
    const hitImpulse = (progress > 0.25 && progress < 0.6) ? Math.sin((progress - 0.25) / 0.35 * Math.PI) * 0.06 : 0;
    this.rig.pelvis.position.x = THREE.MathUtils.lerp(this.rig.pelvis.position.x, hitImpulse * 0.05, deltaTime * 12);
    this.rig.pelvis.position.z = THREE.MathUtils.lerp(this.rig.pelvis.position.z, hitImpulse * 0.03, deltaTime * 12);
  }
}