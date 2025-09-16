import * as THREE from 'three';

export function setupLighting(scene) {
    // HEMISPHERE LIGHT
    // This light is crucial. It provides a base color for the sky (top color)
    // and a base color for the ground (bottom color).
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
    hemiLight.color.setHSL(0.6, 1, 0.6); // Sky color (light blue)
    hemiLight.groundColor.setHSL(0.095, 1, 0.75); // Ground color (brownish)
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    // DIRECTIONAL LIGHT (SUN)
    // This provides the main light source and casts shadows.
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.color.setHSL(0.1, 1, 0.95); // A warm, yellowish sun color
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    scene.add(dirLight);

    // Shadow configuration
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = -0.0001;

    // Return the lights so other modules can use their colors
    return { hemiLight, dirLight };
}
