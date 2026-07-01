import type { GameState, Platform } from "./types";
import { PLATFORMS, SQUIRREL_H, SQUIRREL_W, platformTop } from "./types";

const LAND_TOLERANCE = 0.35;
const SKIN = 0.02;

function hOverlap(s: GameState, plat: Platform): boolean {
  const sl = s.x - SQUIRREL_W / 2;
  const sr = s.x + SQUIRREL_W / 2;
  const pl = plat.x - plat.width / 2;
  const pr = plat.x + plat.width / 2;
  return sr > pl + SKIN && sl < pr - SKIN;
}

/** Resolve vertical collisions after position integration */
export function resolveVertical(s: GameState, prevY: number): void {
  const feet = s.y;
  const head = s.y + SQUIRREL_H;

  s.onGround = false;

  // Head bonk when moving up
  if (s.vy > 0) {
    for (const plat of PLATFORMS) {
      if (!hOverlap(s, plat)) continue;
      const pb = plat.y;
      const prevHead = prevY + SQUIRREL_H;
      if (prevHead <= pb + SKIN && head >= pb - SKIN) {
        s.y = pb - SQUIRREL_H - SKIN;
        s.vy = 0;
        return;
      }
    }
  }

  // Land on highest platform beneath feet when falling
  if (s.vy <= 0) {
    let bestTop = -Infinity;
    const prevFeet = prevY;

    for (const plat of PLATFORMS) {
      if (!hOverlap(s, plat)) continue;
      const pt = platformTop(plat);

      // Must have been at or above this surface recently, now at/below it
      const crossing =
        prevFeet >= pt - LAND_TOLERANCE && feet <= pt + LAND_TOLERANCE;
      const nearSurface = Math.abs(feet - pt) < LAND_TOLERANCE;

      if ((crossing || nearSurface) && feet <= pt + LAND_TOLERANCE) {
        if (pt > bestTop) bestTop = pt;
      }
    }

    if (bestTop > -Infinity) {
      s.y = bestTop;
      s.vy = 0;
      s.onGround = true;
    }
  }
}

/** Resolve horizontal collisions */
export function resolveHorizontal(s: GameState, prevX: number): void {
  const sl = s.x - SQUIRREL_W / 2;
  const sr = s.x + SQUIRREL_W / 2;
  const sb = s.y;
  const st = s.y + SQUIRREL_H;

  for (const plat of PLATFORMS) {
    if (plat.type === "ground") continue;
    const pl = plat.x - plat.width / 2;
    const pr = plat.x + plat.width / 2;
    const pb = plat.y;
    const pt = platformTop(plat);

    if (st <= pb + SKIN || sb >= pt - SKIN) continue;
    if (sr <= pl + SKIN || sl >= pr - SKIN) continue;

    const prevSl = prevX - SQUIRREL_W / 2;
    const prevSr = prevX + SQUIRREL_W / 2;

    if (s.vx > 0 && prevSr <= pl + SKIN) {
      s.x = pl - SQUIRREL_W / 2 - SKIN;
      s.vx = 0;
    } else if (s.vx < 0 && prevSl >= pr - SKIN) {
      s.x = pr + SQUIRREL_W / 2 + SKIN;
      s.vx = 0;
    }
  }
}

/** Keep player in world bounds */
export function clampWorld(s: GameState): void {
  if (s.x < -38) s.x = -38;
  if (s.x > 58) s.x = 58;
}
