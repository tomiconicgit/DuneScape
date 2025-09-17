import * as THREE from 'three';

export default class Rocks {
    constructor(scene) {
        this.scene = scene;
        this.rockMeshes = []; // Keep track of all placed rocks

        this.orePresets = {
            limestone: { color: 0xcccccc, color2: 0x9e9b84, roughness: 0.9, metalness: 0.0, displacement: 0.2 },
            carbon:    { color: 0x4a4a4a, color2: 0x1f1f1f, roughness: 0.6, metalness: 0.1, displacement: 0.3 },
            iron:      { color: 0x8E574A, color2: 0x5c3e33, roughness: 0.5, metalness: 0.4, displacement: 0.4 },
            stone:     { color: 0x808080, color2: 0x404040, roughness: 0.8, metalness: 0.2, displacement: 0.25 }
        };
    }

    addRock(type, position) {
        if (!this.orePresets[type]) return;

        const preset = this.orePresets[type];
        const seed = Math.random() * 100;
        const noise = new Noise(seed);

        const geometry = new THREE.SphereGeometry(1, 16, 12); // Lower detail for better performance
        const positions = geometry.attributes.position;
        const tempVec = new THREE.Vector3();

        for (let i = 0; i < positions.count; i++) {
            tempVec.fromBufferAttribute(positions, i);
            const n = noise.fbm(tempVec.x * 2, tempVec.y * 2, tempVec.z * 2, 4, 2, 0.5);
            tempVec.multiplyScalar(1 + n * preset.displacement);
            positions.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        const uniforms = {
            color: { value: new THREE.Color(preset.color) }, color2: { value: new THREE.Color(preset.color2) },
            matRoughness: { value: preset.roughness }, matMetalness: { value: preset.metalness },
            lightDir: { value: new THREE.Vector3(0.5, 1, 0.5) }, sunColor: { value: new THREE.Color(0xffffff) },
            hemiSkyColor: { value: new THREE.Color(0xffffff) }, hemiGroundColor: { value: new THREE.Color(0xffffff) },
            texFrequency: { value: 5.0 }, bumpStrength: { value: 0.1 }, texSeed: { value: Math.random() * 100 }
        };
        const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });

        const rockMesh = new THREE.Mesh(geometry, material);
        const scale = 0.5;
        rockMesh.scale.set(scale, scale, scale);
        rockMesh.position.set(position.x, position.y + (scale / 2), position.z);
        rockMesh.userData.type = type; // Store the type for export
        
        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        this.scene.add(rockMesh);
        this.rockMeshes.push(rockMesh);
    }

    getRockDataForExport() {
        const rockData = this.rockMeshes.map(rock => ({
            type: rock.userData.type,
            pos: [rock.position.x, rock.position.y, rock.position.z]
        }));
        return JSON.stringify(rockData, null, 2);
    }

    clearAllRocks() {
        this.rockMeshes.forEach(rock => this.scene.remove(rock));
        this.rockMeshes = [];
    }
}

// (Full Noise class and shaders from previous version go here...)
