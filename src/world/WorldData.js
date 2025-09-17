// This file will store shared constants for your world.

export const MINE_AREA = {
    x: 75,
    y: 75,
    // The levels of the mine, from top to bottom
    levels: [
        { name: 'limestone', depth: 2, radius: 20 },
        { name: 'carbon', depth: 5, radius: 14 },
        { name: 'iron', depth: 8, radius: 8 }
    ]
};

export const TOWN_AREA = { x: 10, y: 0, width: 20, depth: 40, height: 0.1 };
export const OASIS_AREA = { x: -60, y: -80, width: 20, depth: 40, height: -1.0 };
