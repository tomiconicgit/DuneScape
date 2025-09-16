import * as THREE from 'three';

export default class Grid {
    constructor(scene) {
        // The visible grid for object placement reference
        const gridSize = 100;
        const gridDivisions = 100;
        const gridColor = 0x888888; // Grey

        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
        // Lift the grid slightly to prevent graphical glitches with the plane below
        gridHelper.position.y = 0.01; 
        scene.add(gridHelper);

        // A larger, invisible plane for receiving shadows and for mouse clicks
        const planeSize = 200;
        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
}
