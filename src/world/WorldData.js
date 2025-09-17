// This file defines the layout of your world.

export const MINE_AREA = {
    x: 75, y: 75,    // The center of the pit
    radius: 35,      // The outermost radius of the pit
    depth: 15,       // The depth at the very bottom
    terraces: 10,    // The number of terraced levels
    tread: 0.7       // 70% of a terrace is flat, 30% is a sloped wall
};

export const TOWN_AREA = { x: 10, y: 0, width: 20, depth: 40, height: 0.1 };

export const OASIS_AREA = { x: -60, y: -80, width: 20, depth: 40, height: -1.0 };
