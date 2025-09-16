import * as THREE from 'three';

export default class Boundary {
    constructor(scene) {
        const geometry = new THREE.CylinderGeometry(55, 65, 20, 80, 4, true);

        // Deform the vertices to create a hilly landscape
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            const angle = Math.atan2(positions.getZ(i), positions.getX(i));
            // Use sine waves to create a bumpy, natural-looking horizon
            const stretch = Math.sin(angle * 10) * 2;
            const stretch2 = Math.sin(angle * 25) * 1.5;
            const noise = stretch + stretch2;
            
            // Apply more displacement to the top vertices
            const heightFactor = y > 0 ? 1 : 0.2;
            positions.setY(i, y + noise * heightFactor);
        }
        geometry.computeVertexNormals();

        // --- MODIFIED: Texture Loading and Advanced Material ---

        const textureLoader = new THREE.TextureLoader();

        // Load the color texture
        const colorMap = textureLoader.load('https://threejs.org/examples/textures/terrain/sand/sand_diffuse.jpg');
        colorMap.wrapS = THREE.RepeatWrapping;
        colorMap.wrapT = THREE.RepeatWrapping;
        colorMap.repeat.set(30, 2); // Tile the texture 30 times around, 2 times vertically

        // Load the normal map for 3D detail
        const normalMap = textureLoader.load('https://threejs.org/examples/textures/terrain/sand/sand_normal.jpg');
        normalMap.wrapS = THREE.RepeatWrapping;
        normalMap.wrapT = THREE.RepeatWrapping;
        normalMap.repeat.set(30, 2);

        // A physically-based material that reacts to light realistically
        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            normalMap: normalMap,
            roughness: 0.9, // Make it look like dry, non-reflective sand/rock
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = -5;
        // Allow the hills to receive shadows from things like clouds (if you add them later)
        mesh.receiveShadow = true; 
        scene.add(mesh);
    }
}
