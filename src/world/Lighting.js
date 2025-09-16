import * as THREE from 'three';

export function setupLighting(scene) {
    // We only need a single DirectionalLight for the sun's shadows and direct light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0); // Start with lower intensity
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(50);
    scene.add(dirLight);

    // Shadow configuration
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    
    const d = 120; 
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.bias = -0.0001;

    // Return just the directional light
    return { dirLight };
}
