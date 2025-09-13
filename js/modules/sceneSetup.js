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

// --- Private Utility Functions ---

// Simple Perlin noise function for terrain
function perlinNoise(x, y) {
    const p = new Array(512);
    const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t, a, b) => a + t * (b - a);
    const grad = (hash, x, y) => { const h = hash & 15; const u = h < 8 ? x : y; const v = h < 4 ? y : h === 12 || h === 14 ? x : 0; return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v); };
    const X = Math.floor(x) & 255; const Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x); const v = fade(y);
    const aa = p[p[X] + Y]; const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y]; const bb = p[p[X + 1] + Y + 1];
    return lerp(v, lerp(u, grad(aa, x, y), grad(ba, x - 1, y)), lerp(u, grad(ab, x, y - 1), grad(bb, x - 1, y - 1)));
}

function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.composer.setSize(window.innerWidth, window.innerHeight);
}

function createDesertEnvironment() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        // Temporarily disable Perlin noise for debugging.
        vertices[i + 1] = 0;
    }
    groundGeometry.computeVertexNormals();
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xC2B280, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.name = 'ground'; // ✅ MODIFIED: Add a name to the ground mesh for raycasting
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    gameState.scene.add(ground);

    const groundBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane() });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    gameState.physicsWorld.addBody(groundBody);
    
    // Load player and enemy models
    const loader = new GLTFLoader();
    loader.load('https://threejs.org/examples/models/gltf/Soldier.glb', (gltf) => {
        gameState.player.mesh = gltf.scene;
        gameState.player.mesh.scale.set(1, 1, 1);
        gameState.player.mesh.position.set(0, 0, 5);
        gameState.player.mesh.traverse(node => { if (node.isMesh) node.castShadow = true; });
        gameState.scene.add(gameState.player.mesh);

        gameState.player.mixer = new THREE.AnimationMixer(gltf.scene);
        if (gltf.animations.length > 0) {
            const action = gameState.player.mixer.clipAction(gltf.animations[0]);
            action.play();
        }

        gameState.player.body = new CANNON.Body({ mass: 70, shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)) });
        gameState.player.body.position.set(0, 5, 5);
        gameState.physicsWorld.addBody(gameState.player.body);
    });
    
    // Add other environment details (rocks, cacti, etc.) here...
}


// --- Exported Functions ---

export function initializeScene() {
    // Scene
    gameState.scene = new THREE.Scene();
    gameState.scene.background = new THREE.Color(0x87CEEB);
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    // Camera
    gameState.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    gameState.camera.position.set(0, 5, 15);

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

    // ✅ ADDED: A test cube for debugging rendering issues.
    const testGeo = new THREE.BoxGeometry(1, 1, 1);
    const testMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Bright red
    const testCube = new THREE.Mesh(testGeo, testMat);
    testCube.position.set(0, 1, 0); // Place it slightly above the ground
    gameState.scene.add(testCube);
    
    // ✅ ADDED: Raycasting logic for click-to-move functionality.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let targetPosition = null; // This will hold the 3D point to move to.

    function onPointerDown(event) {
        // Calculate pointer position in normalized device coordinates (-1 to +1)
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster with the camera and pointer position
        raycaster.setFromCamera(pointer, gameState.camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(gameState.scene.children);

        for (const intersect of intersects) {
            // Check if the ray hit our ground mesh
            if (intersect.object.name === 'ground') {
                console.log("Ground clicked at:", intersect.point);
                targetPosition = intersect.point;
                break; // Stop checking after we find the ground
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
    
    // ✅ ADDED: Player movement logic that uses the targetPosition from the raycaster.
    if (targetPosition && gameState.player.body) {
        const moveDirection = new CANNON.Vec3(
            targetPosition.x - gameState.player.body.position.x,
            0, // We only want to move on the XZ plane
            targetPosition.z - gameState.player.body.position.z
        );
        
        // If we are close enough to the target, stop moving.
        if (moveDirection.lengthSquared() < 0.1) {
            targetPosition = null;
            gameState.player.body.velocity.set(0, 0, 0);
        } else {
            // Move towards the target.
            moveDirection.normalize();
            const speed = 5; // Adjust speed as needed
            gameState.player.body.velocity.set(
                moveDirection.x * speed,
                gameState.player.body.velocity.y, // Keep current vertical velocity for gravity
                moveDirection.z * speed
            );
        }
    }

    // Update physics
    if (gameState.physicsWorld) {
        gameState.physicsWorld.step(1 / 60, delta, 3);
        
        if (gameState.player.mesh && gameState.player.body) {
            gameState.player.mesh.position.copy(gameState.player.body.position);
            gameState.player.mesh.quaternion.copy(gameState.player.body.quaternion);
        }
        
        // Update Minimap Camera
        if (gameState.player.body) {
            gameState.minimapCamera.position.x = gameState.player.body.position.x;
            gameState.minimapCamera.position.z = gameState.player.body.position.z;
        }
    }

    gameState.controls.update();
    gameState.composer.render();
    gameState.minimapRenderer.render(gameState.scene, gameState.minimapCamera);
}
