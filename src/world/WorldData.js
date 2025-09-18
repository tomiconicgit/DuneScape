// This file defines the layout of your 800x800 world.
// The world coordinates now range from -400 to +400.

// Quadrant centers:
// Top-Left: (-200, -200)
// Bottom-Left: (-200, 200)
// Bottom-Right: (200, 200)
// Top-Right: (200, -200) - Wildlands

export const MINE_AREA = { x: -200, y: -200, width: 50, depth: 50, height: 0.1 };

export const TOWN_AREA = { x: -200, y: 200, width: 70, depth: 50, height: 0.1 };

export const OASIS_AREA = { x: 200, y: 200, width: 40, depth: 50, height: -1.0 };
