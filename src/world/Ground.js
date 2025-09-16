import * as THREE from 'three';

export default class Ground {
    constructor(scene, groundColor) {
        const groundGeo = new THREE.PlaneGeometry(10000, 10000);
        const groundMat = new THREE.MeshLambertMaterial({ color: groundColor });
        
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = -33; // Position it lower to give a sense of space
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
    }
}
