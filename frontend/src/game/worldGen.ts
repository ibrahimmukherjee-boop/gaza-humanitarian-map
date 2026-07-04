import type { Nut, NutTier } from "./types";
import {
  LOW_NUT_Y,
  HIGH_NUT_Y,
  NUT_START_X,
  HORIZONTAL_COLLECT,
} from "./types";

export interface SceneryProp {
  id: string;
  x: number;
  kind: "tree" | "bush" | "rock" | "flower";
  scale: number;
  z: number;
}

export interface WorldConfig {
  seed: number;
  nuts: Omit<Nut, "collected">[];
  props: SceneryProp[];
  skyTop: string;
  skyBottom: string;
  grass: string;
  nutSpacing: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function generateWorld(seed = Date.now()): WorldConfig {
  const rand = rng(seed);
  const nutCount = 8 + Math.floor(rand() * 4);
  const tiers: NutTier[] = [];

  for (let i = 0; i < nutCount; i++) {
    tiers.push(rand() > 0.5 ? "high" : "low");
  }

  for (let i = tiers.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
  }

  let x = NUT_START_X;
  const nuts: Omit<Nut, "collected">[] = [];

  for (let i = 0; i < nutCount; i++) {
    const tier = tiers[i];
    const spacing = 2.6 + rand() * 1.8;
    nuts.push({
      id: `n${i + 1}`,
      x,
      y: tier === "low" ? LOW_NUT_Y + rand() * 0.15 : HIGH_NUT_Y + rand() * 0.12,
      tier,
      step: tier === "low" ? 1 : 2,
    });
    x += spacing;
  }

  const props: SceneryProp[] = [];
  const kinds: SceneryProp["kind"][] = ["tree", "bush", "rock", "flower"];
  for (let px = 0; px < x + 6; px += 1.2 + rand() * 2) {
    if (rand() > 0.55) continue;
    props.push({
      id: `p${props.length}`,
      x: px + rand() * 2,
      kind: kinds[Math.floor(rand() * kinds.length)],
      scale: 0.7 + rand() * 0.8,
      z: -0.5 - rand() * 1.5,
    });
  }

  const palettes = [
    { skyTop: "#1a1820", skyBottom: "#2a2838", grass: "#3d6b3a" },
    { skyTop: "#141820", skyBottom: "#243040", grass: "#456b42" },
    { skyTop: "#181420", skyBottom: "#282038", grass: "#3a6840" },
    { skyTop: "#101820", skyBottom: "#203028", grass: "#4a7045" },
  ];
  const palette = palettes[Math.floor(rand() * palettes.length)];

  return {
    seed,
    nuts,
    props,
    ...palette,
    nutSpacing: HORIZONTAL_COLLECT,
  };
}

export function worldLength(config: WorldConfig): number {
  const last = config.nuts[config.nuts.length - 1];
  return last ? last.x + 6 : 20;
}

export function createNutsFromWorld(config: WorldConfig): Nut[] {
  return config.nuts.map((n) => ({ ...n, collected: false }));
}
