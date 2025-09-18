// File: src/world/Lighting.js
import * as THREE from 'three';

export default class Lighting {
    constructor(scene) {
        // Hemisphere Light (for ambient color)
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
        this.hemiLight.color.setHSL(0.6, 1, 0.6);
        this.hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        this.hemiLight.position.set(0, 50, 0);
        scene.add(this.hemiLight);

        // Directional Light (for sun and shadows)
        this.dirLight = new THREE.DirectionalLight(0xffffff, 3);
        this.dirLight.color.setHSL(0.1, 1, 0.95);
        this.dirLight.position.set(-1, 1.75, 1);
        this.dirLight.position.multiplyScalar(30);
        scene.add(this.dirLight);

        // Directional Light shadow properties
        this.dirLight.castShadow = true;

        // ✨ CHANGED: Increased shadow map resolution for better quality on a large map
        this.dirLight.shadow.mapSize.width = 4096;
        this.dirLight.shadow.mapSize.height = 4096;

        // ✨ CHANGED: Increased the size of the shadow camera to cover the 800x800 world
        const d = 400; // Was 50, now half the world size

        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;

        this.dirLight.shadow.camera.far = 3500;
        this.dirLight.shadow.bias = -0.0001;
    }
}
