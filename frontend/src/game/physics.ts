import type { GameState } from "./types";
import {
  GROUND_Y,
  GRAVITY,
  PLAYER_W,
  SMALL_JUMP_V,
  BIG_JUMP_V,
  worldMaxX,
} from "./types";

export function stepPhysics(s: GameState, dt: number): void {
  s.vy += GRAVITY * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;

  if (s.y <= GROUND_Y) {
    s.y = GROUND_Y;
    s.vy = 0;
    s.onGround = true;
  } else {
    s.onGround = false;
  }

  const half = PLAYER_W / 2;
  const minX = 0.5;
  const maxX = worldMaxX() - half;
  if (s.x < minX) {
    s.x = minX;
    s.vx = 0;
  }
  if (s.x > maxX) {
    s.x = maxX;
    s.vx = 0;
  }
}

export function applyJump(s: GameState, strength: "small" | "big"): void {
  s.vy = strength === "small" ? SMALL_JUMP_V : BIG_JUMP_V;
  s.onGround = false;
}
