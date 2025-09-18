import * as THREE from 'three';

// This file defines the layout of your 800x800 world.

export const MINE_AREA = { x: -200, y: -200, width: 50, depth: 50, height: 0.1 };

export const TOWN_AREA = { x: -200, y: 200, width: 70, depth: 50, height: 0.1 };

export const OASIS_AREA = { x: 200, y: 200, width: 40, depth: 50, height: -1.0 };

// --- Centralized Trail Network ---
// We define the curves here so they can be used for both visuals and navigation.
export const trailNetwork = {
    townToMine: new THREE.CatmullRomCurve3([
        new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(MINE_AREA.x, MINE_AREA.y, 0)
    ]),
    townToOasis: new THREE.CatmullRomCurve3([
        new THREE.Vector3(TOWN_AREA.x, TOWN_AREA.y, 0),
        new THREE.Vector3(0, 200, 0),
        new THREE.Vector3(OASIS_AREA.x, OASIS_AREA.y, 0)
    ]),
    mineToOasis: new THREE.CatmullRomCurve3([
        new THREE.Vector3(MINE_AREA.x, MINE_AREA.y, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(OASIS_AREA.x, OASIS_AREA.y, 0)
    ])
};
