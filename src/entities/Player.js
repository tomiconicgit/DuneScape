// File: src/entities/Player.js
import * as THREE from 'three';

const states = { IDLE: 'idle', WALKING: 'walking', MINING: 'mining' };

export default class Player {
  constructor(scene, game) {
    this.game = game;
    this.state = states.IDLE;
    this.animationTimer = 0;
    this.animationBlend = 1.0; // blend factor for smoothing between states
    this.blendSpeed = 8.0; // increased for smoother transitions

    this.rig = {};
    this.mesh = this.createCharacterRig();
    this.mesh.position.set(50, 1.0, 102);
    scene.add(this.mesh);

    this.path = [];
    this.speed = 4.2; // slightly faster for dynamic feel
    this.tileSize = 1.0;

    this.isMining = false;
    this.miningTarget = null;
    this.miningTimer = 0;
    this.miningDuration = 3.5; // shorter for snappier action

    this.marker = this._createMarker();
    scene.add(this.marker);

    this.pathLine = this._createPathLine();
    scene.add(this.pathLine);

    // AAA additions: pickaxe and particles stub
    this.pickaxe = this._createPickaxe();
    this.rig.rightArm.hand.add(this.pickaxe);
    this.particles = this._createParticles(); // simple dust on mine hit
    scene.add(this.particles);
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
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(targetEuler.x, targetEuler.y, targetEuler.z));
    node.quaternion.slerp(q, Math.min(1, speed * deltaTime));
  }

  // set immediate rotation (local)
  _setEuler(node, e) {
    node.rotation.set(e.x, e.y, e.z);
  }

  // AAA: procedural pickaxe
  _createPickaxe() {
    const group = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -0.6;
    group.add(handle);

    const headGeo = new THREE.BoxGeometry(0.3, 0.1, 0.1);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.8, roughness: 0.4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.05;
    head.rotation.z = Math.PI / 4;
    group.add(head);

    const spikeGeo = new THREE.ConeGeometry(0.05, 0.4, 8);
    const spike1 = new THREE.Mesh(spikeGeo, headMat);
    spike1.position.set(0.15, 0.05, 0);
    spike1.rotation.x = Math.PI / 2;
    group.add(spike1);

    const spike2 = new THREE.Mesh(spikeGeo, headMat);
    spike2.position.set(-0.15, 0.05, 0);
    spike2.rotation.x = -Math.PI / 2;
    group.add(spike2);

    group.position.set(0, -0.1, 0);
    group.rotation.x = Math.PI / 2;
    return group;
  }

  // AAA: simple particle system for mining dust
  _createParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(100 * 3); // 100 particles
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.05, transparent: true, opacity: 0.8 });
    const points = new THREE.Points(geo, mat);
    points.visible = false;
    return points;
  }

  _emitParticles(pos) {
    this.particles.position.copy(pos);
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3 + 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.visible = true;
    // fade out over time (handled in update)
    this.particleTimer = 0.5;
  }

  // ---------- rig & mesh ----------
  createCharacterRig() {
    const group = new THREE.Group();

    // materials with AAA PBR touches
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x8f7a6b, roughness: 0.6, metalness: 0.1, normalScale: new THREE.Vector2(0.5, 0.5) });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.7, metalness: 0.05, normalScale: new THREE.Vector2(0.8, 0.8) });
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

    // Pelvis (root)
    const pelvis = new THREE.Group();
    pelvis.position.y = 0;
    group.add(pelvis);
    this.rig.pelvis = pelvis;

    // pelvis mesh: more realistic box with rounded edges (approx with sphere caps)
    const pelvisGeo = new THREE.CapsuleGeometry(0.25, 0.3, 8, 8);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, clothMat);
    pelvisMesh.rotation.x = Math.PI / 2;
    pelvis.add(pelvisMesh);

    // spine: added twist joints for flexibility
    const lowerSpine = new THREE.Group(); lowerSpine.position.y = 0.3; pelvis.add(lowerSpine); this.rig.lowerSpine = lowerSpine;
    const lowerTwist = new THREE.Group(); lowerSpine.add(lowerTwist); this.rig.lowerTwist = lowerTwist;
    const lowerMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.28, 8, 8), clothMat);
    lowerMesh.rotation.x = Math.PI / 2;
    lowerTwist.add(lowerMesh);

    const upperSpine = new THREE.Group(); upperSpine.position.y = 0.3; lowerSpine.add(upperSpine); this.rig.upperSpine = upperSpine;
    const upperTwist = new THREE.Group(); upperSpine.add(upperTwist); this.rig.upperTwist = upperTwist;
    const upperMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.32, 8, 8), clothMat);
    upperMesh.rotation.x = Math.PI / 2;
    upperTwist.add(upperMesh);

    const chest = new THREE.Group(); chest.position.y = 0.34; upperSpine.add(chest); this.rig.chest = chest;
    const chestTwist = new THREE.Group(); chest.add(chestTwist); this.rig.chestTwist = chestTwist;
    const chestMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.36, 8, 8), clothMat);
    chestMesh.rotation.x = Math.PI / 2;
    chestTwist.add(chestMesh);

    // neck and head
    const neck = new THREE.Group(); neck.position.y = 0.38; chest.add(neck); this.rig.neck = neck;
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 8), skinMat);
    neckMesh.rotation.x = Math.PI / 2;
    neck.add(neckMesh);

    const head = new THREE.Group(); head.position.y = 0.28; neck.add(head); this.rig.head = head;
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 18), skinMat); // higher res
    headMesh.position.y = 0.14;
    head.add(headMesh);

    // AAA: facial features - eyes, nose, mouth, ears, hair
    const eyeGeo = new THREE.SphereGeometry(0.035, 12, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Group(); leftEye.position.set(0.1, 0.18, 0.24); head.add(leftEye);
    leftEye.add(new THREE.Mesh(eyeGeo, eyeMat));
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), pupilMat); leftPupil.position.z = 0.03; leftEye.add(leftPupil);
    const rightEye = new THREE.Group(); rightEye.position.set(-0.1, 0.18, 0.24); head.add(rightEye);
    rightEye.add(new THREE.Mesh(eyeGeo, eyeMat));
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), pupilMat); rightPupil.position.z = 0.03; rightEye.add(rightPupil);

    const noseGeo = new THREE.ConeGeometry(0.04, 0.08, 8);
    const nose = new THREE.Mesh(noseGeo, skinMat); nose.position.set(0, 0.12, 0.28); nose.rotation.x = Math.PI; head.add(nose);

    const mouthGeo = new THREE.BoxGeometry(0.12, 0.02, 0.04);
    const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshStandardMaterial({ color: 0xffaaaa })); mouth.position.set(0, 0.06, 0.26); head.add(mouth);

    const earGeo = new THREE.BoxGeometry(0.05, 0.1, 0.03);
    const leftEar = new THREE.Mesh(earGeo, skinMat); leftEar.position.set(0.28, 0.18, 0); head.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, skinMat); rightEar.position.set(-0.28, 0.18, 0); head.add(rightEar);

    const hairGeo = new THREE.SphereGeometry(0.29, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const hair = new THREE.Mesh(hairGeo, hairMat); hair.position.y = 0.14; head.add(hair);

    // clavicles with rotation
    const leftClav = new THREE.Group(); leftClav.position.set(0.28, 0.14, 0); chest.add(leftClav); this.rig.leftClav = leftClav;
    const rightClav = new THREE.Group(); rightClav.position.set(-0.28, 0.14, 0); chest.add(rightClav); this.rig.rightClav = rightClav;

    // arms: added twist for natural rotation
    const makeArm = (isLeft = true) => {
      const sign = isLeft ? 1 : -1;
      const clav = isLeft ? leftClav : rightClav;

      const shoulder = new THREE.Group(); shoulder.position.set(sign * 0.12, 0, 0); clav.add(shoulder);
      const shoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), jointMat); shoulder.add(shoulderMesh);

      const upper = new THREE.Group(); upper.position.set(sign * 0.16, -0.1, 0); shoulder.add(upper);
      const upperTwist = new THREE.Group(); upper.add(upperTwist);
      const upperMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.4, 12, 8), skinMat); upperMesh.position.y = -0.2; upperTwist.add(upperMesh);

      const elbow = new THREE.Group(); elbow.position.set(0, -0.4, 0); upper.add(elbow);
      const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), jointMat); elbow.add(elbowMesh);

      const fore = new THREE.Group(); fore.position.set(0, -0.08, 0); elbow.add(fore);
      const foreTwist = new THREE.Group(); fore.add(foreTwist);
      const foreMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.34, 12, 8), skinMat); foreMesh.position.y = -0.17; foreTwist.add(foreMesh);

      const wrist = new THREE.Group(); wrist.position.set(0, -0.34, 0); fore.add(wrist);
      const wristMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), jointMat); wrist.add(wristMesh);

      const hand = new THREE.Group(); hand.position.set(0, -0.08, 0); wrist.add(hand);
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.16), skinMat); palm.position.y = -0.025; hand.add(palm);

      // fingers: added joints for articulation
      const fingers = [];
      const fingerOffsets = [-0.04, -0.015, 0.01, 0.035, 0.06]; // 5 fingers
      for (let i = 0; i < 5; i++) {
        const f = new THREE.Group(); f.position.set(fingerOffsets[i], -0.05, 0);
        const f1 = new THREE.Group(); f.add(f1);
        const f1Mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.04, 6), skinMat); f1Mesh.position.y = -0.02; f1.add(f1Mesh);
        const f2 = new THREE.Group(); f2.position.y = -0.04; f1.add(f2);
        const f2Mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.03, 6), skinMat); f2Mesh.position.y = -0.015; f2.add(f2Mesh);
        const f3 = new THREE.Group(); f3.position.y = -0.03; f2.add(f3);
        const f3Mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.025, 6), skinMat); f3Mesh.position.y = -0.0125; f3.add(f3Mesh);
        hand.add(f);
        fingers.push({ base: f, mid: f1, tip: f2, end: f3 });
      }

      return { shoulder, upper, upperTwist, elbow, fore, foreTwist, wrist, hand, fingers };
    };

    this.rig.leftArm = makeArm(true);
    this.rig.rightArm = makeArm(false);

    // legs: similar enhancements
    const makeLeg = (isLeft = true) => {
      const sign = isLeft ? 1 : -1;
      const hip = new THREE.Group(); hip.position.set(sign * 0.16, -0.04, 0); pelvis.add(hip);
      const hipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), jointMat); hip.add(hipMesh);

      const upper = new THREE.Group(); upper.position.set(0, -0.14, 0); hip.add(upper);
      const upperTwist = new THREE.Group(); upper.add(upperTwist);
      const upperMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.46, 12, 8), clothMat); upperMesh.position.y = -0.23; upperTwist.add(upperMesh);

      const knee = new THREE.Group(); knee.position.set(0, -0.46, 0); upper.add(knee);
      const kneeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), jointMat); knee.add(kneeMesh);

      const lower = new THREE.Group(); lower.position.set(0, -0.08, 0); knee.add(lower);
      const lowerTwist = new THREE.Group(); lower.add(lowerTwist);
      const lowerMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.48, 12, 8), clothMat); lowerMesh.position.y = -0.24; lowerTwist.add(lowerMesh);

      const ankle = new THREE.Group(); ankle.position.set(0, -0.48, 0); lower.add(ankle);
      const ankleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), jointMat); ankle.add(ankleMesh);

      const foot = new THREE.Group(); foot.position.set(0, -0.08, 0.04); ankle.add(foot); // slight forward for realism
      const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.3), clothMat); footMesh.position.set(0, -0.025, 0.1); foot.add(footMesh);

      const toe = new THREE.Group(); toe.position.set(0, -0.025, 0.2); foot.add(toe);
      const toeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.1), clothMat); toeMesh.position.set(0, -0.02, 0.05); toe.add(toeMesh);

      return { hip, upper, upperTwist, knee, lower, lowerTwist, ankle, foot, toe };
    };

    this.rig.leftLeg = makeLeg(true);
    this.rig.rightLeg = makeLeg(false);

    // cast/receive shadows
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
    this.particles.visible = false;
  }

  startMining(targetRock) {
    if (!targetRock) return;
    this.miningTarget = targetRock;
    const direction = this.mesh.position.clone().sub(targetRock.position).normalize();
    const destination = targetRock.position.clone().add(direction.multiplyScalar(1.6)); // closer for AAA interaction
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
          const gCost = current.g + (Math.abs(dx) + Math.abs(dz) === 2 ? 1.414 : 1); // diagonal cost
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

    // particle fade
    if (this.particles.visible) {
      this.particleTimer -= deltaTime;
      if (this.particleTimer <= 0) this.particles.visible = false;
      else this.particles.material.opacity = this.particleTimer / 0.5;
    }

    // handle transitions
    if (this.state === states.WALKING && this.path.length === 0) {
      this.state = this.miningTarget ? states.MINING : states.IDLE;
      this.miningTimer = 0;
      this.marker.visible = false;
      this.pathLine.visible = false;
    }

    if (this.state === states.WALKING) this.updateMovement(deltaTime);

    this.animationBlend = THREE.MathUtils.lerp(this.animationBlend, 1.0, Math.min(1, deltaTime * this.blendSpeed));

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
    if (distance < 0.1) { // tighter threshold
      this.mesh.position.x = targetPosition.x;
      this.mesh.position.z = targetPosition.z;
      this.path.shift();
      return;
    } else {
      const dir = targetPosition.clone().sub(this.mesh.position).normalize();
      this.mesh.position.add(dir.multiplyScalar(this.speed * deltaTime));
      const lookPos = new THREE.Vector3(targetPosition.x, this.mesh.position.y + 0.5, targetPosition.z); // higher look for natural
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
    // emit particles at strike point
    if (Math.floor(this.miningTimer / 0.6) !== Math.floor((this.miningTimer - deltaTime) / 0.6)) {
      this._emitParticles(this.miningTarget.position);
    }
  }

  // ---------- animations ----------
  _applyIdle(deltaTime) {
    const t = this.animationTimer * 1.5; // slower for calm
    const breathe = Math.sin(t) * 0.03;
    this.rig.pelvis.position.y = THREE.MathUtils.lerp(this.rig.pelvis.position.y, breathe * 0.6, deltaTime * 5);

    const spineYaw = Math.sin(t * 0.5) * 0.08;
    this._slerpToEuler(this.rig.chest, new THREE.Euler(0.03, spineYaw, 0), 5.0, deltaTime);
    this._slerpToEuler(this.rig.chestTwist, new THREE.Euler(0, spineYaw * 0.5, 0), 5.0, deltaTime);

    // arms relaxed with secondary motion
    this._slerpToEuler(this.rig.leftArm.upper, new THREE.Euler(-0.2, 0.1, 0.05), 7.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.upper, new THREE.Euler(-0.2, -0.1, -0.05), 7.0, deltaTime);
    this._slerpToEuler(this.rig.leftArm.upperTwist, new THREE.Euler(0, 0, Math.sin(t * 0.8) * 0.05), 7.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.upperTwist, new THREE.Euler(0, 0, Math.sin(t * 0.8) * 0.05), 7.0, deltaTime);

    this._slerpToEuler(this.rig.leftArm.fore, new THREE.Euler(-0.1, 0, 0), 7.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.fore, new THREE.Euler(-0.1, 0, 0), 7.0, deltaTime);

    // head with look-around and blink
    const headYaw = Math.sin(t * 0.7) * 0.15;
    const headPitch = Math.cos(t * 0.4) * 0.05;
    this._slerpToEuler(this.rig.head, new THREE.Euler(headPitch, headYaw, 0), 5.0, deltaTime);

    // blink: scale eyes Y (simple)
    const blink = Math.sin(t * 10) < -0.98 ? 0.2 : 1.0; // occasional blink
    // assuming eyes are groups, scale them
    this.rig.head.children.find(c => c.position.x > 0).scale.y = blink; // left eye
    this.rig.head.children.find(c => c.position.x < 0).scale.y = blink; // right eye

    // legs with weight shift
    const legShift = Math.sin(t * 0.7) * 0.05;
    this._slerpToEuler(this.rig.leftLeg.upper, new THREE.Euler(-0.03 + legShift, 0.02, 0), 7.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.upper, new THREE.Euler(-0.03 - legShift, -0.02, 0), 7.0, deltaTime);
    this._slerpToEuler(this.rig.leftLeg.lower, new THREE.Euler(0.03, 0, 0), 7.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.lower, new THREE.Euler(0.03, 0, 0), 7.0, deltaTime);

    // fingers relaxed curl
    this.rig.leftArm.fingers.forEach(f => {
      this._slerpToEuler(f.mid, new THREE.Euler(-0.3, 0, 0), 5.0, deltaTime);
      this._slerpToEuler(f.tip, new THREE.Euler(-0.4, 0, 0), 5.0, deltaTime);
    });
    this.rig.rightArm.fingers.forEach(f => {
      this._slerpToEuler(f.mid, new THREE.Euler(-0.3, 0, 0), 5.0, deltaTime);
      this._slerpToEuler(f.tip, new THREE.Euler(-0.4, 0, 0), 5.0, deltaTime);
    });
  }

  _applyWalk(deltaTime) {
    const speedFactor = THREE.MathUtils.clamp(this.speed / 4.5, 0.7, 1.5);
    const t = this.animationTimer * 7.0 * speedFactor;
    const walkCycle = (t % (Math.PI * 2));
    const swing = Math.sin(walkCycle) * 1.0;
    const swingOpp = Math.sin(walkCycle + Math.PI) * 1.0;
    const kneeBend = (1 - Math.cos(walkCycle)) * 0.5 * 0.8;
    const kneeBendOpp = (1 - Math.cos(walkCycle + Math.PI)) * 0.5 * 0.8;

    // legs with IK approx (lift foot when swinging forward)
    const lift = Math.max(0, Math.sin(walkCycle + Math.PI / 2)) * 0.15;
    const liftOpp = Math.max(0, Math.sin(walkCycle + Math.PI / 2 + Math.PI)) * 0.15;
    this._slerpToEuler(this.rig.leftLeg.upper, new THREE.Euler(swing * 0.4, 0.03, 0), 14.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.upper, new THREE.Euler(swingOpp * 0.4, -0.03, 0), 14.0, deltaTime);
    this._slerpToEuler(this.rig.leftLeg.lower, new THREE.Euler(kneeBend + lift * 0.3, 0, 0), 14.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.lower, new THREE.Euler(kneeBendOpp + liftOpp * 0.3, 0, 0), 14.0, deltaTime);

    // foot with toe roll
    const footPitch = Math.sin(walkCycle + Math.PI / 4) * 0.25;
    const footPitchOpp = Math.sin(walkCycle + Math.PI / 4 + Math.PI) * 0.25;
    this._slerpToEuler(this.rig.leftLeg.foot, new THREE.Euler(footPitch, 0, 0), 14.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.foot, new THREE.Euler(footPitchOpp, 0, 0), 14.0, deltaTime);
    this._slerpToEuler(this.rig.leftLeg.toe, new THREE.Euler(-footPitch * 0.5, 0, 0), 14.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.toe, new THREE.Euler(-footPitchOpp * 0.5, 0, 0), 14.0, deltaTime);

    // arms with pump and twist
    const armSwing = swingOpp * 0.7;
    this._slerpToEuler(this.rig.leftArm.upper, new THREE.Euler(armSwing * 0.4, 0.1, 0.03), 14.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.upper, new THREE.Euler(armSwing * -0.4, -0.1, -0.03), 14.0, deltaTime);
    this._slerpToEuler(this.rig.leftArm.upperTwist, new THREE.Euler(0, 0, armSwing * 0.1), 14.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.upperTwist, new THREE.Euler(0, 0, -armSwing * 0.1), 14.0, deltaTime);

    this._slerpToEuler(this.rig.leftArm.fore, new THREE.Euler(-0.2 + Math.abs(armSwing) * 0.1, 0, 0), 10.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.fore, new THREE.Euler(-0.2 + Math.abs(armSwing) * 0.1, 0, 0), 10.0, deltaTime);

    // torso bob, twist, secondary
    const bob = (1 - Math.cos(walkCycle * 2)) * 0.5 * 0.05;
    const twist = Math.sin(walkCycle) * 0.08;
    this.rig.pelvis.position.y = THREE.MathUtils.lerp(this.rig.pelvis.position.y, bob + 0.02, deltaTime * 10);
    this._slerpToEuler(this.rig.chest, new THREE.Euler(0.03, twist * 0.7, 0), 10.0, deltaTime);
    this._slerpToEuler(this.rig.chestTwist, new THREE.Euler(0, twist * 0.3, 0), 10.0, deltaTime);

    // head stabilization with slight bob
    this._slerpToEuler(this.rig.head, new THREE.Euler(-0.02, -twist * 0.5, 0), 7.0, deltaTime);

    // fingers slight swing
    this.rig.leftArm.fingers.forEach(f => {
      this._slerpToEuler(f.mid, new THREE.Euler(-0.2 + armSwing * 0.1, 0, 0), 7.0, deltaTime);
      this._slerpToEuler(f.tip, new THREE.Euler(-0.3 + armSwing * 0.1, 0, 0), 7.0, deltaTime);
    });
    this.rig.rightArm.fingers.forEach(f => {
      this._slerpToEuler(f.mid, new THREE.Euler(-0.2 - armSwing * 0.1, 0, 0), 7.0, deltaTime);
      this._slerpToEuler(f.tip, new THREE.Euler(-0.3 - armSwing * 0.1, 0, 0), 7.0, deltaTime);
    });
  }

  _applyMine(deltaTime) {
    if (!this.miningTarget) {
      this._slerpToEuler(this.rig.chest, new THREE.Euler(0.2, 0.15, 0), 10.0, deltaTime);
      this._slerpToEuler(this.rig.leftArm.upper, new THREE.Euler(-0.6, 0.2, 0.12), 10.0, deltaTime);
      this._slerpToEuler(this.rig.rightArm.upper, new THREE.Euler(-0.6, -0.2, -0.12), 10.0, deltaTime);
      this._slerpToEuler(this.rig.leftArm.fore, new THREE.Euler(-1.0, 0, 0), 10.0, deltaTime);
      this._slerpToEuler(this.rig.rightArm.fore, new THREE.Euler(-1.0, 0, 0), 10.0, deltaTime);
      return;
    }

    const targetPos = this.miningTarget.position.clone();
    const myPos = this.mesh.position.clone();
    const lookTarget = new THREE.Vector3(targetPos.x, myPos.y + 0.9, targetPos.z);
    this.mesh.lookAt(lookTarget);

    const progress = THREE.MathUtils.clamp(this.miningTimer / this.miningDuration, 0, 1);
    const cycle = Math.sin(progress * Math.PI * 5) * (1 - progress); // multiple swings
    const wind = Math.pow(progress % 0.2 / 0.2, 0.5); // eased windup per cycle
    const strike = Math.pow(Math.max(0, (progress % 0.2 - 0.1) / 0.1), 2); // quick strike

    // arms: two-handed grip on pickaxe (right dominant)
    const rightUpperTarget = new THREE.Euler(-1.2 + cycle * 0.8 - strike * 1.2, -0.15 + cycle * 0.1, 0.08);
    const rightForeTarget = new THREE.Euler(-1.2 - strike * 1.0, 0.1, 0);
    const leftUpperTarget = new THREE.Euler(-1.0 + cycle * 0.6 - strike * 0.8, 0.2 + cycle * 0.05, 0.1);
    const leftForeTarget = new THREE.Euler(-1.0 - strike * 0.6, -0.1, 0);

    this._slerpToEuler(this.rig.rightArm.upper, rightUpperTarget, 16.0, deltaTime);
    this._slerpToEuler(this.rig.rightArm.fore, rightForeTarget, 16.0, deltaTime);
    this._slerpToEuler(this.rig.leftArm.upper, leftUpperTarget, 15.0, deltaTime);
    this._slerpToEuler(this.rig.leftArm.fore, leftForeTarget, 15.0, deltaTime);

    // twist for torque
    this._slerpToEuler(this.rig.rightArm.upperTwist, new THREE.Euler(0, 0, -cycle * 0.2 + strike * 0.3), 16.0, deltaTime);
    this._slerpToEuler(this.rig.leftArm.upperTwist, new THREE.Euler(0, 0, cycle * 0.15 - strike * 0.2), 15.0, deltaTime);

    // fingers grip
    this.rig.rightArm.fingers.forEach(f => {
      this._slerpToEuler(f.mid, new THREE.Euler(-1.2, 0, 0), 10.0, deltaTime);
      this._slerpToEuler(f.tip, new THREE.Euler(-1.0, 0, 0), 10.0, deltaTime);
    });
    this.rig.leftArm.fingers.forEach(f => {
      this._slerpToEuler(f.mid, new THREE.Euler(-1.2, 0, 0), 10.0, deltaTime);
      this._slerpToEuler(f.tip, new THREE.Euler(-1.0, 0, 0), 10.0, deltaTime);
    });

    // torso with recoil
    const chestTilt = -0.15 - strike * 0.25;
    const chestYaw = Math.sin(this.animationTimer * 8) * 0.05 * (1 - strike);
    this._slerpToEuler(this.rig.chest, new THREE.Euler(chestTilt, chestYaw, 0), 14.0, deltaTime);
    this._slerpToEuler(this.rig.chestTwist, new THREE.Euler(0, chestYaw * 0.5 + cycle * 0.1, 0), 14.0, deltaTime);

    // legs braced with slight bob
    const legBend = 0.35 + strike * 0.1;
    this._slerpToEuler(this.rig.leftLeg.upper, new THREE.Euler(-legBend, 0.1, 0), 10.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.upper, new THREE.Euler(-legBend, -0.1, 0), 10.0, deltaTime);
    this._slerpToEuler(this.rig.leftLeg.lower, new THREE.Euler(legBend, 0, 0), 10.0, deltaTime);
    this._slerpToEuler(this.rig.rightLeg.lower, new THREE.Euler(legBend, 0, 0), 10.0, deltaTime);

    // head follow with focus
    this._slerpToEuler(this.rig.head, new THREE.Euler(chestTilt * 0.5, -chestYaw * 0.5, 0), 8.0, deltaTime);

    // recoil impulse
    const recoil = strike > 0.8 ? (strike - 0.8) / 0.2 * 0.08 : 0;
    this.rig.pelvis.position.y = THREE.MathUtils.lerp(this.rig.pelvis.position.y, -recoil, deltaTime * 15);
  }
}