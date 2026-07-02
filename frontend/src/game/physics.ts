import type { GameState, Platform } from "./types";
import { PLATFORMS, SQUIRREL_H, SQUIRREL_W, platformTop } from "./types";

const SKIN = 0.06;

function hOverlap(s: GameState, plat: Platform): boolean {
  const sl = s.x - SQUIRREL_W / 2;
  const sr = s.x + SQUIRREL_W / 2;
  const pl = plat.x - plat.width / 2;
  const pr = plat.x + plat.width / 2;
  return sr > pl + SKIN && sl < pr - SKIN;
}

/** Resolve vertical collisions — land on platform tops, bonk head on bottoms */
export function resolveVertical(s: GameState, prevY: number): void {
  const prevFeet = prevY;
  const feet = s.y;
  const head = s.y + SQUIRREL_H;
  const prevHead = prevY + SQUIRREL_H;

  s.onGround = false;

  // Head bonk while rising
  if (s.vy > 0) {
    for (const plat of PLATFORMS) {
      if (!hOverlap(s, plat)) continue;
      const pb = plat.y;
      if (prevHead <= pb + SKIN && head >= pb - SKIN) {
        s.y = pb - SQUIRREL_H - SKIN;
        s.vy = 0;
        return;
      }
    }
  }

  // Land on the highest platform top when falling or resting
  if (s.vy <= 0) {
    let bestTop = -Infinity;

    for (const plat of PLATFORMS) {
      if (!hOverlap(s, plat)) continue;
      const pt = platformTop(plat);

      const crossedDown = prevFeet >= pt - SKIN && feet <= pt + SKIN;
      const resting = Math.abs(feet - pt) <= SKIN;

      if (crossedDown || resting) {
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

/** Side walls — skip while jumping up past a platform edge */
export function resolveHorizontal(s: GameState): void {
  const sl = s.x - SQUIRREL_W / 2;
  const sr = s.x + SQUIRREL_W / 2;
  const head = s.y + SQUIRREL_H;

  for (const plat of PLATFORMS) {
    if (plat.type === "ground") continue;
    if (!hOverlap(s, plat)) continue;

    const pt = platformTop(plat);
    const pb = plat.y;

    // Jumping up from below — pass through the side
    if (s.vy > 0 && s.y < pt - SKIN) continue;

    // Vertically clear of the solid block
    if (head <= pb + SKIN || s.y >= pt + SKIN) continue;

    const pl = plat.x - plat.width / 2;
    const pr = plat.x + plat.width / 2;

    if (s.vx > 0 && sr > pl && s.x < plat.x) {
      s.x = pl - SQUIRREL_W / 2 - SKIN;
      s.vx = 0;
    } else if (s.vx < 0 && sl < pr && s.x > plat.x) {
      s.x = pr + SQUIRREL_W / 2 + SKIN;
      s.vx = 0;
    }
  }
}

export function clampWorld(s: GameState): void {
  if (s.x < -38) s.x = -38;
  if (s.x > 58) s.x = 58;
}
