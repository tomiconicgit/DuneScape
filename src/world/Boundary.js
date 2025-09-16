import * as THREE from 'three';

export default class Boundary {
    constructor(scene) {
        const geometry = new THREE.CylinderGeometry(55, 65, 20, 80, 4, true);

        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            const angle = Math.atan2(positions.getZ(i), positions.getX(i));
            const stretch = Math.sin(angle * 10) * 2;
            const stretch2 = Math.sin(angle * 25) * 1.5;
            const noise = stretch + stretch2;
            
            const heightFactor = y > 0 ? 1 : 0.2;
            positions.setY(i, y + noise * heightFactor);
        }
        geometry.computeVertexNormals();

        const textureLoader = new THREE.TextureLoader();

        const colorMap = textureLoader.load('https://threejs.org/examples/textures/terrain/sand/sand_diffuse.jpg');
        colorMap.wrapS = THREE.RepeatWrapping;
        colorMap.wrapT = THREE.RepeatWrapping;
        colorMap.repeat.set(30, 2);

        const normalMap = textureLoader.load('https://threejs.org/examples/textures/terrain/sand/sand_normal.jpg');
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.repeat.set(30, 2);

        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            normalMap: normalMap,
            roughness: 0.9,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // MODIFIED: Raised the hills to be level with the grid
        mesh.position.y = 0; 
        
        mesh.receiveShadow = true; 
        scene.add(mesh);
    }
}
