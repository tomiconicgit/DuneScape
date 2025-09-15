import * as THREE from 'three';

export default class Grid {
    constructor(scene) {
        const size = 100;
        const divisions = 100;

        // Visual grid helper
        const gridHelper = new THREE.GridHelper(size, divisions, 0x0000ff, 0x0000ff);
        scene.add(gridHelper);

        // Invisible plane for raycasting
        const planeGeometry = new THREE.PlaneGeometry(size, size);
        const planeMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
        this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
        this.plane.rotation.x = -Math.PI / 2;
        scene.add(this.plane);
    }
}
