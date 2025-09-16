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
        geometry.computeVertexNormals(); // Recalculate normals for correct lighting

        // A dark, hazy material for the distant hills
        const material = new THREE.MeshLambertMaterial({
            color: 0x080a18,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = -5; // Lower the hills slightly
        scene.add(mesh);
    }
}
