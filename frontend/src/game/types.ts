export type NutTier = "low" | "high";

export interface Nut {
  id: string;
  x: number;
  /** Height above ground */
  y: number;
  tier: NutTier;
  /** 1 = small jump, 2 = big jump */
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
export const MOVE_SPEED = 8;
export const SMALL_JUMP_V = 7.8;
export const BIG_JUMP_V = 11.5;
export const PLAYER_W = 0.7;
export const PLAYER_H = 1;
export const LOW_NUT_Y = 1.35;
export const HIGH_NUT_Y = 2.55;
export const NUT_COUNT = 10;
export const NUT_SPACING = 3.2;
export const NUT_START_X = 4;
export const HORIZONTAL_COLLECT = 2.4;

export const INITIAL_STATE: GameState = {
  x: 1.5,
  y: GROUND_Y,
  vx: 0,
  vy: 0,
  onGround: true,
  facing: 1,
  score: 0,
};

export function worldMaxX(): number {
  return NUT_START_X + (NUT_COUNT - 1) * NUT_SPACING + 4;
}

/** Shuffle step 1 / step 2 in random order each game */
export function createNuts(seed = Date.now()): Nut[] {
  const tiers: NutTier[] = Array.from({ length: NUT_COUNT }, (_, i) =>
    i % 2 === 0 ? "low" : "high"
  );

  let s = seed >>> 0;
  for (let i = tiers.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
  }

  return tiers.map((tier, i) => ({
    id: `n${i + 1}`,
    x: NUT_START_X + i * NUT_SPACING,
    y: tier === "low" ? LOW_NUT_Y : HIGH_NUT_Y,
    tier,
    step: tier === "low" ? 1 : 2,
    collected: false,
  }));
}

export function nextNut(nuts: Nut[]): Nut | undefined {
  return nuts
    .filter((n) => !n.collected)
    .sort((a, b) => a.x - b.x)[0];
}

export function collectRadius(): number {
  return 1.35;
}
