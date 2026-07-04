export type NutTier = "low" | "high";

export interface Nut {
  id: string;
  x: number;
  y: number;
  tier: NutTier;
  step: 1 | 2;
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
export const GRAVITY = -20;
export const MOVE_SPEED = 8.5;
export const SMALL_JUMP_V = 7.8;
export const BIG_JUMP_V = 11.5;
export const PLAYER_W = 0.7;
export const PLAYER_H = 1;
export const LOW_NUT_Y = 1.35;
export const HIGH_NUT_Y = 2.55;
export const NUT_START_X = 4;
export const HORIZONTAL_COLLECT = 2.6;

export const INITIAL_STATE: GameState = {
  x: 1.5,
  y: GROUND_Y,
  vx: 0,
  vy: 0,
  onGround: true,
  facing: 1,
  score: 0,
};

export function nextNut(nuts: Nut[]): Nut | undefined {
  return nuts
    .filter((n) => !n.collected)
    .sort((a, b) => a.x - b.x)[0];
}
