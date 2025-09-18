// File: src/world/assets/rockLayout.js

// This layout is loaded by the game on startup to place all rocks permanently.
// The mine area is 100x100, from x:0, z:0 to x:100, z:100.
export const permanentRocks = [
    // === ORE ZONES ===
    // Gold Ore (Bottom-Left Corner)
    { type: "Gold Ore", position: { x: 10, y: 0, z: 8 }, scale: 1.0, rotationY: 1.2 },
    { type: "Gold Ore", position: { x: 12, y: 0, z: 12 }, scale: 0.9, rotationY: 2.5 },
    { type: "Gold Ore", position: { x: 8, y: 0, z: 15 }, scale: 1.1, rotationY: 4.1 },
    { type: "Gold Ore", position: { x: 15, y: 0, z: 10 }, scale: 1.0, rotationY: 5.8 },
    { type: "Gold Ore", position: { x: 5, y: 0, z: 5 }, scale: 0.8, rotationY: 0.3 },

    // Iron Ore (Right Side)
    { type: "Iron Ore", position: { x: 92, y: 0, z: 70 }, scale: 1.0, rotationY: 1.0 },
    { type: "Iron Ore", position: { x: 95, y: 0, z: 65 }, scale: 1.1, rotationY: 1.2 },
    { type: "Iron Ore", position: { x: 90, y: 0, z: 60 }, scale: 0.9, rotationY: 1.4 },
    { type: "Iron Ore", position: { x: 93, y: 0, z: 55 }, scale: 1.2, rotationY: 1.6 },
    { type: "Iron Ore", position: { x: 88, y: 0, z: 50 }, scale: 1.0, rotationY: 1.8 },
    { type: "Iron Ore", position: { x: 94, y: 0, z: 45 }, scale: 0.95, rotationY: 2.0 },
    { type: "Iron Ore", position: { x: 91, y: 0, z: 40 }, scale: 1.05, rotationY: 2.2 },
    { type: "Iron Ore", position: { x: 89, y: 0, z: 35 }, scale: 1.1, rotationY: 2.4 },
    { type: "Iron Ore", position: { x: 95, y: 0, z: 30 }, scale: 1.0, rotationY: 2.6 },
    { type: "Iron Ore", position: { x: 92, y: 0, z: 25 }, scale: 1.15, rotationY: 2.8 },

    // Carbon Ore (Top-Left Corner)
    { type: "Carbon Ore", position: { x: 8, y: 0, z: 92 }, scale: 1.0, rotationY: 3.1 },
    { type: "Carbon Ore", position: { x: 12, y: 0, z: 95 }, scale: 0.9, rotationY: 3.3 },
    { type: "Carbon Ore", position: { x: 15, y: 0, z: 90 }, scale: 1.1, rotationY: 3.5 },
    { type: "Carbon Ore", position: { x: 5, y: 0, z: 88 }, scale: 1.2, rotationY: 3.7 },
    { type: "Carbon Ore", position: { x: 10, y: 0, z: 85 }, scale: 1.0, rotationY: 3.9 },
    { type: "Carbon Ore", position: { x: 18, y: 0, z: 94 }, scale: 0.95, rotationY: 4.1 },
    { type: "Carbon Ore", position: { x: 6, y: 0, z: 80 }, scale: 1.0, rotationY: 4.3 },
    { type: "Carbon Ore", position: { x: 14, y: 0, z: 78 }, scale: 1.1, rotationY: 4.5 },
    { type: "Carbon Ore", position: { x: 9, y: 0, z: 75 }, scale: 1.0, rotationY: 4.7 },
    { type: "Carbon Ore", position: { x: 20, y: 0, z: 85 }, scale: 1.05, rotationY: 4.9 },

    // Limestone (Center-Top Area)
    { type: "Limestone", position: { x: 40, y: 0, z: 80 }, scale: 1.1, rotationY: 0.1 },
    { type: "Limestone", position: { x: 45, y: 0, z: 85 }, scale: 1.0, rotationY: 0.3 },
    { type: "Limestone", position: { x: 50, y: 0, z: 90 }, scale: 1.2, rotationY: 0.5 },
    { type: "Limestone", position: { x: 55, y: 0, z: 82 }, scale: 0.9, rotationY: 0.7 },
    { type: "Limestone", position: { x: 60, y: 0, z: 78 }, scale: 1.0, rotationY: 0.9 },
    { type: "Limestone", position: { x: 65, y: 0, z: 88 }, scale: 1.1, rotationY: 1.1 },
    { type: "Limestone", position: { x: 35, y: 0, z: 92 }, scale: 1.0, rotationY: 1.3 },
    { type: "Limestone", position: { x: 70, y: 0, z: 95 }, scale: 0.9, rotationY: 1.5 },
    { type: "Limestone", position: { x: 58, y: 0, z: 94 }, scale: 1.0, rotationY: 1.7 },
    { type: "Limestone", position: { x: 48, y: 0, z: 75 }, scale: 1.2, rotationY: 1.9 },
    
    // === DECORATIVE ROCKS ===
    // Sandstone (Around the outside)
    { type: "Sandstone", position: { x: -2, y: 0, z: 50 }, scale: 1.0, rotationY: 1.5 },
    { type: "Sandstone", position: { x: 102, y: 0, z: 40 }, scale: 1.2, rotationY: 4.2 },
    { type: "Sandstone", position: { x: 60, y: 0, z: -2 }, scale: 0.9, rotationY: 0.5 },
    { type: "Sandstone", position: { x: 40, y: 0, z: 102 }, scale: 1.1, rotationY: 2.1 },
    { type: "Sandstone", position: { x: -3, y: 0, z: 80 }, scale: 0.8, rotationY: 3.3 },
    { type: "Sandstone", position: { x: 103, y: 0, z: 90 }, scale: 1.0, rotationY: 5.5 },
    
    // Mine Outline (Small, dark rocks)
    ...Array.from({ length: 25 }, (_, i) => ({ type: "Stone 4", position: { x: 0, y: 0, z: i * 4 }, scale: 0.5, rotationY: Math.random() * 6 })),
    ...Array.from({ length: 25 }, (_, i) => ({ type: "Stone 4", position: { x: 100, y: 0, z: i * 4 }, scale: 0.5, rotationY: Math.random() * 6 })),
    ...Array.from({ length: 25 }, (_, i) => ({ type: "Stone 4", position: { x: i * 4, y: 0, z: 0 }, scale: 0.5, rotationY: Math.random() * 6 })),
    ...Array.from({ length: 25 }, (_, i) => ({ type: "Stone 4", position: { x: i * 4, y: 0, z: 100 }, scale: 0.5, rotationY: Math.random() * 6 })),

    // General Decoration (Scattered Stones)
    { type: "Stone 1", position: { x: 30, y: 0, z: 30 }, scale: 0.9, rotationY: 0.8 },
    { type: "Stone 2", position: { x: 35, y: 0, z: 50 }, scale: 1.0, rotationY: 2.1 },
    { type: "Stone 3", position: { x: 60, y: 0, z: 20 }, scale: 1.1, rotationY: 3.4 },
    { type: "Stone 1", position: { x: 75, y: 0, z: 55 }, scale: 1.0, rotationY: 5.2 },
    { type: "Stone 2", position: { x: 40, y: 0, z: 15 }, scale: 0.8, rotationY: 1.8 },
];
