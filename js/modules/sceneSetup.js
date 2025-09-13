// js/modules/sceneSetup.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

import { gameState } from './gameState.js';

// ✅ FIX: This global variable will be set by the UI and read by the animate loop.
// This is a simple way to communicate between modules.
export let targetPosition = null;
export function setTargetPosition(pos) {
    targetPosition = pos;
}


// --- Private Utility Functions ---

function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.composer.setSize(window.innerWidth, window.innerHeight);
}

function createDesertEnvironment() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    // You can re-enable your Perlin noise later, starting flat is best for debugging.
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xC2B280, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.name = 'ground';
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    gameState.scene.add(ground);

    const groundBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    gameState.physicsWorld.addBody(groundBody);
    
    // Load player model
    const loader = new GLTFLoader();
    loader.load('https://threejs.org/examples/models/gltf/Soldier.glb', (gltf) => {
        gameState.player.mesh = gltf.scene;
        gameState.player.mesh.scale.set(1, 1, 1);
        gameState.scene.add(gameState.player.mesh);

        // Animation setup
        gameState.player.mixer = new THREE.AnimationMixer(gltf.scene);
        if (gltf.animations.length > 0) {
            const action = gameState.player.mixer.clipAction(gltf.animations[0]);
            action.play();
        }

        // Physics body setup
        const startPosition = new CANNON.Vec3(0, 5, 5);
        gameState.player.body = new CANNON.Body({ mass: 70, shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)) });
        gameState.player.body.position.copy(startPosition);
        gameState.physicsWorld.addBody(gameState.player.body);

        // ✅ FIX: Ensure the visual mesh starts at the same position as the physics body.
        gameState.player.mesh.position.copy(startPosition);
    });
}


// --- Exported Functions ---

export function initializeScene() {
    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB);
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    // Camera
    gameState.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    gameState.camera.position.set(0, 10, 20); // Adjusted camera for a better view

    // Renderer
    const canvasContainer = document.getElementById('canvas-container');
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameState.renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvasContainer.appendChild(gameState.renderer.domElement);
    
    // Post-processing
    gameState.composer = new EffectComposer(gameState.renderer);
    gameState.composer.addPass(new RenderPass(gameState.scene, gameState.camera));
    gameState.composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85));
    gameState.composer.addPass(new SMAAPass(window.innerWidth * gameState.renderer.getPixelRatio(), window.innerHeight * gameState.renderer.getPixelRatio()));

    // Controls
    gameState.controls = new OrbitControls(gameState.camera, gameState.renderer.domElement);
    gameState.controls.enableDamping = true;
    gameState.controls.target.set(0, 1, 0);

    // Physics
    gameState.physicsWorld = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });

    // Lights
    gameState.scene.add(new THREE.AmbientLight(0x404040, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    gameState.scene.add(dirLight);
    
    // Raycasting for click-to-move
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerDown(event) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, gameState.camera);
        const intersects = raycaster.intersectObjects(gameState.scene.children);
        for (const intersect of intersects) {
            if (intersect.object.name === 'ground') {
                setTargetPosition(intersect.point); // Use the exported function
                break;
            }
        }
    }
    window.addEventListener('pointerdown', onPointerDown);

    // Minimap
    gameState.minimapCamera = new THREE.OrthographicCamera(-20, 20, 20, -20, 1, 100);
    gameState.minimapCamera.position.set(0, 50, 0);
    gameState.minimapCamera.lookAt(0, 0, 0);
    gameState.minimapRenderer = new THREE.WebGLRenderer({ alpha: true });
    gameState.minimapRenderer.setSize(120, 120);
    document.getElementById('minimap').appendChild(gameState.minimapRenderer.domElement);
    
    // Create Environment
    createDesertEnvironment();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
}

export function animate() {
    requestAnimationFrame(animate);
    const delta = gameState.clock.getDelta();
    
    if (gameState.player.mixer) {
        gameState.player.mixer.update(delta);
    }
    
    // ✅ FIX: Major overhaul of the movement logic
    if (gameState.player.body) {
        if (targetPosition) {
            const moveDirection = new THREE.Vector3().subVectors(targetPosition, gameState.player.body.position);
            moveDirection.y = 0; // Move on the XZ plane

            if (moveDirection.lengthSq() < 0.1) {
                setTargetPosition(null);
                gameState.player.body.velocity.set(0, gameState.player.body.velocity.y, 0);
            } else {
                // Move towards the target
                moveDirection.normalize();
                const speed = 5;
                gameState.player.body.velocity.set(
                    moveDirection.x * speed,
                    gameState.player.body.velocity.y,
                    moveDirection.z * speed
                );

                // ✅ FIX: Rotate character to face movement direction
                if (gameState.player.mesh) {
                    const targetQuaternion = new THREE.Quaternion();
                    const lookAtPosition = new THREE.Vector3().addVectors(gameState.player.mesh.position, moveDirection);
                    gameState.player.mesh.lookAt(lookAtPosition);
                }
            }
        }
    }

    // Update physics
    if (gameState.physicsWorld) {
        gameState.physicsWorld.step(1 / 60, delta, 3);
        
        if (gameState.player.mesh && gameState.player.body) {
            gameState.player.mesh.position.copy(gameState.player.body.position);
        }
        
        if (gameState.player.body) {
            gameState.minimapCamera.position.x = gameState.player.body.position.x;
            gameState.minimapCamera.position.z = gameState.player.body.position.z;
        }
    }

    gameState.controls.update();
    gameState.composer.render();
    gameState.minimapRenderer.render(gameState.scene, gameState.minimapCamera);
}
