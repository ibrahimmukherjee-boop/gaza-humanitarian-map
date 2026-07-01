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
  jumpCount: number;
}

export const GRAVITY = -28;
export const JUMP_FORCE = 11;
export const MOVE_SPEED = 7;
export const SQUIRREL_W = 0.7;
export const SQUIRREL_H = 1.1;

export const INITIAL_STATE: GameState = {
  x: 0,
  y: 0.5,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
  score: 0,
  eating: false,
  eatTimer: 0,
  jumpCount: 0,
};

export const PLATFORMS: Platform[] = [
  { id: "ground", x: 0, y: -0.5, width: 80, height: 1, type: "ground" },
  { id: "p1", x: 3, y: 1.2, width: 2.5, height: 0.5, type: "brick" },
  { id: "p2", x: 7, y: 2.4, width: 2, height: 0.5, type: "question" },
  { id: "p3", x: 11, y: 1.8, width: 3, height: 0.5, type: "brick" },
  { id: "p4", x: 16, y: 3.2, width: 2.5, height: 0.5, type: "brick" },
  { id: "p5", x: 20, y: 2, width: 2, height: 0.5, type: "question" },
  { id: "p6", x: 24, y: 4, width: 3, height: 0.5, type: "brick" },
  { id: "p7", x: 29, y: 2.8, width: 2, height: 0.5, type: "brick" },
  { id: "p8", x: 33, y: 1.5, width: 2.5, height: 0.5, type: "question" },
  { id: "p9", x: 38, y: 3.5, width: 3, height: 0.5, type: "brick" },
  { id: "p10", x: 43, y: 2.2, width: 2, height: 0.5, type: "brick" },
  { id: "p11", x: 47, y: 4.5, width: 2.5, height: 0.5, type: "question" },
  { id: "p12", x: 52, y: 3, width: 3, height: 0.5, type: "brick" },
];

export function createNuts(): Nut[] {
  return [
    { id: "n1", x: 3.2, y: 2.1, collected: false },
    { id: "n2", x: 7.1, y: 3.3, collected: false },
    { id: "n3", x: 11.5, y: 2.7, collected: false },
    { id: "n4", x: 16.2, y: 4.1, collected: false },
    { id: "n5", x: 20.1, y: 2.9, collected: false },
    { id: "n6", x: 24.5, y: 4.9, collected: false },
    { id: "n7", x: 29.1, y: 3.7, collected: false },
    { id: "n8", x: 33.3, y: 2.4, collected: false },
    { id: "n9", x: 38.5, y: 4.4, collected: false },
    { id: "n10", x: 43.1, y: 3.1, collected: false },
    { id: "n11", x: 47.3, y: 5.4, collected: false },
    { id: "n12", x: 52.5, y: 3.9, collected: false },
    { id: "n13", x: 5, y: 0.8, collected: false },
    { id: "n14", x: 14, y: 0.8, collected: false },
    { id: "n15", x: 55, y: 0.8, collected: false },
  ];
}
