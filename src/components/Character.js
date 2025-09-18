import * as THREE from 'three';
import { TOWN_AREA } from '../world/WorldData.js';

export default class Character {
    constructor(scene) {
        const width = 0.4;
        const height = 1.2;
        const depth = 0.4;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        
        this.mesh = new THREE.Mesh(geometry, material);

        // Set the starting position to the center of the new Town area
        this.mesh.position.set(TOWN_AREA.x, height, TOWN_AREA.y);
        
        scene.add(this.mesh);
    }
}
