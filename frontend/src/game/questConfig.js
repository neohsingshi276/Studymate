// ── Quest Map Configuration ─────────────────────────────────────────────────
// Map dimensions come from the Tiled map.json (350×475 tiles × 16px each).
export const TILE_SIZE = 16;
export const MAP_COLS = 350;
export const MAP_ROWS = 475;
export const MAP_WIDTH = MAP_COLS * TILE_SIZE;   // 5600
export const MAP_HEIGHT = MAP_ROWS * TILE_SIZE;   // 7600

// Player speed, used by Phaser matter physics
export const PLAYER_SPEED = 2.5;

// Start position — near the bottom of the map, beside Checkpoint 1
export const START_POS = { x: 1376, y: 6896 };

/** Reject out-of-bounds / garbage saved positions. */
export const isValidSavedPosition = (x, y) =>
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 100 &&
    y >= 100 &&
    x <= MAP_WIDTH - 100 &&
    y <= MAP_HEIGHT - 100;

// Checkpoints on the map. Only Checkpoint 1 (Boss Battle) is playable right
// now — Checkpoints 2 & 3 render as locked markers until those games exist.
// route: null means "not built yet, show a locked/coming-soon marker".
export const CHECKPOINTS = [
    {
        id: 1,
        x: 3040,
        y: 4960,
        radius: 60,
        color: '#7B2FBE',
        label: 'Checkpoint 1 · Boss Battle',
        route: '/game',
    },
    {
        id: 2,
        x: 2800,
        y: 2928,
        radius: 60,
        color: '#CC3380',
        label: 'Checkpoint 2 · Coming soon',
        route: null,
    },
    {
        id: 3,
        x: 2864,
        y: 800,
        radius: 60,
        color: '#E85D04',
        label: 'Checkpoint 3 · Coming soon',
        route: null,
    },
];
