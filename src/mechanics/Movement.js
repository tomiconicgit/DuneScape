import * as THREE from 'three';

export default class Movement {
    constructor(characterMesh) {
        this.character = characterMesh;
        this.path = [];
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.moveSpeed = 5;
        this.marker = null;
        this.raycaster = new THREE.Raycaster();
    }
    
    moveCharacter(direction, delta) {
        if (this.isMoving) {
            this.isMoving = false;
            this.path = [];
            if (this.marker && this.marker.parent) this.marker.parent.remove(this.marker);
        }
        
        const moveDistance = this.moveSpeed * delta;
        this.character.position.addScaledVector(direction, moveDistance);
    }

    calculatePathOnTerrain(targetWorldPos, terrainMesh) {
        const startPos = { x: this.character.position.x, z: this.character.position.z };
        const endPos = { x: targetWorldPos.x, z: targetWorldPos.z };
        const flatPath = this._findPath(startPos, endPos);

        if (flatPath.length === 0) return;

        this.followTrail(flatPath.map(p => new THREE.Vector3(p.x, 0, p.z)), terrainMesh);
        this._placeMarker(targetWorldPos.x, targetWorldPos.y + 0.05, targetWorldPos.z);
    }

    followTrail(trailPoints, terrainMesh) {
        this.path = [];
        const down = new THREE.Vector3(0, -1, 0);
        const characterHeight = this.character.geometry.parameters.height;

        for (const point of trailPoints) {
            this.raycaster.set(new THREE.Vector3(point.x, 50, point.z), down);
            const intersects = this.raycaster.intersectObject(terrainMesh);
            if (intersects.length > 0) {
                this.path.push(intersects[0].point.clone().add(new THREE.Vector3(0, characterHeight / 2, 0)));
            }
        }
        
        if (this.path.length > 0) {
            this.currentPathIndex = 0;
            this.isMoving = true;
            if (this.marker && this.marker.parent) this.marker.parent.remove(this.marker);
        }
    }

    update(delta) {
        if (!this.isMoving) return;

        const target = this.path[this.currentPathIndex];
        const direction = new THREE.Vector3().subVectors(target, this.character.position);
        
        const flatDistance = new THREE.Vector2(direction.x, direction.z).length();

        if (flatDistance < 0.1) {
            this.currentPathIndex++;
            if (this.currentPathIndex >= this.path.length) {
                this.isMoving = false;
                this.path = [];
                if (this.marker && this.marker.parent) this.marker.parent.remove(this.marker);
            }
            return;
        }

        direction.normalize();
        const moveDist = Math.min(this.moveSpeed * delta, flatDistance);
        this.character.position.add(direction.multiplyScalar(moveDist));
    }

    _placeMarker(x, y, z) {
        if (!this.marker) {
            const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.marker = new THREE.Mesh(geometry, material);
        }
        this.marker.position.set(x, y, z);
        this.character.parent.add(this.marker);
    }
    
    _findPath(start, goal) {
        const path = [];
        const distance = Math.hypot(goal.x - start.x, goal.z - start.z);
        const segments = Math.ceil(distance / 2); // Waypoint every 2 units

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            path.push({
                x: (1 - t) * start.x + t * goal.x,
                z: (1 - t) * start.z + t * goal.z
            });
        }
        return path;
    }
}
