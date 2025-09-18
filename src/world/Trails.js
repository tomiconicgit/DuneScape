import * as THREE from 'three';
import { trailNetwork } from './WorldData.js';

export default class Trails {
    constructor(scene, terrainMesh) {
        const trailMaterial = new THREE.MeshStandardMaterial({
            color: 0x9c7c4f, // Darker trail color
            roughness: 1.0,
            metalness: 0.0
        });

        const raycaster = new THREE.Raycaster();
        const down = new THREE.Vector3(0, -1, 0);

        Object.values(trailNetwork).forEach(curve => {
            const points = curve.getPoints(200); // Get points along the curve
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i+1];

                const segmentLength = p1.distanceTo(p2);
                if (segmentLength < 0.1) continue; // Skip tiny segments

                // Create a plane for this segment of the trail
                const segmentGeo = new THREE.PlaneGeometry(3, segmentLength);
                const segmentMesh = new THREE.Mesh(segmentGeo, trailMaterial);

                // Position the plane at the midpoint of the segment
                const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
                
                // Raycast to find the terrain height below the midpoint
                raycaster.set(new THREE.Vector3(midPoint.x, 50, midPoint.z), down);
                const intersects = raycaster.intersectObject(terrainMesh);
                if (intersects.length > 0) {
                    const groundHeight = intersects[0].point.y;
                    segmentMesh.position.set(midPoint.x, groundHeight + 0.1, midPoint.z); // Place just above terrain
                }

                // Rotate the plane to align with the trail segment
                segmentMesh.lookAt(p2);
                segmentMesh.rotation.x = -Math.PI / 2;

                segmentMesh.receiveShadow = true;
                scene.add(segmentMesh);
            }
        });
    }
}
