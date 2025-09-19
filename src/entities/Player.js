// File: src/entities/Player.js
import * as THREE from 'three';
import { SubdivisionModifier } from 'three/examples/jsm/modifiers/SubdivisionModifier.js';

const states = { IDLE: 'idle', WALKING: 'walking', MINING: 'mining' };

export default class Player {
  constructor(scene, game) {
    this.game = game;
    this.state = states.IDLE;
    this.animationTimer = 0;

    // -------- Customisation params (live-editable by DeveloperBar) --------
    this.params = {
      // Offsets
      offsets: {
        headY: 0.2,
        shoulderX: 0.35,
        hipX: 0.22,
      },
      // Torso geometry
      torso: {
        w: 1.0, h: 1.5, d: 0.6,
        segments: 8,
        subdiv: 0,             // Catmull-Clark steps
        roundness: 0.0,        // 0..1 corner rounding (via modifier pass)
      },
      // Arms
      arms: {
        type: 'capsule',       // 'capsule' | 'cylinder'
        radius: 0.15, length: 0.55,
        radialSeg: 16, heightSeg: 1,
        subdiv: 0,             // extra smoothing
        thicknessXZ: 1.0,      // scale x/z
      },
      // Legs
      legs: {
        type: 'capsule',
        radius: 0.18, length: 0.65,
        radialSeg: 16, heightSeg: 1,
        subdiv: 0,
        thicknessXZ: 1.0,
      },
      // Feet
      feet: { scale: 1.0 },
      // Materials / texture blend
      mat: {
        color: new THREE.Color(0x666688),
        secondary: new THREE.Color(0xffccaa),
        metalness: 0.1,
        roughness: 0.8,
        noiseBlend: 0.35,  // 0..1 mix secondary into base using noise
        noiseScale: 3.0,   // world-space scale for noise
      },
      // Idle animation
      idleBreathAmp: 0.02,
    };

    this.rig = {};
    this.mesh = this.createCharacterRig();
    this.mesh.position.set(50, 0.9, 102);
    scene.add(this.mesh);

    // Pathing
    this.path = [];
    this.speed = 4.0;

    this.isMining = false;
    this.miningTarget = null;
    this.miningTimer = 0;
    this.miningDuration = 4.0;

    // Marker & line
    const xMarkerGeo = new THREE.BufferGeometry();
    const s = 0.75;
    xMarkerGeo.setFromPoints([
      new THREE.Vector3(-s,0,-s), new THREE.Vector3(s,0,s),
      new THREE.Vector3(s,0,-s),  new THREE.Vector3(-s,0,s)
    ]);
    this.marker = new THREE.LineSegments(xMarkerGeo, new THREE.LineBasicMaterial({ color: 0xff0000 }));
    this.marker.visible = false;
    scene.add(this.marker);

    const pathGeo = new THREE.BufferGeometry();
    pathGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2*3), 3));
    this.pathLine = new THREE.Line(pathGeo, new THREE.LineDashedMaterial({ color: 0xff0000, dashSize: 0.2, gapSize: 0.1 }));
    this.pathLine.visible = false;
    scene.add(this.pathLine);
  }

  // ------------------ MATERIAL (with noise blend) ------------------
  buildBodyMaterial() {
    const mat = new THREE.MeshStandardMaterial({
      color: this.params.mat.color.clone(),
      metalness: this.params.mat.metalness,
      roughness: this.params.mat.roughness,
    });

    mat.userData.uniforms = {
      uNoiseBlend:     { value: this.params.mat.noiseBlend },
      uNoiseScale:     { value: this.params.mat.noiseScale },
      uSecondaryColor: { value: this.params.mat.secondary.clone() },
    };

    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, mat.userData.uniforms);
      shader.vertexShader = `
        varying vec3 vWorldPos;
        ${shader.vertexShader}
      `.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        `
      );

      shader.fragmentShader = `
        uniform float uNoiseBlend;
        uniform float uNoiseScale;
        uniform vec3  uSecondaryColor;
        varying vec3  vWorldPos;

        // simple hash noise
        float hash31(vec3 p){
          p = fract(p*0.3183099 + vec3(0.71,0.113,0.419));
          p *= 17.0;
          return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
        }
        ${shader.fragmentShader}
      `.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        // Mix secondary color into base using noise
        float n = hash31(vWorldPos * uNoiseScale);
        vec3 mixedCol = mix(diffuseColor.rgb, uSecondaryColor, uNoiseBlend * smoothstep(0.4, 1.0, n));
        diffuseColor.rgb = mixedCol;
        `
      );
    };

    return mat;
  }

  // ------------------ RIG + MESHES ------------------
  createCharacterRig() {
    const root = new THREE.Group();
    root.name = 'playerRoot';

    const mat = this.buildBodyMaterial();
    this.bodyMaterial = mat;

    const mkBone = (name, pos) => {
      const b = new THREE.Bone();
      b.name = name;
      if (pos) b.position.copy(pos);
      return b;
    };

    // Hips
    const hips = mkBone('mixamorig1Hips', new THREE.Vector3(0, 0.75, 0));
    root.add(hips);
    this.rig.hips = hips;

    // Spine chain
    const spine  = mkBone('mixamorig1Spine',  new THREE.Vector3(0, 0.25, 0));
    const spine1 = mkBone('mixamorig1Spine1', new THREE.Vector3(0, 0.25, 0));
    const spine2 = mkBone('mixamorig1Spine2', new THREE.Vector3(0, 0.22, 0));
    const neck   = mkBone('mixamorig1Neck',   new THREE.Vector3(0, 0.18, 0));
    const head   = mkBone('mixamorig1Head',   new THREE.Vector3(0, this.params.offsets.headY, 0));
    hips.add(spine); spine.add(spine1); spine1.add(spine2); spine2.add(neck); neck.add(head);
    Object.assign(this.rig, { spine, spine1, spine2, neck, head });

    // Shoulders
    const LShoulder = mkBone('mixamorig1LeftShoulder',  new THREE.Vector3( this.params.offsets.shoulderX, 0.18, 0));
    const RShoulder = mkBone('mixamorig1RightShoulder', new THREE.Vector3(-this.params.offsets.shoulderX, 0.18, 0));
    spine2.add(LShoulder); spine2.add(RShoulder);
    this.rig.leftShoulder = LShoulder; this.rig.rightShoulder = RShoulder;

    // Arms bones
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

    // Legs bones
    const LUpLeg = mkBone('mixamorig1LeftUpLeg',  new THREE.Vector3( this.params.offsets.hipX, -0.4, 0));
    const LLeg   = mkBone('mixamorig1LeftLeg',    new THREE.Vector3(0,-0.36,0));
    const LFoot  = mkBone('mixamorig1LeftFoot',   new THREE.Vector3(0,-0.18,0));
    hips.add(LUpLeg); LUpLeg.add(LLeg); LLeg.add(LFoot);
    Object.assign(this.rig, { leftUpLeg: LUpLeg, leftLeg: LLeg, leftFoot: LFoot });

    const RUpLeg = mkBone('mixamorig1RightUpLeg', new THREE.Vector3(-this.params.offsets.hipX, -0.4, 0));
    const RLeg   = mkBone('mixamorig1RightLeg', new THREE.Vector3(0, -0.36, 0));
    const RFoot  = mkBone('mixamorig1RightFoot',  new THREE.Vector3(0,-0.18,0));
    hips.add(RUpLeg); RUpLeg.add(RLeg); RLeg.add(RFoot);
    Object.assign(this.rig, { rightUpLeg: RUpLeg, rightLeg: RLeg, rightFoot: RFoot });

    // Torso mesh (rebuild from params)
    this.rig.torsoMesh = new THREE.Mesh(this.buildTorsoGeometry(), mat);
    this.rig.torsoMesh.position.set(0, 0.75, 0);
    hips.add(this.rig.torsoMesh);

    // Head mesh
    this.rig.headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), mat);
    this.rig.headMesh.position.set(0, 0.2, 0);
    head.add(this.rig.headMesh);

    // Limbs visuals
    const [lUpperArmMesh, lLowerArmMesh] = this.buildArmMeshes();
    const [rUpperArmMesh, rLowerArmMesh] = this.buildArmMeshes();
    this.rig.leftArm.add(lUpperArmMesh);  this.rig.leftForeArm.add(lLowerArmMesh);
    this.rig.rightArm.add(rUpperArmMesh); this.rig.rightForeArm.add(rLowerArmMesh);
    Object.assign(this.rig, {
      leftUpperArmMesh: lUpperArmMesh, leftLowerArmMesh: lLowerArmMesh,
      rightUpperArmMesh: rUpperArmMesh, rightLowerArmMesh: rLowerArmMesh,
    });

    const [lUpperLegMesh, lLowerLegMesh] = this.buildLegMeshes();
    const [rUpperLegMesh, rLowerLegMesh] = this.buildLegMeshes();
    this.rig.leftUpLeg.add(lUpperLegMesh);  this.rig.leftLeg.add(lLowerLegMesh);
    this.rig.rightUpLeg.add(rUpperLegMesh); this.rig.rightLeg.add(rLowerLegMesh);
    Object.assign(this.rig, {
      leftUpperLegMesh: lUpperLegMesh, leftLowerLegMesh: lLowerLegMesh,
      rightUpperLegMesh: rUpperLegMesh, rightLowerLegMesh: rLowerLegMesh,
    });

    // Feet boxes
    const footGeo = new THREE.BoxGeometry(0.28, 0.08, 0.45);
    this.rig.leftFootMesh = new THREE.Mesh(footGeo, mat);
    this.rig.leftFootMesh.position.set(0, -0.18, 0.08);
    this.rig.leftFootMesh.scale.setScalar(this.params.feet.scale);
    LFoot.add(this.rig.leftFootMesh);

    this.rig.rightFootMesh = new THREE.Mesh(footGeo.clone(), mat);
    this.rig.rightFootMesh.position.set(0, -0.18, 0.08);
    this.rig.rightFootMesh.scale.setScalar(this.params.feet.scale);
    RFoot.add(this.rig.rightFootMesh);

    // Shadows + layer
    root.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.layers.set(1); } });

    return root;
  }

  // ------------------ GEOMETRY BUILDERS ------------------
  buildTorsoGeometry() {
    const p = this.params.torso;
    // Base: Box with segments -> optional rounding by quick inflate+subdiv
    let geo = new THREE.BoxGeometry(p.w, p.h, p.d, p.segments, p.segments, p.segments);

    if (p.roundness > 0) {
      // Push vertices toward a rounded shape (approximate bevel)
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const nx = (v.x / (p.w * 0.5));
        const ny = (v.y / (p.h * 0.5));
        const nz = (v.z / (p.d * 0.5));
        const r = Math.sqrt(nx*nx + ny*ny + nz*nz);
        const f = THREE.MathUtils.lerp(1.0, 0.9, p.roundness) / (r || 1.0);
        v.multiplyScalar(f);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
    }

    if (p.subdiv > 0) {
      const mod = new SubdivisionModifier(p.subdiv);
      geo = mod.modify(geo);
    }
    return geo;
  }

  buildArmMeshes() {
    const a = this.params.arms;
    let upper, lower;

    if (a.type === 'capsule') {
      upper = new THREE.Mesh(
        new THREE.CapsuleGeometry(a.radius, a.length, Math.max(2, a.heightSeg), Math.max(4, a.radialSeg)),
        this.bodyMaterial
      );
      lower = new THREE.Mesh(
        new THREE.CapsuleGeometry(a.radius * 0.95, a.length * 1.0, Math.max(2, a.heightSeg), Math.max(4, a.radialSeg)),
        this.bodyMaterial
      );
      // pivot at top for both (align with bones pointing down Y)
      upper.geometry.translate(0, -a.length/2, 0);
      lower.geometry.translate(0, -a.length/2, 0);
    } else {
      // cylinder
      upper = new THREE.Mesh(
        new THREE.CylinderGeometry(a.radius, a.radius, a.length, Math.max(4, a.radialSeg), Math.max(1, a.heightSeg)),
        this.bodyMaterial
      );
      lower = new THREE.Mesh(
        new THREE.CylinderGeometry(a.radius * 0.95, a.radius * 0.95, a.length, Math.max(4, a.radialSeg), Math.max(1, a.heightSeg)),
        this.bodyMaterial
      );
      upper.geometry.translate(0, -a.length/2, 0);
      lower.geometry.translate(0, -a.length/2, 0);
    }

    if (a.subdiv > 0) {
      const mod = new SubdivisionModifier(a.subdiv);
      upper.geometry = mod.modify(upper.geometry);
      lower.geometry = mod.modify(lower.geometry);
    }

    // thickness scaling
    upper.scale.x = upper.scale.z = a.thicknessXZ;
    lower.scale.x = lower.scale.z = a.thicknessXZ;

    return [upper, lower];
  }

  buildLegMeshes() {
    const l = this.params.legs;
    let upper, lower;

    if (l.type === 'capsule') {
      upper = new THREE.Mesh(
        new THREE.CapsuleGeometry(l.radius, l.length, Math.max(2, l.heightSeg), Math.max(4, l.radialSeg)),
        this.bodyMaterial
      );
      lower = new THREE.Mesh(
        new THREE.CapsuleGeometry(l.radius * 0.95, l.length, Math.max(2, l.heightSeg), Math.max(4, l.radialSeg)),
        this.bodyMaterial
      );
      upper.geometry.translate(0, -l.length/2, 0);
      lower.geometry.translate(0, -l.length/2, 0);
    } else {
      upper = new THREE.Mesh(
        new THREE.CylinderGeometry(l.radius, l.radius, l.length, Math.max(4, l.radialSeg), Math.max(1, l.heightSeg)),
        this.bodyMaterial
      );
      lower = new THREE.Mesh(
        new THREE.CylinderGeometry(l.radius * 0.95, l.radius * 0.95, l.length, Math.max(4, l.radialSeg), Math.max(1, l.heightSeg)),
        this.bodyMaterial
      );
      upper.geometry.translate(0, -l.length/2, 0);
      lower.geometry.translate(0, -l.length/2, 0);
    }

    if (l.subdiv > 0) {
      const mod = new SubdivisionModifier(l.subdiv);
      upper.geometry = mod.modify(upper.geometry);
      lower.geometry = mod.modify(lower.geometry);
    }

    upper.scale.x = upper.scale.z = l.thicknessXZ;
    lower.scale.x = lower.scale.z = l.thicknessXZ;

    return [upper, lower];
  }

  // ------------------ REBUILD HELPERS (called by UI) ------------------
  rebuildTorso() {
    const newGeo = this.buildTorsoGeometry();
    this.rig.torsoMesh.geometry.dispose();
    this.rig.torsoMesh.geometry = newGeo;
  }

  rebuildArms() {
    const old = [
      this.rig.leftUpperArmMesh, this.rig.leftLowerArmMesh,
      this.rig.rightUpperArmMesh, this.rig.rightLowerArmMesh
    ];
    const [lU, lL] = this.buildArmMeshes();
    const [rU, rL] = this.buildArmMeshes();

    this.rig.leftArm.remove(old[0]); this.rig.leftForeArm.remove(old[1]);
    this.rig.rightArm.remove(old[2]); this.rig.rightForeArm.remove(old[3]);
    old.forEach(m => { m.geometry.dispose(); });

    this.rig.leftUpperArmMesh = lU; this.rig.leftLowerArmMesh = lL;
    this.rig.rightUpperArmMesh = rU; this.rig.rightLowerArmMesh = rL;

    this.rig.leftArm.add(lU); this.rig.leftForeArm.add(lL);
    this.rig.rightArm.add(rU); this.rig.rightForeArm.add(rL);
  }

  rebuildLegs() {
    const old = [
      this.rig.leftUpperLegMesh, this.rig.leftLowerLegMesh,
      this.rig.rightUpperLegMesh, this.rig.rightLowerLegMesh
    ];
    const [lU, lL] = this.buildLegMeshes();
    const [rU, rL] = this.buildLegMeshes();

    this.rig.leftUpLeg.remove(old[0]); this.rig.leftLeg.remove(old[1]);
    this.rig.rightUpLeg.remove(old[2]); this.rig.rightLeg.remove(old[3]);
    old.forEach(m => { m.geometry.dispose(); });

    this.rig.leftUpperLegMesh = lU; this.rig.leftLowerLegMesh = lL;
    this.rig.rightUpperLegMesh = rU; this.rig.rightLowerLegMesh = rL;

    this.rig.leftUpLeg.add(lU); this.rig.leftLeg.add(lL);
    this.rig.rightUpLeg.add(rU); this.rig.rightLeg.add(rL);
  }

  // ------------------ GAMEPLAY ------------------
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

  updatePathLine() {
    if (!this.marker.visible) return;
    const pos = this.pathLine.geometry.attributes.position.array;
    pos[0] = this.mesh.position.x; pos[1] = 0.1; pos[2] = this.mesh.position.z;
    pos[3] = this.marker.position.x; pos[4] = this.marker.position.y; pos[5] = this.marker.position.z;
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

    if (this.state === states.WALKING) this.updateMovement(deltaTime);

    switch (this.state) {
      case states.WALKING: this.updateWalkAnimation(); break;
      case states.MINING:  this.updateMineAnimation(); this.updateMineTimer(deltaTime); break;
      default:             this.updateIdleAnimation(); break;
    }
  }

  updateMovement(deltaTime) {
    if (!this.path.length) return;
    const next = this.path[0];
    const target = new THREE.Vector3(next.x, this.mesh.position.y, next.z);
    const dist = this.mesh.position.clone().setY(0).distanceTo(target.clone().setY(0));

    if (dist < 0.1) {
      this.mesh.position.x = target.x;
      this.mesh.position.z = target.z;
      this.path.shift();
    } else {
      const dir = target.clone().sub(this.mesh.position).normalize();
      this.mesh.position.add(dir.multiplyScalar(this.speed * deltaTime));
      this.mesh.lookAt(new THREE.Vector3(target.x, this.mesh.position.y, target.z));
    }
    this.updatePathLine();
  }

  updateMineTimer(dt) {
    this.miningTimer += dt;
    if (this.miningTimer >= this.miningDuration) {
      if (this.miningTarget?.userData?.onMined) this.miningTarget.userData.onMined();
      this.miningTarget = null;
      this.state = states.IDLE;
    }
  }

  // ------------------ Animations ------------------
  updateIdleAnimation() {
    const t = this.animationTimer * 1.2;
    const amp = this.params.idleBreathAmp;

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