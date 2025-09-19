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
    this.mesh.position.set(50, 0.9, 102);
    scene.add(this.mesh);

    this.path = [];
    this.speed = 4.0;
    this.tileSize = 1.0;

    this.isMining = false;
    this.miningTarget = null;
    this.miningTimer = 0;
    this.miningDuration = 4.0;

    // --- marker + path line (debug) ---
    const markerGeo = new THREE.BufferGeometry();
    markerGeo.setFromPoints([
      new THREE.Vector3(-0.5, 0, -0.5),
      new THREE.Vector3(0.5, 0, 0.5),
      new THREE.Vector3(0.5, 0, -0.5),
      new THREE.Vector3(-0.5, 0, 0.5)
    ]);
    this.marker = new THREE.LineSegments(
      markerGeo,
      new THREE.LineBasicMaterial({ color: 0xff0000 })
    );
    this.marker.visible = false;
    scene.add(this.marker);

    const pathGeo = new THREE.BufferGeometry();
    pathGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    this.pathLine = new THREE.Line(
      pathGeo,
      new THREE.LineDashedMaterial({ color: 0xff0000, dashSize: 0.2, gapSize: 0.1 })
    );
    this.pathLine.visible = false;
    scene.add(this.pathLine);
  }

  // --- utility: limb builder with skinning ---
  createSkinnedLimb(boneChain, length = 1.0, radius = 0.15, color = 0x666688) {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8, 16);
    geometry.translate(0, -length / 2, 0);

    const skinIndices = [];
    const skinWeights = [];
    const posAttr = geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      if (y > -length * 0.25) {
        skinIndices.push(0, 1, 0, 0);
        skinWeights.push(0.6, 0.4, 0, 0);
      } else if (y > -length * 0.75) {
        skinIndices.push(1, 2, 0, 0);
        skinWeights.push(0.6, 0.4, 0, 0);
      } else {
        skinIndices.push(1, 2, 0, 0);
        skinWeights.push(0.2, 0.8, 0, 0);
      }
    }

    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    const material = new THREE.MeshStandardMaterial({ color, skinning: true });
    const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
    const skeleton = new THREE.Skeleton(boneChain);
    skinnedMesh.add(boneChain[0]);
    skinnedMesh.bind(skeleton);
    skinnedMesh.userData.skeleton = skeleton;
    return skinnedMesh;
  }

  // --- character rig ---
  createCharacterRig() {
    const root = new THREE.Group();

    // bones
    const hips = new THREE.Bone(); hips.position.y = 0.9;
    const spine = new THREE.Bone(); spine.position.y = 0.25;
    const spine1 = new THREE.Bone(); spine1.position.y = 0.25;
    const spine2 = new THREE.Bone(); spine2.position.y = 0.25;
    const neck = new THREE.Bone(); neck.position.y = 0.18;
    const head = new THREE.Bone(); head.position.y = 0.2;

    hips.add(spine); spine.add(spine1); spine1.add(spine2); spine2.add(neck); neck.add(head);

    const leftShoulder = new THREE.Bone(); leftShoulder.position.set(0.35, 0.18, 0);
    const leftArm = new THREE.Bone(); leftArm.position.set(0, -0.18, 0);
    const leftForeArm = new THREE.Bone(); leftForeArm.position.set(0, -0.28, 0);
    const leftHand = new THREE.Bone(); leftHand.position.set(0, -0.16, 0);
    spine2.add(leftShoulder); leftShoulder.add(leftArm); leftArm.add(leftForeArm); leftForeArm.add(leftHand);

    const rightShoulder = new THREE.Bone(); rightShoulder.position.set(-0.35, 0.18, 0);
    const rightArm = new THREE.Bone(); rightArm.position.set(0, -0.18, 0);
    const rightForeArm = new THREE.Bone(); rightForeArm.position.set(0, -0.28, 0);
    const rightHand = new THREE.Bone(); rightHand.position.set(0, -0.16, 0);
    spine2.add(rightShoulder); rightShoulder.add(rightArm); rightArm.add(rightForeArm); rightForeArm.add(rightHand);

    const leftUpLeg = new THREE.Bone(); leftUpLeg.position.set(0.22, -0.4, 0);
    const leftLeg = new THREE.Bone(); leftLeg.position.y = -0.4;
    const leftFoot = new THREE.Bone(); leftFoot.position.y = -0.2;
    hips.add(leftUpLeg); leftUpLeg.add(leftLeg); leftLeg.add(leftFoot);

    const rightUpLeg = new THREE.Bone(); rightUpLeg.position.set(-0.22, -0.4, 0);
    const rightLeg = new THREE.Bone(); rightLeg.position.y = -0.4;
    const rightFoot = new THREE.Bone(); rightFoot.position.y = -0.2;
    hips.add(rightUpLeg); rightUpLeg.add(rightLeg); rightLeg.add(rightFoot);

    // torso mesh
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5, 4, 4, 4);
    torsoGeo.translate(0, 0.6, 0);
    const torsoSI = [], torsoSW = [];
    for (let i = 0; i < torsoGeo.attributes.position.count; i++) {
      const y = torsoGeo.attributes.position.getY(i);
      if (y < 0.6) { torsoSI.push(0,1,0,0); torsoSW.push(0.7,0.3,0,0); }
      else { torsoSI.push(1,0,0,0); torsoSW.push(1,0,0,0); }
    }
    torsoGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(torsoSI, 4));
    torsoGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(torsoSW, 4));
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x777799, skinning: true });
    const torsoMesh = new THREE.SkinnedMesh(torsoGeo, torsoMat);
    torsoMesh.add(hips);
    const torsoSkel = new THREE.Skeleton([hips, spine, spine1, spine2]);
    torsoMesh.bind(torsoSkel);
    torsoMesh.userData.skeleton = torsoSkel;
    root.add(torsoMesh);

    // limbs
    root.add(this.createSkinnedLimb([leftArm, leftForeArm, leftHand], 0.7, 0.1, 0x88aaee));
    root.add(this.createSkinnedLimb([rightArm, rightForeArm, rightHand], 0.7, 0.1, 0x88aaee));
    root.add(this.createSkinnedLimb([leftUpLeg, leftLeg, leftFoot], 1.0, 0.12, 0xaa8866));
    root.add(this.createSkinnedLimb([rightUpLeg, rightLeg, rightFoot], 1.0, 0.12, 0xaa8866));

    // head
    const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const hSI = [], hSW = [];
    for (let i = 0; i < headGeo.attributes.position.count; i++) {
      hSI.push(1,0,0,0); hSW.push(1,0,0,0);
    }
    headGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(hSI, 4));
    headGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(hSW, 4));
    const headMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, skinning: true });
    const headMesh = new THREE.SkinnedMesh(headGeo, headMat);
    headMesh.add(neck);
    const headSkel = new THREE.Skeleton([neck, head]);
    headMesh.bind(headSkel);
    headMesh.userData.skeleton = headSkel;
    root.add(headMesh);

    // expose rig
    this.rig = { hips, spine, spine1, spine2, neck, head,
      leftShoulder, leftArm, leftForeArm, leftHand,
      rightShoulder, rightArm, rightForeArm, rightHand,
      leftUpLeg, leftLeg, leftFoot,
      rightUpLeg, rightLeg, rightFoot };

    return root;
  }

  // --- movement + pathfinding ---
  moveTo(targetPosition) {
    this.isMining = false;
    const tx = Math.round(targetPosition.x);
    const tz = Math.round(targetPosition.z);
    const sx = Math.round(this.mesh.position.x);
    const sz = Math.round(this.mesh.position.z);

    this.marker.position.set(tx, targetPosition.y + 0.1, tz);
    this.marker.visible = true;

    this.path = this.calculatePath(sx, sz, tx, tz);
    if (this.path.length > 0) {
      this.state = states.WALKING;
      this.pathLine.visible = true;
      this.updatePathLine();
    } else {
      this.state = states.IDLE;
      this.marker.visible = false;
    }
  }

  calculatePath(sx, sz, ex, ez) {
    const grid = this.game.grid;
    if (!grid) return [];
    const open = [];
    const closed = new Set();
    const start = { x: sx, z: sz, g: 0, h: 0, f: 0, parent: null };
    const end = { x: ex, z: ez };
    open.push(start);

    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);

    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();
      if (current.x === end.x && current.z === end.z) {
        const path = [];
        let n = current;
        while (n) { path.push(new THREE.Vector2(n.x, n.z)); n = n.parent; }
        return path.reverse();
      }
      closed.add(`${current.x},${current.z}`);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dz === 0) continue;
          const nx = current.x + dx, nz = current.z + dz;
          if (nx < 0 || nx >= grid.length || nz < 0 || nz >= grid[0].length) continue;
          if (grid[nx][nz] === 1) continue;
          if (closed.has(`${nx},${nz}`)) continue;
          const g = current.g + (dx && dz ? 1.414 : 1);
          let neighbor = open.find(n => n.x === nx && n.z === nz);
          if (!neighbor || g < neighbor.g) {
            if (!neighbor) { neighbor = { x: nx, z: nz }; open.push(neighbor); }
            neighbor.g = g;
            neighbor.h = heuristic(neighbor, end);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.parent = current;
          }
        }
      }
    }
    return [];
  }

  updatePathLine() {
    if (!this.marker.visible) return;
    const pos = this.pathLine.geometry.attributes.position.array;
    pos[0] = this.mesh.position.x;
    pos[1] = 0.1;
    pos[2] = this.mesh.position.z;
    pos[3] = this.marker.position.x;
    pos[4] = this.marker.position.y;
    pos[5] = this.marker.position.z;
    this.pathLine.geometry.attributes.position.needsUpdate = true;
    this.pathLine.computeLineDistances();
  }

  updateMovement(deltaTime) {
    if (this.path.length === 0) return;
    const next = this.path[0];
    const targetPos = new THREE.Vector3(next.x, this.mesh.position.y, next.z);
    const dist = this.mesh.position.clone().setY(0).distanceTo(targetPos.clone().setY(0));
    if (dist < 0.1) {
      this.mesh.position.x = targetPos.x;
      this.mesh.position.z = targetPos.z;
      this.path.shift();
    } else {
      const dir = targetPos.clone().sub(this.mesh.position).normalize();
      this.mesh.position.add(dir.multiplyScalar(this.speed * deltaTime));
      this.mesh.lookAt(new THREE.Vector3(targetPos.x, this.mesh.position.y, targetPos.z));
    }
    this.updatePathLine();
  }

  // --- animations ---
  updateIdleAnimation(dt) {
    const t = this.animationTimer;
    this.rig.spine.rotation.x = Math.sin(t * 0.8) * 0.05;
    this.rig.leftArm.rotation.x = Math.sin(t * 0.6) * 0.1;
    this.rig.rightArm.rotation.x = Math.sin(t * 0.6 + Math.PI) * 0.1;
  }

  updateWalkAnimation(dt) {
    const speed = 6.0;
    const angle = Math.sin(this.animationTimer * speed) * 0.6;
    const opp = Math.sin(this.animationTimer * speed + Math.PI) * 0.6;
    this.rig.leftUpLeg.rotation.x = angle;
    this.rig.rightUpLeg.rotation.x = opp;
    this.rig.leftArm.rotation.x = opp * 0.5;
    this.rig.rightArm.rotation.x = angle * 0.5;
  }

  updateMiningAnimation(dt) {
    const angle = Math.sin(this.animationTimer * 8.0) * 1.2;
    this.rig.rightArm.rotation.x = -angle;
    this.rig.rightForeArm.rotation.x = angle * 0.5;
    this.rig.leftArm.rotation.x = angle * 0.2;
  }

  // --- main update loop ---
  update(deltaTime) {
    this.animationTimer += deltaTime;
    if (this.state === states.WALKING && this.path.length === 0) {
      this.state = this.miningTarget ? states.MINING : states.IDLE;
      this.miningTimer = 0;
      this.marker.visible = false;
      this.pathLine.visible = false;
    }
    if (this.state === states.WALKING) this.updateMovement(deltaTime);
    switch (this.state) {
      case states.IDLE: this.updateIdleAnimation(deltaTime); break;
      case states.WALKING: this.updateWalkAnimation(deltaTime); break;
      case states.MINING: this.updateMiningAnimation(deltaTime); break;
    }
  }
}