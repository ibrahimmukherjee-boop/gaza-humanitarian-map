export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "ground" | "brick" | "question";
}

export interface Nut {
  id: string;
  x: number;
  y: number;
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
  eating: boolean;
  eatTimer: number;
}

export const GRAVITY = -30;
export const JUMP_FORCE = 15;
export const MOVE_SPEED = 8;
export const SQUIRREL_W = 0.6;
export const SQUIRREL_H = 0.95;

export const INITIAL_STATE: GameState = {
  x: 0,
  y: 0.5,
  vx: 0,
  vy: 0,
  onGround: true,
  facing: 1,
  score: 0,
  eating: false,
  eatTimer: 0,
};

/** Platform y = bottom edge; top walk surface = y + height */
export const PLATFORMS: Platform[] = [
  { id: "ground", x: 0, y: -0.5, width: 80, height: 1, type: "ground" },
  // Even staircase — 0.5 unit rises, overlapping x for easy jumps
  { id: "p1", x: 3.5, y: 0.5, width: 2.8, height: 0.5, type: "brick" },
  { id: "p2", x: 6.5, y: 1.0, width: 2.8, height: 0.5, type: "question" },
  { id: "p3", x: 9.5, y: 1.5, width: 2.8, height: 0.5, type: "brick" },
  { id: "p4", x: 12.5, y: 2.0, width: 2.8, height: 0.5, type: "brick" },
  { id: "p5", x: 15.5, y: 2.5, width: 2.8, height: 0.5, type: "question" },
  { id: "p6", x: 18.5, y: 3.0, width: 2.8, height: 0.5, type: "brick" },
  { id: "p7", x: 21.5, y: 3.5, width: 2.8, height: 0.5, type: "question" },
  { id: "p8", x: 24.5, y: 4.0, width: 2.8, height: 0.5, type: "brick" },
  { id: "p9", x: 27.5, y: 4.5, width: 2.8, height: 0.5, type: "question" },
  { id: "p10", x: 30.5, y: 5.0, width: 3, height: 0.5, type: "brick" },
];

export function platformTop(plat: Platform): number {
  return plat.y + plat.height;
}

export function createNuts(): Nut[] {
  return PLATFORMS.filter((p) => p.type !== "ground").map((p, i) => ({
    id: `n${i + 1}`,
    x: p.x,
    y: platformTop(p) + 0.35,
    collected: false,
  }));
}
