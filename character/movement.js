import * as THREE from 'three';
import VisualMap from '../environment/visualmap.js';

const Movement = {
    character: null,
    scene: null,
    path: [],
    currentPathIndex: 0,
    moveSpeed: 2, // Units per second
    marker: null,
    raycaster: new THREE.Raycaster(),
    plane: null,
    isMoving: false,
    cameraSystem: null,
    buildMode: null, // texture type string when in build mode

    init(character, scene, camera, plane) {
        this.character = character;
        this.scene = scene;
        this.cameraSystem = camera; 
        this.plane = plane;
        this.cameraSystem.setOnTap((touch) => this.handleTap(touch));
    },

    setBuildMode(type) {
        this.buildMode = type;
    },

    handleTap(touch) {
        const mouse = new THREE.Vector2();
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(mouse, this.cameraSystem.camera);

        const intersects = this.raycaster.intersectObject(this.plane);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const targetGrid = this.getGridPos(point);

            if (this.buildMode) {
                // Paint the tile instead of moving
                VisualMap.paintTile(targetGrid, this.buildMode);
                return;
            }

            // Normal movement mode
            const targetPos = { x: point.x, z: point.z };
            this.placeMarker(targetPos.x, 0.1, targetPos.z);
            this.calculatePath(targetGrid);
        }
    },

    placeMarker(x, y, z) {
        if (this.marker) {
            this.scene.remove(this.marker);
        }
        const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.marker = new THREE.Mesh(geometry, material);
        this.marker.position.set(x, y, z);
        this.scene.add(this.marker);
    },

    calculatePath(targetGrid) {
        const startGrid = this.getGridPos(this.character.position);
        const gridPath = this.findPath(startGrid, targetGrid);
        this.path = gridPath.map(g => ({
            x: g.x - VisualMap.size / 2 + 0.5,
            y: this.character.position.y,
            z: g.z - VisualMap.size / 2 + 0.5
        }));
        this.currentPathIndex = 0;
        this.isMoving = this.path.length > 0;
    },

    update(delta) {
        if (!this.isMoving || this.path.length === 0) return;

        const target = this.path[this.currentPathIndex];
        const direction = new THREE.Vector3().subVectors(target, this.character.position);
        const distance = direction.length();

        if (distance < 0.01) {
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.path.length) {
                this.isMoving = false;
                return;
            }
            return;
        }

        direction.normalize();
        const moveDist = this.moveSpeed * delta;
        if (moveDist >= distance) {
            this.character.position.copy(target);
        } else {
            this.character.position.add(direction.multiplyScalar(moveDist));
        }
    },

    getGridPos(pos) {
        const half = VisualMap.size / 2;
        return { 
            x: Math.floor(pos.x + half),
            z: Math.floor(pos.z + half)
        };
    },

    findPath(start, goal) {
        const openSet = [];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        const key = (p) => `${p.x},${p.z}`;

        gScore.set(key(start), 0);
        fScore.set(key(start), Math.abs(goal.x - start.x) + Math.abs(goal.z - start.z));
        openSet.push(start);

        while (openSet.length > 0) {
            openSet.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
            const current = openSet.shift();

            if (current.x === goal.x && current.z === goal.z) {
                const path = [];
                let curr = current;
                while (curr) {
                    path.push(curr);
                    curr = cameFrom.get(key(curr));
                }
                path.reverse();
                return path;
            }

            const neighbors = [
                { x: current.x + 1, z: current.z },
                { x: current.x - 1, z: current.z },
                { x: current.x, z: current.z + 1 },
                { x: current.x, z: current.z - 1 },
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
};

export default Movement;