// This file defines the layout of your world.

export const MINE_AREA = {
    x: 75, y: 75, width: 50, depth: 60, // The entire flat footprint of the mine
    base_height: 0.0, // The ground level of the mine
    patches: [
        { name: 'iron',      x: 68, y: 70, width: 10, depth: 15, height: 0.1 },
        { name: 'carbon',    x: 82, y: 70, width: 10, depth: 15, height: 0.1 },
        { name: 'limestone', x: 75, y: 90, width: 15, depth: 10, height: 0.1 }
    ]
};

export const TOWN_AREA = { x: 10, y: 0, width: 20, depth: 40, height: 0.1 };

export const OASIS_AREA = { x: -60, y: -80, width: 20, depth: 40, height: -1.0 };
