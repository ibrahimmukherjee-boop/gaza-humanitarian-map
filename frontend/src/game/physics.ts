import type { GameState } from "./types";
import {
  GROUND_Y,
  GRAVITY,
  WORLD_MIN_X,
  WORLD_MAX_X,
  PLAYER_W,
  SMALL_JUMP_V,
  BIG_JUMP_V,
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
  if (s.x < WORLD_MIN_X + half) {
    s.x = WORLD_MIN_X + half;
    s.vx = 0;
  }
  if (s.x > WORLD_MAX_X - half) {
    s.x = WORLD_MAX_X - half;
    s.vx = 0;
  }
}

export function applyJump(s: GameState, strength: "small" | "big"): void {
  s.vy = strength === "small" ? SMALL_JUMP_V : BIG_JUMP_V;
  s.onGround = false;
}
