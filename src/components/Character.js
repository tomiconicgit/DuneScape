// ... (imports)
export default class Character {
    constructor(scene) {
        // ... (geometry, material)
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(5, height, 5); // Start near the town
        scene.add(this.mesh);
    }
}
