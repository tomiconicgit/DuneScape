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

    // === Customisation defaults ===
    this.idleBreathAmp = 0.02; // breathing amplitude

    // Marker & path visuals
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

  // --- Build skeleton and attach basic meshes ---
  createCharacterRig() {
    const root = new THREE.Group();
    root.name = 'playerRoot';

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x666688, roughness: 0.8, metalness: 0.1 });

    const makeBone = (name, pos = new THREE.Vector3()) => {
      const b = new THREE.Bone();
      b.name = name;
      b.position.copy(pos);
      return b;
    };

    // HIPS root
    const hips = makeBone('mixamorig1Hips', new THREE.Vector3(0, 0.75, 0));
    root.add(hips);
    this.rig.hips = hips;

    // Spine chain
    const spine = makeBone('mixamorig1Spine', new THREE.Vector3(0, 0.25, 0));
    const spine1 = makeBone('mixamorig1Spine1', new THREE.Vector3(0, 0.25, 0));
    const spine2 = makeBone('mixamorig1Spine2', new THREE.Vector3(0, 0.22, 0));
    const neck = makeBone('mixamorig1Neck', new THREE.Vector3(0, 0.18, 0));
    const head = makeBone('mixamorig1Head', new THREE.Vector3(0, 0.2, 0));

    hips.add(spine); spine.add(spine1); spine1.add(spine2); spine2.add(neck); neck.add(head);

    this.rig.spine = spine; this.rig.spine1 = spine1; this.rig.spine2 = spine2;
    this.rig.neck = neck; this.rig.head = head;

    // Arms
    const leftShoulder = makeBone('mixamorig1LeftShoulder', new THREE.Vector3(0.35, 0.18, 0));
    const leftArm = makeBone('mixamorig1LeftArm', new THREE.Vector3(0, -0.18, 0));
    const leftForeArm = makeBone('mixamorig1LeftForeArm', new THREE.Vector3(0, -0.28, 0));
    const leftHand = makeBone('mixamorig1LeftHand', new THREE.Vector3(0, -0.16, 0));
    spine2.add(leftShoulder); leftShoulder.add(leftArm); leftArm.add(leftForeArm); leftForeArm.add(leftHand);

    const rightShoulder = makeBone('mixamorig1RightShoulder', new THREE.Vector3(-0.35, 0.18, 0));
    const rightArm = makeBone('mixamorig1RightArm', new THREE.Vector3(0, -0.18, 0));
    const rightForeArm = makeBone('mixamorig1RightForeArm', new THREE.Vector3(0, -0.28, 0));
    const rightHand = makeBone('mixamorig1RightHand', new THREE.Vector3(0, -0.16, 0));
    spine2.add(rightShoulder); rightShoulder.add(rightArm); rightArm.add(rightForeArm); rightForeArm.add(rightHand);

    this.rig.leftShoulder = leftShoulder; this.rig.leftArm = leftArm;
    this.rig.leftForeArm = leftForeArm; this.rig.leftHand = leftHand;
    this.rig.rightShoulder = rightShoulder; this.rig.rightArm = rightArm;
    this.rig.rightForeArm = rightForeArm; this.rig.rightHand = rightHand;

    // Legs
    const leftUpLeg = makeBone('mixamorig1LeftUpLeg', new THREE.Vector3(0.22, -0.4, 0));
    const leftLeg = makeBone('mixamorig1LeftLeg', new THREE.Vector3(0, -0.36, 0));
    const leftFoot = makeBone('mixamorig1LeftFoot', new THREE.Vector3(0, -0.18, 0));
    hips.add(leftUpLeg); leftUpLeg.add(leftLeg); leftLeg.add(leftFoot);

    const rightUpLeg = makeBone('mixamorig1RightUpLeg', new THREE.Vector3(-0.22, -0.4, 0));
    const rightLeg = makeBone('mixamorig1RightLeg', new THREE.Vector3(0, -0.36, 0));
    const rightFoot = makeBone('mixamorig1RightFoot', new THREE.Vector3(0, -0.18, 0));
    hips.add(rightUpLeg); rightUpLeg.add(rightLeg); rightLeg.add(rightFoot);

    this.rig.leftUpLeg = leftUpLeg; this.rig.leftLeg = leftLeg; this.rig.leftFoot = leftFoot;
    this.rig.rightUpLeg = rightUpLeg; this.rig.rightLeg = rightLeg; this.rig.rightFoot = rightFoot;

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

    // Arms/legs simple cylinders
    const makeLimbMesh = (isArm = true) => {
      const radius = isArm ? 0.15 : 0.18;
      const length = isArm ? 0.55 : 0.65;
      const geo = new THREE.CylinderGeometry(radius, radius, length, 16);
      geo.translate(0, -length/2, 0);
      return new THREE.Mesh(geo, bodyMaterial);
    };
    this.rig.leftArm.add(makeLimbMesh(true));
    this.rig.leftForeArm.add(makeLimbMesh(true));
    this.rig.rightArm.add(makeLimbMesh(true));
    this.rig.rightForeArm.add(makeLimbMesh(true));
    this.rig.leftUpLeg.add(makeLimbMesh(false));
    this.rig.leftLeg.add(makeLimbMesh(false));
    this.rig.rightUpLeg.add(makeLimbMesh(false));
    this.rig.rightLeg.add(makeLimbMesh(false));

    // Feet boxes
    const footGeo = new THREE.BoxGeometry(0.28, 0.08, 0.45);
    const footL = new THREE.Mesh(footGeo, bodyMaterial); footL.position.set(0,-0.18,0.08); this.rig.leftFoot.add(footL);
    const footR = new THREE.Mesh(footGeo, bodyMaterial); footR.position.set(0,-0.18,0.08); this.rig.rightFoot.add(footR);

    root.traverse(c=>{ if (c.isMesh){ c.castShadow = true; c.layers.set(1); }});
    return root;
  }

  cancelActions(){ this.miningTarget=null; this.isMining=false; this.miningTimer=0; }
  startMining(targetRock){ /* unchanged */ }
  moveTo(targetPosition){ /* unchanged */ }
  calculatePath(startX,startZ,endX,endZ){ /* unchanged */ }
  updatePathLine(){ /* unchanged */ }

  update(deltaTime){
    this.animationTimer += deltaTime;
    if (this.state===states.WALKING && this.path.length===0){ this.state=this.miningTarget?states.MINING:states.IDLE; this.miningTimer=0; this.marker.visible=false; this.pathLine.visible=false; }
    if (this.state===states.WALKING){ this.updateMovement(deltaTime); }
    switch(this.state){
      case states.WALKING: this.updateWalkAnimation(); break;
      case states.MINING: this.updateMineAnimation(); this.updateMineTimer(deltaTime); break;
      default: this.updateIdleAnimation(); break;
    }
  }

  updateMovement(deltaTime){ /* unchanged */ }
  updateMineTimer(deltaTime){ /* unchanged */ }

  updateIdleAnimation(){
    const t = this.animationTimer * 1.2;
    this.rig.hips.position.y = 0.75 + Math.sin(t*0.7) * this.idleBreathAmp; // uses slider
    this.rig.spine.rotation.x = Math.sin(t*0.5) * 0.02;
    this.rig.leftShoulder.rotation.z = Math.sin(t*0.6) * 0.06;
    this.rig.rightShoulder.rotation.z = Math.sin(t*0.6+0.9) * 0.05;
    this.rig.leftArm.rotation.x = Math.sin(t*0.6+0.4) * 0.03;
    this.rig.rightArm.rotation.x = Math.sin(t*0.6-0.2) * 0.03;
    this.rig.neck.rotation.y = Math.sin(t*0.35) * 0.08;
    this.rig.head.rotation.y = Math.sin(t*0.25-0.3) * 0.06;
    this.rig.leftUpLeg.rotation.x = Math.sin(t*0.5) * 0.02;
    this.rig.rightUpLeg.rotation.x = Math.sin(t*0.5+Math.PI) * 0.02;
  }

  updateWalkAnimation(){ /* unchanged */ }
  updateMineAnimation(){ /* unchanged */ }
}