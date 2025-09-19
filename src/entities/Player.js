// File: src/entities/Player.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const states = { IDLE: 'idle', WALKING: 'walking', MINING: 'mining' };

export default class Player {
  constructor(scene, game) {
    this.game = game;
    this.scene = scene;
    this.state = states.IDLE;
    
    // Animation properties
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;

    // Pathing and movement
    this.path = [];
    this.speed = 4.0;

    // Mining
    this.miningTarget = null;
    this.miningTimer = 0;
    this.miningDuration = 2.0; // Default, will be updated from animation clip
    
    // Tap Marker and Highlight management
    const markerGeo = new THREE.RingGeometry(0, 0.5, 32);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.8, transparent: true });
    this.tapMarker = new THREE.Mesh(markerGeo, markerMat);
    this.tapMarker.rotation.x = -Math.PI / 2;
    this.tapMarker.visible = false;
    scene.add(this.tapMarker);
    this.markerAnimation = { active: false, time: 0, duration: 0.75 };
    this.highlightedObject = null;
  }
  
  async loadModel() {
    const loader = new GLTFLoader();
    
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.158.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    try {
        // --- 1. Load the main character model ---
        // ✅ FIXED: Updated path to be relative to index.html
        const gltf = await loader.loadAsync('assets/models/Arissa.glb');
        this.mesh = gltf.scene;
        this.mesh.position.set(50, 0, 102);
        
        this.mesh.scale.set(1.0, 1.0, 1.0);
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.layers.set(1);
            }
        });
        this.scene.add(this.mesh);

        // --- 2. Set up Animation Mixer ---
        this.mixer = new THREE.AnimationMixer(this.mesh);
        
        // --- 3. Load all animation files in parallel ---
        // ✅ FIXED: Updated paths for all animations
        const animationPaths = {
            idle: 'assets/animations/Idle.glb',
            walk: 'assets/animations/Walking.glb',
            mine: 'assets/animations/HeavyWeaponSwing.glb',
            sitting: 'assets/animations/SittingIdle.glb'
        };

        const animationPromises = Object.values(animationPaths).map(path => loader.loadAsync(path));
        const animationGltfs = await Promise.all(animationPromises);
        
        const animationKeys = Object.keys(animationPaths);
        animationGltfs.forEach((animGltf, index) => {
            const key = animationKeys[index];
            const clip = animGltf.animations[0];
            
            const action = this.mixer.clipAction(clip);
            
            if (key === 'mine') {
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                this.miningDuration = clip.duration;
            } else {
                action.setLoop(THREE.LoopRepeat);
            }
            this.actions[key] = action;
        });

        console.log("Player model and animations loaded.", this.actions);
        
        // --- 4. Start in IDLE state ---
        this.activeAction = this.actions.idle;
        this.activeAction.play();

    } catch (error) {
        console.error("Failed to load player model or animations:", error);
        throw error;
    }
  }

  playAction(name) {
    if (this.activeAction?.name === name || !this.actions[name]) return;
    const newAction = this.actions[name];
    const oldAction = this.activeAction;
    this.activeAction = newAction;

    if (oldAction) {
        oldAction.fadeOut(0.3);
    }
    
    newAction.reset();
    newAction.setEffectiveTimeScale(1);
    newAction.setEffectiveWeight(1);
    newAction.fadeIn(0.3);
    newAction.play();
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    
    switch(newState) {
        case states.WALKING:
            this.playAction('walk');
            break;
        case states.MINING:
            this.playAction('mine');
            break;
        case states.IDLE:
        default:
            this.playAction('idle');
            break;
    }
  }

  // (The rest of the file is unchanged and omitted for brevity)
  
  showTapMarkerAt(position) {
    this.tapMarker.position.copy(position);
    this.tapMarker.position.y += 0.1;
    this.tapMarker.visible = true;
    this.markerAnimation.active = true;
    this.markerAnimation.time = 0;
  }
  
  setHighlightedObject(object) {
      if (this.highlightedObject && this.highlightedObject !== object) {
          if (this.highlightedObject.material.userData.uniforms?.uHighlight) {
              this.highlightedObject.material.userData.uniforms.uHighlight.value = 0.0;
          }
      }
      this.highlightedObject = object;
      if (object) {
          if (object.material.userData.uniforms?.uHighlight) {
              object.material.userData.uniforms.uHighlight.value = 1.0;
          }
      }
  }
  
  cancelActions() {
    this.miningTarget = null;
    this.setState(states.IDLE);
  }

  startMining(targetRock) {
    this.miningTarget = targetRock;
    const direction = this.mesh.position.clone().sub(targetRock.position).normalize();
    const destination = targetRock.position.clone().add(direction.multiplyScalar(2.5)); // Adjust distance as needed
    this.moveTo(destination);
  }

  moveTo(targetPosition) {
    const targetGridX = Math.round(targetPosition.x);
    const targetGridZ = Math.round(targetPosition.z);
    const startGridX = Math.round(this.mesh.position.x);
    const startGridZ = Math.round(this.mesh.position.z);

    this.path = this.calculatePath(startGridX, startGridZ, targetGridX, targetGridZ);

    if (this.path.length > 0) {
      this.setState(states.WALKING);
    } else {
      this.setState(states.IDLE);
    }
  }

  update(deltaTime) {
    if (this.mixer) {
        this.mixer.update(deltaTime);
    }

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

    if (this.state === states.WALKING) {
      this.updateMovement(deltaTime);
      if (this.path.length === 0) {
        if (this.miningTarget) {
            this.setState(states.MINING);
            this.mesh.lookAt(this.miningTarget.position);
        } else {
            this.setState(states.IDLE);
        }
      }
    } else if (this.state === states.MINING) {
        this.miningTimer += deltaTime;
        if (this.miningTimer >= this.miningDuration) {
            if (this.miningTarget?.userData?.onMined) {
                this.miningTarget.userData.onMined();
            }
            this.miningTarget = null;
            this.setState(states.IDLE);
            this.miningTimer = 0;
        }
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
}
