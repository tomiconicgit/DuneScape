import * as THREE from 'three';

export default class Rocks {
    constructor(scene) {
        this.scene = scene;
        this.rockMeshes = []; // Keep track of all placed rocks

        this.orePresets = {
            limestone: { color: 0xcccccc, color2: 0x9e9b84, ... },
            carbon:    { color: 0x4a4a4a, color2: 0x1f1f1f, ... },
            iron:      { color: 0x7d584a, color2: 0x5c3e33, ... },
            stone:     { color: 0x808080, color2: 0x404040, ... }
        };
    }

    addRock(type, position) {
        if (!this.orePresets[type]) return;

        const preset = this.orePresets[type];
        const seed = Math.random() * 100;
        const noise = new Noise(seed);

        const geometry = new THREE.SphereGeometry(1, 16, 12); // Lower detail for better performance
        // ... (FBM noise deformation logic from previous version)

        const material = new THREE.ShaderMaterial({ ... }); // The "good" shader material

        const rockMesh = new THREE.Mesh(geometry, material);
        rockMesh.position.set(position.x, position.y + (scale / 2), position.z);
        rockMesh.userData.type = type; // Store the type for export
        
        this.scene.add(rockMesh);
        this.rockMeshes.push(rockMesh);
    }

    getRockDataForExport() {
        const rockData = this.rockMeshes.map(rock => ({
            type: rock.userData.type,
            position: { x: rock.position.x, y: rock.position.y, z: rock.position.z }
        }));
        return JSON.stringify(rockData, null, 2);
    }

    clearAllRocks() {
        this.rockMeshes.forEach(rock => this.scene.remove(rock));
        this.rockMeshes = [];
    }
}
// (Include the Noise class and shaders at the bottom)
