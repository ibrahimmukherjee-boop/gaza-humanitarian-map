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

export const GRAVITY = -32;
export const JUMP_FORCE = 13.5;
export const MOVE_SPEED = 7.5;
export const SQUIRREL_W = 0.65;
export const SQUIRREL_H = 1.0;

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

/** Platform y = bottom edge; top surface = y + height */
export const PLATFORMS: Platform[] = [
  { id: "ground", x: 0, y: -0.5, width: 80, height: 1, type: "ground" },
  { id: "p1", x: 3, y: 0.5, width: 2.5, height: 0.5, type: "brick" },
  { id: "p2", x: 6.5, y: 1.2, width: 2, height: 0.5, type: "question" },
  { id: "p3", x: 10, y: 1.9, width: 2.5, height: 0.5, type: "brick" },
  { id: "p4", x: 14, y: 2.6, width: 2, height: 0.5, type: "brick" },
  { id: "p5", x: 17.5, y: 1.5, width: 2, height: 0.5, type: "question" },
  { id: "p6", x: 21, y: 2.2, width: 2.5, height: 0.5, type: "brick" },
  { id: "p7", x: 25, y: 3.0, width: 2, height: 0.5, type: "brick" },
  { id: "p8", x: 28.5, y: 2.0, width: 2.5, height: 0.5, type: "question" },
  { id: "p9", x: 32, y: 2.8, width: 2, height: 0.5, type: "brick" },
  { id: "p10", x: 35.5, y: 3.6, width: 2.5, height: 0.5, type: "question" },
  { id: "p11", x: 39, y: 2.5, width: 2, height: 0.5, type: "brick" },
  { id: "p12", x: 42.5, y: 3.2, width: 2.5, height: 0.5, type: "brick" },
  { id: "p13", x: 46, y: 4.0, width: 2, height: 0.5, type: "question" },
  { id: "p14", x: 49.5, y: 3.0, width: 2.5, height: 0.5, type: "brick" },
  { id: "p15", x: 53, y: 3.8, width: 3, height: 0.5, type: "brick" },
];

export function platformTop(plat: Platform): number {
  return plat.y + plat.height;
}

export function createNuts(): Nut[] {
  return [
    { id: "n1", x: 3, y: 1.35, collected: false },
    { id: "n2", x: 6.5, y: 2.05, collected: false },
    { id: "n3", x: 10, y: 2.75, collected: false },
    { id: "n4", x: 14, y: 3.45, collected: false },
    { id: "n5", x: 17.5, y: 2.35, collected: false },
    { id: "n6", x: 21, y: 3.05, collected: false },
    { id: "n7", x: 25, y: 3.85, collected: false },
    { id: "n8", x: 28.5, y: 2.85, collected: false },
    { id: "n9", x: 32, y: 3.65, collected: false },
    { id: "n10", x: 35.5, y: 4.45, collected: false },
    { id: "n11", x: 39, y: 3.35, collected: false },
    { id: "n12", x: 42.5, y: 4.05, collected: false },
    { id: "n13", x: 46, y: 4.85, collected: false },
    { id: "n14", x: 49.5, y: 3.75, collected: false },
    { id: "n15", x: 53, y: 4.55, collected: false },
    { id: "n16", x: 1.5, y: 1.0, collected: false },
    { id: "n17", x: 55, y: 1.0, collected: false },
  ];
}
