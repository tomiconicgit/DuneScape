// File: src/entities/Player.js
import * as THREE from 'three';

const states = { IDLE: 'idle', WALKING: 'walking', MINING: 'mining' };

export default class Player {
  constructor(scene, game) {
    this.game = game;
    this.state = states.IDLE;
    this.animationTimer = 0;
    this.idleBreathAmp = 0.02;

    this.rig = {};
    this.bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x8a8a8a,
        metalness: 0.2,
        roughness: 0.8,
    });

    this.mesh = this.createCharacterRig();
    this.mesh.position.set(50, 0.9, 102);
    scene.add(this.mesh);

    // Pathing
    this.path = [];
    this.speed = 4.0;

    // Mining
    this.miningTarget = null;
    this.miningTimer = 0;
    this.miningDuration = 4.0;

    // ✨ ADDED: Tap Marker
    const markerGeo = new THREE.RingGeometry(0, 0.5, 32);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.8, transparent: true });
    this.tapMarker = new THREE.Mesh(markerGeo, markerMat);
    this.tapMarker.rotation.x = -Math.PI / 2;
    this.tapMarker.visible = false;
    scene.add(this.tapMarker);
    this.markerAnimation = { active: false, time: 0, duration: 0.75 };
    
    // ✨ ADDED: Highlight management
    this.highlightedObject = null;
  }
  
  showTapMarkerAt(position) {
    this.tapMarker.position.copy(position);
    this.tapMarker.position.y += 0.1; // Prevent z-fighting
    this.tapMarker.visible = true;
    this.markerAnimation.active = true;
    this.markerAnimation.time = 0;
  }
  
  setHighlightedObject(object) {
      // Turn off previous highlight if it exists and is different
      if (this.highlightedObject && this.highlightedObject !== object) {
          if (this.highlightedObject.material.userData.uniforms?.uHighlight) {
              this.highlightedObject.material.userData.uniforms.uHighlight.value = 0.0;
          }
      }

      this.highlightedObject = object;

      // Turn on new highlight if an object is provided
      if (object) {
          if (object.material.userData.uniforms?.uHighlight) {
              object.material.userData.uniforms.uHighlight.value = 1.0;
          }
      }
  }

  createCharacterRig() {
    const root = new THREE.Group();
    root.name = 'playerRoot';
    const mat = this.bodyMaterial;

    const mkBone = (name, pos) => {
      const b = new THREE.Bone();
      b.name = name;
      if (pos) b.position.copy(pos);
      return b;
    };

    const hips = mkBone('mixamorig1Hips', new THREE.Vector3(0, 0.75, 0));
    root.add(hips);
    this.rig.hips = hips;

    const spine  = mkBone('mixamorig1Spine',  new THREE.Vector3(0, 0.25, 0));
    const spine1 = mkBone('mixamorig1Spine1', new THREE.Vector3(0, 0.25, 0));
    const spine2 = mkBone('mixamorig1Spine2', new THREE.Vector3(0, 0.22, 0));
    const neck   = mkBone('mixamorig1Neck',   new THREE.Vector3(0, 0.18, 0));
    const head   = mkBone('mixamorig1Head',   new THREE.Vector3(0, 0.2, 0));
    hips.add(spine); spine.add(spine1); spine1.add(spine2); spine2.add(neck); neck.add(head);
    Object.assign(this.rig, { spine, spine1, spine2, neck, head });

    const LShoulder = mkBone('mixamorig1LeftShoulder',  new THREE.Vector3( 0.35, 0.18, 0));
    const RShoulder = mkBone('mixamorig1RightShoulder', new THREE.Vector3(-0.35, 0.18, 0));
    spine2.add(LShoulder); spine2.add(RShoulder);
    this.rig.leftShoulder = LShoulder; this.rig.rightShoulder = RShoulder;

    const LArm = mkBone('mixamorig1LeftArm',     new THREE.Vector3(0,-0.18,0));
    const LFore= mkBone('mixamorig1LeftForeArm', new THREE.Vector3(0,-0.28,0));
    const LHand= mkBone('mixamorig1LeftHand',    new THREE.Vector3(0,-0.16,0));
    LShoulder.add(LArm); LArm.add(LFore); LFore.add(LHand);
    Object.assign(this.rig, { leftArm: LArm, leftForeArm: LFore, leftHand: LHand });

    const RArm = mkBone('mixamorig1RightArm',     new THREE.Vector3(0,-0.18,0));
    const RFore= mkBone('mixamorig1RightForeArm', new THREE.Vector3(0,-0.28,0));
    const RHand= mkBone('mixamorig1RightHand',    new THREE.Vector3(0,-0.16,0));
    RShoulder.add(RArm); RArm.add(RFore); RFore.add(RHand);
    Object.assign(this.rig, { rightArm: RArm, rightForeArm: RFore, rightHand: RHand });

    const LUpLeg = mkBone('mixamorig1LeftUpLeg',  new THREE.Vector3( 0.22, -0.4, 0));
    const LLeg   = mkBone('mixamorig1LeftLeg',    new THREE.Vector3(0,-0.36,0));
    const LFoot  = mkBone('mixamorig1LeftFoot',   new THREE.Vector3(0,-0.18,0));
    hips.add(LUpLeg); LUpLeg.add(LLeg); LLeg.add(LFoot);
    Object.assign(this.rig, { leftUpLeg: LUpLeg, leftLeg: LLeg, leftFoot: LFoot });

    const RUpLeg = mkBone('mixamorig1RightUpLeg', new THREE.Vector3(-0.22, -0.4, 0));
    const RLeg   = mkBone('mixamorig1RightLeg',   new THREE.Vector3(0, -0.36, 0));
    const RFoot  = mkBone('mixamorig1RightFoot',  new THREE.Vector3(0,-0.18,0));
    hips.add(RUpLeg); RUpLeg.add(RLeg); RLeg.add(RFoot);
    Object.assign(this.rig, { rightUpLeg: RUpLeg, rightLeg: RLeg, rightFoot: RFoot });

    this.rig.torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.6), mat);
    this.rig.torsoMesh.position.set(0, 0.75, 0);
    hips.add(this.rig.torsoMesh);

    this.rig.headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), mat);
    this.rig.headMesh.position.set(0, 0.2, 0);
    head.add(this.rig.headMesh);

    const armGeo = new THREE.CapsuleGeometry(0.15, 0.55, 4, 16);
    armGeo.translate(0, -0.275, 0);
    this.rig.leftArm.add(new THREE.Mesh(armGeo, mat));
    this.rig.leftForeArm.add(new THREE.Mesh(armGeo, mat));
    this.rig.rightArm.add(new THREE.Mesh(armGeo, mat));
    this.rig.rightForeArm.add(new THREE.Mesh(armGeo, mat));

    const legGeo = new THREE.CapsuleGeometry(0.18, 0.65, 4, 16);
    legGeo.translate(0, -0.325, 0);
    this.rig.leftUpLeg.add(new THREE.Mesh(legGeo, mat));
    this.rig.leftLeg.add(new THREE.Mesh(legGeo, mat));
    this.rig.rightUpLeg.add(new THREE.Mesh(legGeo, mat));
    this.rig.rightLeg.add(new THREE.Mesh(legGeo, mat));

    const footGeo = new THREE.BoxGeometry(0.28, 0.08, 0.45);
    const leftFoot = new THREE.Mesh(footGeo, mat);
    leftFoot.position.set(0, -0.18, 0.08);
    LFoot.add(leftFoot);
    const rightFoot = new THREE.Mesh(footGeo, mat);
    rightFoot.position.set(0, -0.18, 0.08);
    RFoot.add(rightFoot);

    root.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.layers.set(1); } });

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

    this.path = this.calculatePath(startGridX, startGridZ, targetGridX, targetGridZ);

    if (this.path.length > 0) {
      this.state = states.WALKING;
    } else {
      this.state = states.IDLE;
    }
  }

  calculatePath(startX, startZ, endX, endZ) {
    const grid = this.game.grid;
    if (!grid) return [];

    const open = [];
    const closed = new Set();
    const start = { x: startX, z: startZ, g: 0, h: 0, f: 0, parent: null };
    const goal = { x: endX, z: endZ };
    open.push(start);

    const H = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);

    while (open.length) {
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift();
      if (cur.x === goal.x && cur.z === goal.z) {
        const path = [];
        let t = cur;
        while (t) { path.push(new THREE.Vector2(t.x, t.z)); t = t.parent; }
        return path.reverse();
      }
      closed.add(`${cur.x},${cur.z}`);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dz === 0) continue;
          const nx = cur.x + dx;
          const nz = cur.z + dz;
          if (nx < 0 || nx >= grid.length || nz < 0 || nz >= grid[0].length || grid[nx][nz] === 1) continue;
          if (closed.has(`${nx},${nz}`)) continue;

          const g = cur.g + ((dx && dz) ? 1.414 : 1);
          let n = open.find(o => o.x === nx && o.z === nz);
          if (!n || g < n.g) {
            if (!n) { n = { x: nx, z: nz }; open.push(n); }
            n.g = g;
            n.h = H(n, goal);
            n.f = n.g + n.h;
            n.parent = cur;
          }
        }
      }
    }
    return [];
  }

  update(deltaTime) {
    this.animationTimer += deltaTime;
    
    // ✨ ADDED: Marker animation update loop
    if (this.markerAnimation.active) {
        this.markerAnimation.time += deltaTime;
        const progress = this.markerAnimation.time / this.markerAnimation.duration;
        const scale = 1.5 * progress;
        this.tapMarker.scale.set(scale, scale, scale);
        this.tapMarker.material.opacity = 0.8 * (1 - progress);

        if (progress >= 1) {
            this.markerAnimation.active = false;
            this.tapMarker.visible = false;
        }
    }

    if (this.state === states.WALKING && this.path.length === 0) {
      this.state = this.miningTarget ? states.MINING : states.IDLE;
      this.miningTimer = 0;
    }

    if (this.state === states.WALKING) this.updateMovement(deltaTime);

    switch (this.state) {
      case states.WALKING: this.updateWalkAnimation(); break;
      case states.MINING:  this.updateMineAnimation(); this.updateMineTimer(deltaTime); break;
      default:             this.updateIdleAnimation(); break;
    }
  }

  updateMovement(deltaTime) {
    if (this.path.length === 0) return;

    const targetNode = this.path[0];
    const targetPosition = new THREE.Vector3(targetNode.x, this.mesh.position.y, targetNode.y);

    const direction = targetPosition.clone().sub(this.mesh.position);
    this.mesh.rotation.y = Math.atan2(direction.x, direction.z);

    const distance = direction.length();
    const moveDistance = this.speed * deltaTime;

    if (distance <= moveDistance) {
        this.mesh.position.copy(targetPosition);
        this.path.shift();
    } else {
        this.mesh.position.add(direction.normalize().multiplyScalar(moveDistance));
    }
  }

  updateMineTimer(dt) {
    this.miningTimer += dt;
    if (this.miningTimer >= this.miningDuration) {
      if (this.miningTarget?.userData?.onMined) this.miningTarget.userData.onMined();
      this.miningTarget = null;
      this.state = states.IDLE;
    }
  }
  
  updateIdleAnimation() {
    const t = this.animationTimer * 1.2;
    const amp = this.idleBreathAmp;

    this.rig.hips.position.y = 0.75 + Math.sin(t * 0.7) * amp;
    this.rig.spine.rotation.x = Math.sin(t * 0.5) * 0.02;

    this.rig.leftShoulder.rotation.z  = Math.sin(t * 0.6)      * 0.06;
    this.rig.rightShoulder.rotation.z = Math.sin(t * 0.6 + 0.9) * 0.05;
    this.rig.leftArm.rotation.x       = Math.sin(t * 0.6 + 0.4) * 0.03;
    this.rig.rightArm.rotation.x      = Math.sin(t * 0.6 - 0.2) * 0.03;

    this.rig.neck.rotation.y = Math.sin(t * 0.35) * 0.08;
    this.rig.head.rotation.y = Math.sin(t * 0.25 - 0.3) * 0.06;

    this.rig.leftUpLeg.rotation.x  = Math.sin(t * 0.5) * 0.02;
    this.rig.rightUpLeg.rotation.x = Math.sin(t * 0.5 + Math.PI) * 0.02;
  }

  updateWalkAnimation() {
    const t = this.animationTimer * 6 * 1.4;
    const stepArc = 0.9, stepLift = 0.18, hipSway = 0.12, torsoTwist = 0.18;
    const L = Math.sin(t), R = Math.sin(t + Math.PI);

    this.rig.hips.position.y = 0.75 + Math.abs(Math.cos(t)) * -0.02;
    this.rig.hips.position.x = Math.cos(t) * hipSway * 0.2;

    this.rig.leftUpLeg.rotation.x  = THREE.MathUtils.clamp(L * stepArc, -1.2, 1.2);
    this.rig.rightUpLeg.rotation.x = THREE.MathUtils.clamp(R * stepArc, -1.2, 1.2);
    this.rig.leftLeg.rotation.x  = Math.max(0, -L) * 0.9;
    this.rig.rightLeg.rotation.x = Math.max(0, -R) * 0.9;

    this.rig.leftFoot.position.y  = (Math.max(0, L) * -stepLift) / 3;
    this.rig.rightFoot.position.y = (Math.max(0, R) * -stepLift) / 3;

    const armSwing = 0.9;
    this.rig.leftArm.rotation.x  = THREE.MathUtils.clamp(-L * armSwing, -1.0, 1.0);
    this.rig.rightArm.rotation.x = THREE.MathUtils.clamp(-R * armSwing, -1.0, 1.0);
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

    const t = this.miningTimer * 2.4;
    const backSwing = Math.sin(t) * -0.8;
    const downSwing = Math.sin(t * 2.0) * 1.2;
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
