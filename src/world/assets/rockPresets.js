// File: src/world/assets/rockPresets.js
import * as THREE from 'three';

// Helper to convert plain objects to Vector2, as the config needs them
const v2 = (x, y) => new THREE.Vector2(x, y);

export const rockPresets = {
    "Limestone": {
        detail: 9, displacement: 0.35, metalness: 0.3, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.35, 40),
        scaleX: 1.1, scaleY: 1, scaleZ: 1.4,
        colorDark: 11382189, colorBase: 16710877, colorHighlight: 15461355,
    },
    "Carbon Ore": {
        detail: 9, displacement: 0.35, metalness: 0.3, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.35, 40),
        scaleX: 1.1, scaleY: 1, scaleZ: 1.4,
        colorDark: 4671303, colorBase: 3355443, colorHighlight: 11382189,
    },
    "Iron Ore": {
        detail: 9, displacement: 0.35, metalness: 0.3, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.35, 40),
        scaleX: 1.1, scaleY: 1, scaleZ: 1.4,
        colorDark: 5780224, colorBase: 11353600, colorHighlight: 10066329,
    },
    "Gold Ore": {
        detail: 9, displacement: 0.35, metalness: 0.3, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.35, 40),
        scaleX: 1.1, scaleY: 1, scaleZ: 1.4,
        colorDark: 11102208, colorBase: 0, colorHighlight: 16631552,
    },
    "Stone 1": {
        detail: 6, displacement: 0.3, metalness: 0.3, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.35, 40),
        scaleX: 1, scaleY: 0.7, scaleZ: 1.1,
        colorDark: 3355443, colorBase: 6052956, colorHighlight: 12763842,
    },
    "Stone 2": {
        detail: 6, displacement: 0.3, metalness: 0.3, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.35, 40),
        scaleX: 0.5, scaleY: 0.4, scaleZ: 0.7,
        colorDark: 3355443, colorBase: 6052956, colorHighlight: 12763842,
    },
    "Stone 3": {
        detail: 6, displacement: 0.3, metalness: 0.3, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.35, 40),
        scaleX: 1.1, scaleY: 0.4, scaleZ: 0.7,
        colorDark: 3355443, colorBase: 6052956, colorHighlight: 12763842,
    },
    "Stone 4": {
        detail: 6, displacement: 0.3, metalness: 0.3, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.35, 40),
        scaleX: 0.5, scaleY: 0.3, scaleZ: 0.4,
        colorDark: 3355443, colorBase: 6052956, colorHighlight: 12763842,
    },
    "Sandstone": {
        detail: 6, displacement: 0.3, metalness: 0, radius: 1.5,
        aoParam: v2(1, 1.4), cornerParam: v2(0.05, 40),
        scaleX: 1.2, scaleY: 0.9, scaleZ: 0.8,
        colorDark: 16772308, colorBase: 16773845, colorHighlight: 0,
    },
};
