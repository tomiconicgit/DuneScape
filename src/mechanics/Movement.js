import * as THREE from 'three';

export default class Movement {
    constructor(characterMesh) {
        this.character = characterMesh;
        this.path = [];
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.moveSpeed = 2;
        this.marker = null; // Can be managed here or in a separate UI class
    }

    calculatePath(targetWorldPos, targetGrid) {
        const startGrid = this._getGridPos(this.character.position);
        const gridPath = this._findPath(startGrid, targetGrid);

        if (gridPath.length > 0) {
            this.path = gridPath.map(g => new THREE.Vector3(
                g.x - 50 + 0.5,
                this.character.position.y,
                g.z - 50 + 0.5
            ));
            this.currentPathIndex = 0;
            this.isMoving = true;
            this._placeMarker(targetWorldPos.x, 0.05, targetWorldPos.z);
        }
    }

    update(delta) {
        if (!this.isMoving) return;

        const target = this.path[this.currentPathIndex];
        const direction = new THREE.Vector3().subVectors(target, this.character.position);
        const distance = direction.length();

        if (distance < 0.01) {
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.path.length) {
                this.isMoving = false;
                this.path = [];
                if (this.marker && this.marker.parent) this.marker.parent.remove(this.marker);
            }
            return;
        }

        direction.normalize();
        const moveDist = Math.min(this.moveSpeed * delta, distance);
        this.character.position.add(direction.multiplyScalar(moveDist));
    }

    _placeMarker(x, y, z) {
        if (!this.marker) {
            const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.marker = new THREE.Mesh(geometry, material);
        }
        this.marker.position.set(x, y, z);
        this.character.parent.add(this.marker); // Add marker to the scene
    }
    
    _getGridPos(pos) {
        return { 
            x: Math.floor(pos.x + 50), 
            z: Math.floor(pos.z + 50) 
        };
    }

    _findPath(start, goal) {
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        const key = p => `${p.x},${p.z}`;

        gScore.set(key(start), 0);
        fScore.set(key(start), Math.abs(goal.x - start.x) + Math.abs(goal.z - start.z));

        while (openSet.length > 0) {
            openSet.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
            const current = openSet.shift();

            if (current.x === goal.x && current.z === goal.z) {
                let path = [];
                let curr = current;
                while (curr) {
                    path.unshift(curr);
                    curr = cameFrom.get(key(curr));
                }
                return path;
            }

            const neighbors = [
                { x: current.x + 1, z: current.z }, { x: current.x - 1, z: current.z },
                { x: current.x, z: current.z + 1 }, { x: current.x, z: current.z - 1 },
            ];

            for (const neigh of neighbors) {
                const tentG = gScore.get(key(current)) + 1;
                const nkey = key(neigh);
                if (!gScore.has(nkey) || tentG < gScore.get(nkey)) {
                    cameFrom.set(nkey, current);
                    gScore.set(nkey, tentG);
                    fScore.set(nkey, tentG + Math.abs(goal.x - neigh.x) + Math.abs(goal.z - neigh.z));
                    if (!openSet.some(p => p.x === neigh.x && p.z === neigh.z)) {
                        openSet.push(neigh);
                    }
                }
            }
        }
        return [];
    }
}
