import * as THREE from 'three';
import { MINE_AREA } from '../WorldData.js';

const MASTER_SEED = 42; // A fixed seed for deterministic rock placement

export default class Rocks {
    constructor(scene) {
        this.prng = this.seededRandom(MASTER_SEED);

        this.materials = {
            stone:     new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 }),
            iron:      new THREE.MeshStandardMaterial({ color: 0x8E574A, roughness: 0.6, metalness: 0.3 }),
            limestone: new THREE.MeshStandardMaterial({ color: 0xD3D3D3, roughness: 0.9 }),
            carbon:    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 })
        };
        
        this.oreGeometry = new THREE.IcosahedronGeometry(0.5, 0); // Ores are uniform

        // --- Place Ores on their specific patches ---
        MINE_AREA.patches.forEach(patch => {
            const rockCount = 15; // 15 rocks per patch
            for (let i = 0; i < rockCount; i++) {
                const position = new THREE.Vector3(
                    patch.x + (this.prng() - 0.5) * patch.width,
                    patch.height,
                    patch.y + (this.prng() - 0.5) * patch.depth
                );
                this._createRock(scene, patch.name, position, true); // isOre = true
            }
        });

        // --- Scatter generic stones around the main mine floor ---
        const stoneCount = 50;
        for (let i = 0; i < stoneCount; i++) {
             const position = new THREE.Vector3(
                MINE_AREA.x + (this.prng() - 0.5) * MINE_AREA.width,
                MINE_AREA.base_height,
                MINE_AREA.y + (this.prng() - 0.5) * MINE_AREA.depth
            );
            this._createRock(scene, 'stone', position, false); // isOre = false
        }
    }

    _createRock(scene, type, position, isOre) {
        let geometry;
        
        if (isOre) {
            geometry = this.oreGeometry;
        } else {
            // Generic stones get a unique, deformed shape
            const tempGeom = new THREE.IcosahedronGeometry(0.5, 1);
            const positions = tempGeom.attributes.position;
            const tempVector = new THREE.Vector3();
            for (let j = 0; j < positions.count; j++) {
                tempVector.fromBufferAttribute(positions, j);
                tempVector.multiplyScalar(1 + (this.prng() - 0.5) * 0.8);
                positions.setXYZ(j, tempVector.x, tempVector.y, tempVector.z);
            }
            tempGeom.computeVertexNormals();
            geometry = tempGeom;
        }

        const material = this.materials[type];
        const rockMesh = new THREE.Mesh(geometry, material);
        rockMesh.position.copy(position);

        const scale = isOre ? 0.8 : THREE.MathUtils.lerp(0.4, 1.1, this.prng());
        rockMesh.scale.set(scale, scale, scale);
        
        rockMesh.geometry.computeBoundingBox();
        const rockHeight = rockMesh.geometry.boundingBox.max.y - rockMesh.geometry.boundingBox.min.y;
        rockMesh.position.y += (rockHeight * rockMesh.scale.y) / 2;

        rockMesh.rotation.set(this.prng() * Math.PI, this.prng() * Math.PI, this.prng() * Math.PI);

        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        scene.add(rockMesh);
    }
    
    seededRandom(seed) {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }
}
