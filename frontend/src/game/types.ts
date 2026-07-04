export interface Nut {
  id: string;
  x: number;
  /** Height above ground — reach with small or big jump */
  y: number;
  tier: "low" | "high";
  collected: boolean;
}

export interface GameState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  score: number;
}

export const GROUND_Y = 0;
export const GRAVITY = -22;
export const MOVE_SPEED = 7.5;
/** Tuned so peak body height reaches low nuts (~1.55) */
export const SMALL_JUMP_V = 8.5;
/** Tuned so peak body height reaches high nuts (~2.85) */
export const BIG_JUMP_V = 11;
export const PLAYER_W = 0.7;
export const PLAYER_H = 1;
export const WORLD_MIN_X = -1;
export const WORLD_MAX_X = 36;

export const INITIAL_STATE: GameState = {
  x: 1,
  y: GROUND_Y,
  vx: 0,
  vy: 0,
  onGround: true,
  facing: 1,
  score: 0,
};

/** Flat meadow — nuts at two heights */
export const NUTS: Omit<Nut, "collected">[] = [
  { id: "n1", x: 4, y: 1.55, tier: "low" },
  { id: "n2", x: 8, y: 2.85, tier: "high" },
  { id: "n3", x: 12, y: 1.55, tier: "low" },
  { id: "n4", x: 16, y: 2.85, tier: "high" },
  { id: "n5", x: 20, y: 1.55, tier: "low" },
  { id: "n6", x: 24, y: 2.85, tier: "high" },
  { id: "n7", x: 28, y: 1.55, tier: "low" },
  { id: "n8", x: 32, y: 2.85, tier: "high" },
];

export function createNuts(): Nut[] {
  return NUTS.map((n) => ({ ...n, collected: false }));
}

export function collectRadius(): number {
  return 1.1;
}

export function peakHeight(jumpV: number): number {
  return (jumpV * jumpV) / (2 * Math.abs(GRAVITY));
}
