import * as THREE from 'three';
import { MINE_AREA } from '../WorldData.js';

const MASTER_SEED = 42; // Change this number to get a completely new layout of rocks

export default class Rocks {
    constructor(scene) {
        this.prng = this.seededRandom(MASTER_SEED);

        // --- Create Materials for each Ore Type ---
        this.materials = {
            stone:     new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 }),
            iron:      new THREE.MeshStandardMaterial({ color: 0x8E574A, roughness: 0.6, metalness: 0.3 }),
            limestone: new THREE.MeshStandardMaterial({ color: 0xD3D3D3, roughness: 0.9 }),
            carbon:    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 })
        };
        
        // --- Create Base Geometries (once, for efficiency) ---
        this.oreGeometry = new THREE.IcosahedronGeometry(0.5, 0); // Ores are uniform icosahedrons

        // --- Place Rocks on Mine Levels ---
        MINE_AREA.levels.forEach(level => {
            const rockCount = Math.floor(level.depth * 20); // Number of rocks based on level area
            for (let i = 0; i < rockCount; i++) {
                // 70% chance to spawn the level's specific ore, 30% for generic stone
                const type = (this.prng() > 0.3) ? level.name : 'stone';
                
                // Calculate a random position on the current level's rectangle
                const x = MINE_AREA.x + (this.prng() - 0.5) * MINE_AREA.width;
                const y = level.y_start + (this.prng() * level.depth);
                const position = new THREE.Vector3(x, level.height, y);

                this._createRock(scene, type, position);
            }
        });
    }

    _createRock(scene, type, position) {
        let geometry;
        const isOre = type !== 'stone';

        if (isOre) {
            // Ores use the same, non-deformed geometry
            geometry = this.oreGeometry;
        } else {
            // Stone rocks get a unique, deformed shape
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

        // Ores are uniform size, stones are varied
        const scale = isOre ? 0.8 : THREE.MathUtils.lerp(0.4, 1.1, this.prng());
        rockMesh.scale.set(scale, scale, scale);
        
        // Place rock on the ground
        rockMesh.geometry.computeBoundingBox();
        const rockHeight = rockMesh.geometry.boundingBox.max.y - rockMesh.geometry.boundingBox.min.y;
        rockMesh.position.y += (rockHeight * rockMesh.scale.y) / 2;

        rockMesh.rotation.set(this.prng() * Math.PI, this.prng() * Math.PI, this.prng() * Math.PI);

        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        scene.add(rockMesh);
    }
    
    // Seeded pseudo-random number generator
    seededRandom(seed) {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }
}
