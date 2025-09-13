// js/modules/EntityManager.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gameState } from './gameState.js';

const loader = new GLTFLoader();

// --- Monster Creation ---
function createMonster(position) {
    // NOTE: You'll need to find a monster model and provide its path.
    // Sketchfab is a great resource for free GLTF models.
    loader.load('path/to/your/monster.glb', (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.set(1.5, 1.5, 1.5);
        mesh.position.copy(position);
        mesh.traverse(node => { if (node.isMesh) node.castShadow = true; });
        gameState.scene.add(mesh);

        const body = new CANNON.Body({
            mass: 100,
            shape: new CANNON.Box(new CANNON.Vec3(0.8, 1.5, 0.8)),
            position: new CANNON.Vec3(position.x, position.y, position.z)
        });
        gameState.physicsWorld.addBody(body);

        // Add to game state for AI updates
        gameState.enemies.push({ mesh, body, state: 'WANDERING', wanderTime: 0 });
    });
}

// --- Resource Creation (using Instanced Rendering for performance) ---
function createInstancedResources(count, modelPath, scale) {
    loader.load(modelPath, (gltf) => {
        const sourceMesh = gltf.scene.children[0];
        if (!sourceMesh) return;

        const instancedMesh = new THREE.InstancedMesh(sourceMesh.geometry, sourceMesh.material, count);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 90;
            const z = (Math.random() - 0.5) * 90;

            // Avoid spawning too close to the player's start
            if (Math.sqrt(x*x + z*z) < 20) continue;

            dummy.position.set(x, 0, z); // We'll place it on the ground later
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        gameState.scene.add(instancedMesh);
        gameState.resources.push(instancedMesh); // Store for potential future interaction
    });
}

export function createWorldEntities() {
    // Create Monsters
    for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        if (Math.sqrt(x*x + z*z) < 25) continue; // Don't spawn on top of player
        createMonster(new THREE.Vector3(x, 10, z)); // Spawn high and let them drop
    }

    // Create Resources
    // NOTE: You'll need to find tree/rock models and provide their paths.
    // createInstancedResources(50, 'path/to/your/tree.glb', 2.0);
    // createInstancedResources(30, 'path/to/your/rock.glb', 1.0);
}
