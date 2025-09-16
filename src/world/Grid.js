import * as THREE from 'three';

export default class Grid {
    constructor(scene) {
        const size = 200;
        const divisions = 200;

        // Visual grid helper
        const gridHelper = new THREE.GridHelper(size, divisions, 0x0000ff, 0x0000ff);
        gridHelper.position.y = 0.01; // Lift it slightly to prevent fighting with the plane
        scene.add(gridHelper);

        // Invisible plane for receiving shadows and raycasting
        const planeGeometry = new THREE.PlaneGeometry(size, size);
        // ShadowMaterial is a special material that is transparent but can receive shadows
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
        
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
