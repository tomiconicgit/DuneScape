// File: src/entities/Player.js
import * as THREE from 'three';

const states = {
    IDLE: 'idle',
    WALKING: 'walking',
    MINING: 'mining',
};

export default class Player {
    constructor(scene, game) { // ✨ CHANGED: Receives the main game instance
        this.game = game; // Store reference to the game to access the grid
        this.state = states.IDLE;
        this.animationTimer = 0;

        this.rig = {};
        this.mesh = this.createCharacterRig();
        
        this.mesh.position.set(50, 1.0, 102); 
        scene.add(this.mesh);

        this.path = [];
        this.speed = 4.0;
        this.tileSize = 1.0;

        // ... (rest of constructor is unchanged)
    }

    createCharacterRig() {
        // ... (this function is unchanged)
    }
    
    startMining(targetRock) {
        // ... (this function is unchanged)
    }

    moveTo(targetPosition) {
        // ... (this function is unchanged)
    }

    // ✨ CHANGED: Replaced the simple diagonal movement with the A* pathfinding algorithm.
    calculatePath(startX, startZ, endX, endZ) {
        const grid = this.game.grid;
        if (!grid) return [];

        const openSet = [];
        const closedSet = new Set();
        const startNode = { x: startX, z: startZ, g: 0, h: 0, f: 0, parent: null };
        const endNode = { x: endX, z: endZ };

        openSet.push(startNode);

        const getHeuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const currentNode = openSet.shift();

            if (currentNode.x === endNode.x && currentNode.z === endNode.z) {
                // Path found, reconstruct it
                const path = [];
                let temp = currentNode;
                while (temp) {
                    path.push(new THREE.Vector2(temp.x, temp.z));
                    temp = temp.parent;
                }
                return path.reverse();
            }

            closedSet.add(`${currentNode.x},${currentNode.z}`);

            for (let dx = -1; dx <= 1; dx++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dz === 0) continue;

                    const neighborX = currentNode.x + dx;
                    const neighborZ = currentNode.z + dz;

                    // Check bounds and if walkable
                    if (neighborX < 0 || neighborX >= grid.length || neighborZ < 0 || neighborZ >= grid[0].length || grid[neighborX][neighborZ] === 1) {
                        continue;
                    }

                    if (closedSet.has(`${neighborX},${neighborZ}`)) {
                        continue;
                    }
                    
                    const gCost = currentNode.g + 1;
                    let neighbor = openSet.find(n => n.x === neighborX && n.z === neighborZ);

                    if (!neighbor || gCost < neighbor.g) {
                        if (!neighbor) {
                            neighbor = { x: neighborX, z: neighborZ };
                            openSet.push(neighbor);
                        }
                        neighbor.g = gCost;
                        neighbor.h = getHeuristic(neighbor, endNode);
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.parent = currentNode;
                    }
                }
            }
        }
        return []; // No path found
    }

    updatePathLine() {
        // ... (this function is unchanged)
    }

    update(deltaTime) {
        // ... (this function is unchanged)
    }
    
    updateMovement(deltaTime) {
        // ... (this function is unchanged)
    }
    
    updateMineTimer(deltaTime) {
        // ... (this function is unchanged)
    }

    updateIdleAnimation() {
        // ... (this function is unchanged)
    }

    updateWalkAnimation() {
        // ... (this function is unchanged)
    }

    updateMineAnimation() {
        // ... (this function is unchanged)
    }
}
