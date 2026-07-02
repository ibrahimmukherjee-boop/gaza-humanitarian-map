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
export const JUMP_FORCE = 14;
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
  // Stair-step blocks — each step ~0.6–0.8 units (reachable with jump ~3.2)
  { id: "p1", x: 3.5, y: 0.5, width: 2.2, height: 0.5, type: "brick" },
  { id: "p2", x: 7, y: 1.1, width: 2.2, height: 0.5, type: "question" },
  { id: "p3", x: 10.5, y: 1.7, width: 2.2, height: 0.5, type: "brick" },
  { id: "p4", x: 14, y: 2.3, width: 2.2, height: 0.5, type: "brick" },
  { id: "p5", x: 17.5, y: 1.5, width: 2, height: 0.5, type: "question" },
  { id: "p6", x: 21, y: 2.1, width: 2.2, height: 0.5, type: "brick" },
  { id: "p7", x: 24.5, y: 2.7, width: 2.2, height: 0.5, type: "question" },
  { id: "p8", x: 28, y: 3.3, width: 2.2, height: 0.5, type: "brick" },
  { id: "p9", x: 31.5, y: 2.5, width: 2, height: 0.5, type: "question" },
  { id: "p10", x: 35, y: 3.1, width: 2.2, height: 0.5, type: "brick" },
  { id: "p11", x: 38.5, y: 3.7, width: 2.2, height: 0.5, type: "question" },
  { id: "p12", x: 42, y: 4.3, width: 2.5, height: 0.5, type: "brick" },
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
