// This file will store shared constants for your world.

export const MINE_AREA = {
    x: 75, y: 85, width: 40, depth: 60, // The entire footprint of the mine area
    slope_width: 4, // How wide the sandy slope is between levels
    levels: [
        // Top level
        { name: 'carbon',    y_start: 55, height: 0.1 },
        // Middle level
        { name: 'limestone', y_start: 79, height: -0.5 },
        // Bottom level
        { name: 'iron',      y_start: 103, height: -1.0 }
    ]
};

export const TOWN_AREA = { x: 10, y: 0, width: 20, depth: 40, height: 0.1 };

export const OASIS_AREA = { x: -60, y: -80, width: 20, depth: 40, height: -1.0 };
