import * as THREE from 'three';

export function setupLighting(scene) {
    // HEMISPHERE LIGHT
    // MODIFIED: Drastically increased intensity from 3 to 5 for a much brighter world
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 5);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // DIRECTIONAL LIGHT (SUN)
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
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

    return { hemiLight, dirLight };
}
