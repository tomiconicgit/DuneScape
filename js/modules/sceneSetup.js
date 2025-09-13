// js/modules/sceneSetup.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

import { gameState } from './gameState.js';
import { PlayerAnimationManager } from './AnimationManager.js';
import { createWorldEntities } from './EntityManager.js';

export let targetPosition = null;
export function setTargetPosition(pos) { targetPosition = pos; }

// --- Private Utility Functions ---
function onWindowResize() { /* ... no changes ... */ }

// ✅ OVERHAULED: Now generates layered Perlin noise and a physics Heightfield
function createDesertEnvironment() {
    const size = 100;
    const segments = 64;

    const groundGeometry = new THREE.PlaneGeometry(size, size, segments, segments);
    const vertices = groundGeometry.attributes.position.array;
    const heightData = [];

    for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
        const x = vertices[i] / 10;
        const z = vertices[i + 2] / 10;
        
        // Layered Perlin noise for more interesting terrain
        let height = 0;
        height += perlinNoise(x * 0.5, z * 0.5) * 4;   // Large rolling hills
        height += perlinNoise(x * 2, z * 2) * 0.5;   // Smaller bumps
        height += perlinNoise(x * 5, z * 5) * 0.25;  // Fine detail

        vertices[i + 1] = height;
        // This seems backwards, but it's how the heightfield data is structured
        if ((j % (segments + 1)) === 0) heightData.push([]);
        heightData[heightData.length - 1].push(height);
    }
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xC2B280, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.name = 'ground';
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    gameState.scene.add(ground);

    // ✅ ADVANCED: Create a Heightfield physics body that matches the terrain
    const heightfieldShape = new CANNON.Heightfield(heightData, {
        elementSize: size / segments
    });
    const groundBody = new CANNON.Body({ mass: 0 }); // mass 0 is static
    groundBody.addShape(heightfieldShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    gameState.physicsWorld.addBody(groundBody);

    // Load player model
    const loader = new GLTFLoader();
    loader.load('https://threejs.org/examples/models/gltf/Soldier.glb', (gltf) => {
        gameState.player.mesh = gltf.scene;
        gameState.player.mesh.scale.set(1, 1, 1);
        gameState.scene.add(gameState.player.mesh);
        
        // ✅ MODIFIED: Instantiate our new animation manager
        gameState.player.animationManager = new PlayerAnimationManager(gltf.scene, gltf.animations);

        const startPosition = new CANNON.Vec3(0, 15, 5); // Start higher to drop onto terrain
        gameState.player.body = new CANNON.Body({ mass: 70, shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)) });
        gameState.player.body.position.copy(startPosition);
        gameState.physicsWorld.addBody(gameState.player.body);
    });
}

export function initializeScene() {
    // ... no changes until after lights ...

    // Lights
    gameState.scene.add(new THREE.AmbientLight(0x666666)); // Softer ambient light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(50, 50, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    gameState.scene.add(dirLight);

    // ... no changes to Raycasting or Minimap ...
    
    createDesertEnvironment();
    
    // ✅ NEW: Populate the world with monsters and resources
    createWorldEntities();

    window.addEventListener('resize', onWindowResize);
}

export function animate() {
    requestAnimationFrame(animate);
    const delta = gameState.clock.getDelta();
    
    // ✅ MODIFIED: Update the animation manager with the player's velocity
    if (gameState.player.animationManager && gameState.player.body) {
        gameState.player.animationManager.update(delta, gameState.player.body.velocity);
    }
    
    // ... movement logic is mostly the same ...
    if (gameState.player.body) {
        if (targetPosition) {
            // ... no changes to this block ...
        }
    }

    // ✅ NEW: Simple Monster AI loop
    gameState.enemies.forEach(enemy => {
        if (enemy.body && gameState.player.body) {
            const distanceToPlayer = enemy.body.position.distanceTo(gameState.player.body.position);
            
            if (distanceToPlayer < 15) { // Chase state
                enemy.state = 'CHASING';
                const direction = new CANNON.Vec3().sub(gameState.player.body.position, enemy.body.position);
                direction.y = 0; // Don't fly
                direction.normalize();
                const speed = 3;
                enemy.body.velocity.set(direction.x * speed, enemy.body.velocity.y, direction.z * speed);
                enemy.mesh.lookAt(gameState.player.mesh.position);

            } else { // Wander state
                if (enemy.state !== 'WANDERING') {
                    enemy.state = 'WANDERING';
                    enemy.wanderTime = 0;
                }
                enemy.wanderTime -= delta;
                if (enemy.wanderTime <= 0) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 1;
                    enemy.body.velocity.set(Math.cos(angle) * speed, enemy.body.velocity.y, Math.sin(angle) * speed);
                    enemy.mesh.lookAt(enemy.mesh.position.x + enemy.body.velocity.x, enemy.mesh.position.y, enemy.mesh.position.z + enemy.body.velocity.z);
                    enemy.wanderTime = Math.random() * 5 + 3; // New direction every 3-8 seconds
                }
            }
        }
    });

    // Update physics
    if (gameState.physicsWorld) {
        gameState.physicsWorld.step(1 / 60, delta, 3);
        
        if (gameState.player.mesh && gameState.player.body) {
            gameState.player.mesh.position.copy(gameState.player.body.position);
        }

        // Sync all enemy meshes with their physics bodies
        gameState.enemies.forEach(enemy => {
            if (enemy.mesh && enemy.body) {
                enemy.mesh.position.copy(enemy.body.position);
            }
        });
        
        // ... rest of physics update ...
    }

    // ... no changes to controls, composer, or minimap render ...
}

// Don't forget to include the Perlin Noise function from your original file!
function perlinNoise(x, y) { /* ... same as before ... */ }
